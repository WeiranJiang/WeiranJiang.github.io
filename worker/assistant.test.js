import assert from "node:assert/strict";
import { test } from "node:test";
import { ASSISTANT_LIMITS } from "../scripts/assistant-knowledge.js";
import worker from "./src/index.js";

const ORIGIN = "https://weiranjiang.github.io";
const ENDPOINT = "https://assistant.example/";
const env = {
  ALLOWED_ORIGINS: ORIGIN,
  GEMINI_API_KEY: "test-key",
  ASK_RATE_LIMITER: { limit: async () => ({ success: true }) },
};
const question = "What made it different?";
const history = [
  { role: "user", content: "Tell me about the Chrome study extension." },
  { role: "assistant", content: "Alice built it to track study time." },
];

function ask(body, overrides = {}) {
  return new Request(ENDPOINT, {
    method: "POST",
    headers: { Origin: ORIGIN, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    ...overrides,
  });
}

test("site requests receive CORS and privacy headers", async () => {
  const preflight = await worker.fetch(new Request(ENDPOINT, {
    method: "OPTIONS",
    headers: { Origin: ORIGIN, "Access-Control-Request-Method": "POST" },
  }), env);
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get("Access-Control-Allow-Origin"), ORIGIN);
  assert.equal(preflight.headers.get("Access-Control-Allow-Methods"), "POST");

  const denied = await worker.fetch(ask({ question }, {
    headers: { Origin: "https://another-site.example", "Content-Type": "application/json" },
  }), env);
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.has("Access-Control-Allow-Origin"), false);
  assert.equal(denied.headers.get("Cache-Control"), "no-store");
  assert.equal(denied.headers.get("X-Content-Type-Options"), "nosniff");
});

test("validates the request before calling Gemini", async (t) => {
  const upstream = t.mock.method(globalThis, "fetch", async () => Response.json({}));
  assert.equal((await worker.fetch(ask(null), env)).status, 400);
  assert.equal((await worker.fetch(ask({}, { body: "{" }), env)).status, 400);
  assert.equal((await worker.fetch(ask({ question: 42 }), env)).status, 400);
  assert.equal((await worker.fetch(ask({ question: "a".repeat(ASSISTANT_LIMITS.question + 1) }), env)).status, 400);
  assert.equal((await worker.fetch(ask({ question }, {
    headers: { Origin: ORIGIN, "Content-Type": "text/plain" },
  }), env)).status, 415);

  const chunk = new TextEncoder().encode("😀".repeat(4_000));
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(chunk);
      controller.enqueue(chunk);
      controller.close();
    },
  });
  assert.equal((await worker.fetch(ask({}, { body, duplex: "half" }), env)).status, 413);
  assert.equal(upstream.mock.callCount(), 0);
});

test("respects the Cloudflare limit before calling Gemini", async (t) => {
  const upstream = t.mock.method(globalThis, "fetch", async () => Response.json({}));
  const result = await worker.fetch(ask({ question }, {
    headers: { Origin: ORIGIN, "Content-Type": "application/json", "CF-Connecting-IP": "192.0.2.1" },
  }), {
    ...env,
    ASK_RATE_LIMITER: {
      async limit({ key }) {
        assert.equal(key, "192.0.2.1");
        return { success: false };
      },
    },
  });
  assert.equal(result.status, 429);
  assert.equal(result.headers.get("Retry-After"), "60");
  assert.equal(upstream.mock.callCount(), 0);
});

test("grounds follow-ups in published sources and filters citations", async (t) => {
  const title = "Google Chrome Study Extension";
  const legacyText = "Example passage supplied by an older client.";
  const upstream = t.mock.method(globalThis, "fetch", async (url, request) => {
    assert.equal(new URL(url).origin, "https://generativelanguage.googleapis.com");
    assert.equal(request.redirect, "error");
    assert.equal(request.headers["x-goog-api-key"], env.GEMINI_API_KEY);
    const payload = JSON.parse(request.body);
    const system = payload.systemInstruction.parts[0].text;
    assert.ok(system.includes(title));
    assert.ok(system.includes("Google Calendar"));
    assert.ok(!system.includes(legacyText));
    assert.ok(!JSON.stringify(payload).includes(legacyText));
    assert.equal(payload.contents.length, 1);
    assert.equal(payload.contents[0].role, "user");
    assert.deepEqual(JSON.parse(payload.contents[0].parts[0].text), { question, recentConversation: history });

    return Response.json({ candidates: [{ content: { parts: [
      { thought: true, text: "Internal reasoning." },
      { text: "It can use Google Calendar to track study time.\nSOURCES: " + title + " | Unknown source" },
    ] } }] });
  });
  const result = await worker.fetch(ask({
    question,
    history,
    previousSourceTitles: [title],
    passages: [{ title, text: legacyText }],
  }), env);
  assert.equal(upstream.mock.callCount(), 1);
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await result.json(), {
    answer: "It can use Google Calendar to track study time.",
    sources: [title],
    cited: true,
  });
});

test("keeps provider error details out of logs and responses", async (t) => {
  const log = t.mock.method(console, "error", () => {});
  t.mock.method(globalThis, "fetch", async () => Response.json({
    error: { message: "Example provider diagnostic", details: [
      { violations: [{ quotaId: "GenerateRequestsPerDay" }] },
      { "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "30s" },
    ] },
  }, { status: 429 }));

  const result = await worker.fetch(ask({ question }), env);
  assert.equal(result.status, 429);
  assert.equal(result.headers.get("Retry-After"), "30");
  assert.equal((await result.json()).retryable, false);
  assert.deepEqual(log.mock.calls.map(({ arguments: args }) => args), [["Gemini request failed", 429]]);
});
