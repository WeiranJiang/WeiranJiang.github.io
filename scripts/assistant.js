/* Ask about Alice uses published site content to ground Gemini's replies.
   The Cloudflare Worker holds the API key and generates the answers. */

import { createCharacter } from "./character.js";
import { el } from "./render.js";
import {
  ASSISTANT_LIMITS, buildKnowledge, rankPassages, selectPassages,
} from "./assistant-knowledge.js";

/* Anchors point at sections of the homepage, so everywhere that isn't the
   homepage has to say so. Entry pages are `<id>.html` at the root, which looks
   like any other page here — hence testing for home rather than for them. */
const HOME = /\/(index\.html)?$/.test(location.pathname) ? "" : "index.html";

const {
  question: MAX_QUESTION, historyTurns: MAX_HISTORY, historyText: MAX_HISTORY_TEXT,
  bodyBytes: MAX_REQUEST_BYTES, passageText: MAX_PASSAGE_TEXT,
} = ASSISTANT_LIMITS;

function buildRequest(question, history, passages, previousSources) {
  const body = {
    question,
    history: history.slice(-MAX_HISTORY),
    previousSourceTitles: previousSources.slice(0, 2).map(({ title }) => title),
    // An older Worker still needs these public passages during deployment.
    passages: passages.map(({ title, text }) => ({ title, text: text.slice(0, MAX_PASSAGE_TEXT) })),
  };
  const encoder = new TextEncoder();
  let serialized = JSON.stringify(body);
  while (encoder.encode(serialized).length > MAX_REQUEST_BYTES) {
    if (body.passages.length) body.passages.pop();
    else if (body.history.length) body.history.splice(0, 2);
    else break;
    serialized = JSON.stringify(body);
  }
  return serialized;
}

/* ---------------- local (no-backend) answering ---------------- */

function localAnswer(matches) {
  if (!matches.length) {
    return {
      text:
        "I couldn’t find anything on this page about that. I only know what’s published here — try asking about Alice’s experience, her work at Penn, a project, or how to get in touch.",
      sources: [],
    };
  }
  const lead = matches
    .slice(0, 2)
    .map((m) => {
      const sentences = m.text.split(/(?<=[.!?])\s+/).slice(0, 3).join(" ");
      return `${m.title} — ${sentences}`;
    })
    .join("\n\n");
  return {
    text: `${lead}\n\nHere’s what Alice’s site says.`,
    sources: matches.slice(0, 3),
  };
}

/* ---------------- UI ---------------- */

const SUGGESTIONS = [
  "What is Alice working on right now?",
  "What year of school is she in?",
  "Tell me about the Chrome Extension Project.",
  "What does she do at Penn?",
  "How do I get in touch?",
];

export function mountAssistant(root, data) {
  const config = window.ALICE_CONFIG || {};
  if (config.assistantEnabled === false) return;

  const knowledge = buildKnowledge(data, { home: HOME });
  const endpoint = (config.assistantEndpoint || "").trim();
  const history = [];
  let previousSources = [];
  let busy = false;

  /* ---- launcher ---- */
  const launcherCharacter = createCharacter({ size: 26, label: "" });
  const launcher = el(
    "button",
    {
      class: "assistant-launcher",
      type: "button",
      "aria-expanded": "false",
      "aria-controls": "assistant-panel",
    },
    [
      launcherCharacter.node,
      el("span", { class: "assistant-launcher__text" }, [
        el("span", { text: "Ask about Alice" }),
        el("span", { class: "assistant-launcher__sub", text: "AI assistant" }),
      ]),
    ]
  );

  /* ---- panel ---- */
  const panelCharacter = createCharacter({ size: 26, label: "" });
  const log = el("div", {
    class: "assistant-log",
    id: "assistant-log",
    role: "log",
    "aria-live": "polite",
    "aria-relevant": "additions text",
    tabindex: "0",
  });

  const input = el("textarea", {
    id: "assistant-input",
    rows: "1",
    placeholder: "Ask a question…",
    maxlength: String(MAX_QUESTION),
    "aria-label": "Ask a question about Alice",
  });

  const sendButton = el("button", { class: "btn btn--solid assistant-send", type: "submit" }, ["Ask"]);

  const form = el("form", { class: "assistant-form" }, [input, sendButton]);

  const suggestions = el(
    "div",
    { class: "assistant-suggestions" },
    SUGGESTIONS.map((q) => el("button", { type: "button", text: q }))
  );

  const closeButton = el("button", {
    class: "assistant-close",
    type: "button",
    "aria-label": "Close the assistant",
    text: "✕",
  });

  const panel = el(
    "div",
    {
      class: "assistant-panel",
      id: "assistant-panel",
      role: "dialog",
      "aria-labelledby": "assistant-title",
      "aria-describedby": "assistant-disclaimer",
      hidden: true,
    },
    [
      el("div", { class: "assistant-head" }, [
        panelCharacter.node,
        el("div", { class: "assistant-head__text" }, [
          el("p", { class: "assistant-head__title", id: "assistant-title" }, ["Ask about Alice"]),
          el("p", { class: "assistant-head__sub", text: "AI assistant · not Alice" }),
        ]),
        closeButton,
      ]),
      log,
      suggestions,
      form,
      el("p", {
        class: "assistant-foot",
        id: "assistant-disclaimer",
        text: endpoint
          ? "Questions and recent chat messages are sent to Google Gemini. Please leave out private details."
          : "Answers use Alice’s public site.",
      }),
    ]
  );

  root.replaceChildren(launcher, panel);

  /* ---- messages ---- */

  function addMessage(who, text, sources) {
    const node = el("div", { class: `msg msg--${who}` }, [
      el("span", { class: "msg__who", text: who === "user" ? "You" : who === "error" ? "Problem" : "Assistant" }),
      el("p", { class: "msg__text", text }),
    ]);
    if (sources && sources.length) {
      node.append(
        el(
          "div",
          { class: "msg__sources" },
          /* Some passages have no page to link to — show them as plain labels
             rather than as links that go nowhere. */
          sources.map((s) =>
            s.href
              ? el("a", { href: s.href, text: s.title })
              : el("span", { class: "msg__source-plain", text: s.title })
          )
        )
      );
    }
    log.append(node);
    log.scrollTop = log.scrollHeight;
    return node;
  }

  addMessage(
    "assistant",
    "Hi! Ask me about Alice’s work, projects, or life at Penn. You can ask follow-up questions, too."
  );

  /* ---- asking ---- */

  async function ask(question) {
    const trimmed = question.trim().slice(0, MAX_QUESTION);
    if (!trimmed || busy) return;

    busy = true;
    sendButton.disabled = true;
    input.value = "";
    addMessage("user", trimmed);

    const matches = rankPassages(knowledge, trimmed);
    panelCharacter.setState("thinking");
    launcherCharacter.setState("thinking");
    const pending = addMessage("assistant", "Looking through the page…");

    try {
      let result;
      if (!endpoint) {
        result = localAnswer(matches);
      } else {
        const passages = selectPassages(knowledge, trimmed, history, previousSources);
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: buildRequest(trimmed, history, passages, previousSources),
          credentials: "omit",
          referrerPolicy: "no-referrer",
          signal: AbortSignal.timeout(30_000),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || typeof payload?.answer !== "string" || !payload.answer.trim()) {
          const error = typeof payload?.error === "string" && payload.error;
          throw new Error(error || "I couldn’t get an answer right now. Try again in a moment.");
        }

        const cited = new Set(Array.isArray(payload.sources) ? payload.sources : []);
        result = {
          text: payload.answer,
          sources: knowledge.filter(({ title }) => cited.has(title)),
        };
        if (result.sources.length) previousSources = result.sources;
      }

      pending.remove();
      addMessage("assistant", result.text, result.sources);
      history.push({ role: "user", content: trimmed });
      history.push({ role: "assistant", content: result.text.slice(0, MAX_HISTORY_TEXT) });
      if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);
    } catch (error) {
      pending.remove();
      const message = error.name === "TimeoutError" || error instanceof TypeError
        ? "I couldn’t reach the assistant. Try again in a moment."
        : error.message;
      addMessage("error", message, matches.slice(0, 3));
      if (!input.value) input.value = trimmed;
    } finally {
      busy = false;
      sendButton.disabled = false;
      panelCharacter.setState("idle");
      launcherCharacter.setState("idle");
      if (!panel.hidden) input.focus();
    }
  }

  /* ---- open / close ---- */

  function open() {
    panel.hidden = false;
    launcher.hidden = true;
    launcher.setAttribute("aria-expanded", "true");
    panelCharacter.setState("wave");
    input.focus();
  }

  function close() {
    panel.hidden = true;
    launcher.hidden = false;
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus();
  }

  launcher.addEventListener("click", open);
  closeButton.addEventListener("click", close);

  /* Anything on the page marked data-ask-alice opens the panel — that's how the
     "Ask about Alice" button in the introduction works. #ask does the same, so
     the assistant can be linked to directly. */
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-ask-alice]")) {
      event.preventDefault();
      open();
    }
  });

  if (location.hash === "#ask") open();

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !panel.hidden) close();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    ask(input.value);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      ask(input.value);
    }
  });

  input.addEventListener("input", () => {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 110)}px`;
  });

  suggestions.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (button) ask(button.textContent);
  });
}
