/**
 * "Ask about Alice" — a small grounded assistant.
 *
 * How it works
 *   1. The knowledge base is built from content/content.js at load, so the
 *      assistant can only ever talk about what is already published on this page.
 *   2. The question is matched against those passages locally, and the best few
 *      are sent to a Cloudflare Worker along with the question.
 *   3. The Worker holds the Anthropic API key and asks Claude to answer using
 *      only those passages. No key is ever present in the browser.
 *   4. The passages used are shown under the answer as links into the page.
 *
 * With no Worker configured (window.ALICE_CONFIG.assistantEndpoint === ""), it
 * runs in local mode: it still answers from the same passages, but by quoting
 * them rather than writing prose, and it says so.
 *
 * The character artwork comes from scripts/character.js and is not part of this
 * file's job.
 */

import { createCharacter } from "./character.js";
import { el, entryHref } from "./render.js";

/* Anchors have to work from item.html as well as from the homepage. */
const HOME = /\/item\.html$/.test(location.pathname) ? "index.html" : "";

const MAX_QUESTION = 500;
const MAX_PASSAGES = 6;
const MAX_HISTORY = 8;

const STOPWORDS = new Set(
  (
    "a about all also an and any anything are as at back be been being by can could did do does for from get give had has have he her hers him his how i in into is it its just know like made make many me more much my need of on one or out over please said say she should some something tell than that the their them then there these they thing things this those to two us want was were what when where which who whom why will with would you your alice jiang"
  ).split(" ")
);

/* ---------------- knowledge base ---------------- */

/* `keywords` are matched against but never shown or sent — they're just there so
   ordinary phrasings ("how do I get in touch", "who is she") find the right
   passage. */
function passage(title, href, section, parts, keywords = "") {
  const text = parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
  return text ? { title, href, section, text, keywords } : null;
}

export function buildKnowledge(data) {
  const { site, intro, experience, atPenn, work, about, press } = data;
  const education = data.education || [];
  const highSchool = data.highSchool || [];
  const awards = data.awards || [];
  const out = [];

  out.push(
    passage(
      "Introduction",
      `${HOME}#intro`,
      "Introduction",
      [site.description, ...(intro.paragraphs || [])],
      "who bio background overview summary studying major school college university now currently"
    )
  );

  for (const block of intro.sidebar || []) {
    out.push(
      passage(block.label, `${HOME}#intro`, "Introduction", [
        `${block.label}: ${(block.lines || []).join("; ")}.`,
      ])
    );
  }

  /* Substance first, metadata last — the local answer quotes the opening
     sentences, and they should say something. */
  /* Sources link to the entry's own page, which is where the detail lives —
     unless the caller names a page the entry is shown on in full. */
  const entryPassage = (item, sectionName, href) =>
    passage(item.org || item.name, href || entryHref(item), sectionName, [
      item.summary,
      ...(item.body || []),
      ...(item.points || []),
      item.role || item.kind ? `Her role: ${item.role || item.kind}.` : "",
      item.date ? `Dates: ${item.date}.` : "",
      item.place ? `Location: ${item.place}.` : "",
    ]);

  for (const item of experience) out.push(entryPassage(item, "Experience"));
  for (const item of atPenn) out.push(entryPassage(item, "At Penn"));
  for (const item of work) out.push(entryPassage(item, "Selected work"));

  /* Everything from before Penn lives on the archive page. */
  for (const item of highSchool) out.push(entryPassage(item, "Archive", "archive.html"));
  for (const item of education) out.push(entryPassage(item, "Education", "archive.html"));

  for (const group of awards) {
    out.push(
      passage(
        `Awards — ${group.group}`,
        "archive.html",
        "Archive",
        (group.items || []).map((row) => `${row.when ? row.when + ": " : ""}${row.what}`),
        "award prize place placement won win honor honour scholarship medal competition"
      )
    );
  }

  if (data.alsoDid && data.alsoDid.length) {
    out.push(
      passage("Also did in high school", "archive.html", "Archive", [data.alsoDid.join(". ") + "."])
    );
  }

  if (press && press.length) {
    out.push(
      passage(
        "Press",
        "",
        "Press",
        press.map((row) =>
          `${row.publication}${row.date ? ` (${row.date})` : ""}: “${row.title}”.`
        ),
        "press news article media coverage featured interview newspaper published"
      )
    );
  }

  out.push(
    passage(
      "About",
      `${HOME}#about`,
      "About & contact",
      about.paragraphs || [],
      "personal hobbies interests hometown michigan fun outside free time puzzles"
    )
  );
  out.push(
    passage(
      "Contact",
      `${HOME}#about`,
      "About & contact",
      [(about.contact || []).map((c) => `${c.label}: ${c.value}`).join(". ") + "."],
      "contact email reach touch message hire recruit resume cv linkedin hello connect"
    )
  );

  return out.filter(Boolean);
}

function tokenize(value) {
  return String(value)
    .toLowerCase()
    .split(/[^a-z0-9&]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function retrieve(knowledge, question, limit = MAX_PASSAGES) {
  const terms = tokenize(question);
  if (!terms.length) return knowledge.slice(0, 3);

  const scored = knowledge.map((item) => {
    const haystack = `${item.title} ${item.section} ${item.keywords || ""} ${item.text}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (!haystack.includes(term)) continue;
      score += 1;
      if (item.title.toLowerCase().includes(term)) score += 2;
    }
    return { item, score };
  });

  return scored
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.item);
}

/* ---------------- local (no-backend) answering ---------------- */

function localAnswer(matches, question) {
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
    text: `${lead}\n\nThat’s straight from the page rather than written for your question — the writing assistant isn’t connected right now.`,
    sources: matches.slice(0, 3),
  };
}

/* ---------------- UI ---------------- */

const SUGGESTIONS = [
  "What is Alice working on right now?",
  "Tell me about SlimeTime.",
  "What does she do at Penn?",
  "How do I get in touch?",
];

export function mountAssistant(root, data) {
  const config = window.ALICE_CONFIG || {};
  if (config.assistantEnabled === false) return;

  const knowledge = buildKnowledge(data);
  const endpoint = (config.assistantEndpoint || "").trim();
  const history = [];
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
        text:
          "An AI assistant, not a message to Alice. It answers only from what’s published on this page and can still be wrong — check the sources. Questions are sent to Anthropic’s API to write the answer and aren’t stored.",
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
    "Hi — I’m an AI assistant for Alice’s site. Ask me about her experience, her work at Penn, or a project, and I’ll answer from what’s written here and point you to the section it came from."
  );

  /* ---- asking ---- */

  async function ask(question) {
    const trimmed = question.trim().slice(0, MAX_QUESTION);
    if (!trimmed || busy) return;

    busy = true;
    sendButton.disabled = true;
    input.value = "";
    addMessage("user", trimmed);

    const matches = retrieve(knowledge, trimmed);
    panelCharacter.setState("thinking");
    launcherCharacter.setState("thinking");
    const pending = addMessage("assistant", "Looking through the page…");

    try {
      let result;
      if (!endpoint) {
        result = localAnswer(matches, trimmed);
      } else {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: trimmed,
            history: history.slice(-MAX_HISTORY),
            passages: matches.map((m) => ({ title: m.title, section: m.section, text: m.text })),
          }),
        });

        if (!response.ok) {
          const detail = await response.json().catch(() => ({}));
          throw new Error(detail.error || `The assistant service returned ${response.status}.`);
        }

        const payload = await response.json();
        if (!payload.answer) throw new Error("The assistant service sent an empty answer.");

        const cited = new Set((payload.sources || []).map(String));
        result = {
          text: payload.answer,
          sources: cited.size ? matches.filter((m) => cited.has(m.title)) : matches.slice(0, 3),
        };
      }

      pending.remove();
      addMessage("assistant", result.text, result.sources);
      history.push({ role: "user", content: trimmed });
      history.push({ role: "assistant", content: result.text });
    } catch (error) {
      pending.remove();
      addMessage(
        "error",
        `${error.message || "Something went wrong."} Nothing was lost — try again in a moment, or read the section directly. If it keeps failing, the assistant service is probably down.`
      );
    } finally {
      busy = false;
      sendButton.disabled = false;
      panelCharacter.setState("idle");
      launcherCharacter.setState("idle");
      input.focus();
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
