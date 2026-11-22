/* Ask about Alice uses published site content to ground Gemini's replies.
   The Cloudflare Worker holds the API key and generates the answers. */

import { createCharacter } from "./character.js";
import { el, entryHref } from "./render.js";

/* Anchors point at sections of the homepage, so everywhere that isn't the
   homepage has to say so. Entry pages are `<id>.html` at the root, which looks
   like any other page here — hence testing for home rather than for them. */
const HOME = /\/(index\.html)?$/.test(location.pathname) ? "" : "index.html";

const MAX_QUESTION = 500;
const MAX_PASSAGES = 8;
const MAX_REQUEST_BYTES = 24_000;
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

/* ---------------- derived facts ----------------

   The site states facts. Visitors ask things one step to the side of them —
   "what year is she in", "is she still there", "how long did that run" — and
   the answer is arithmetic over what's already published rather than anything
   new. Doing that arithmetic here, in the browser, means it is right by
   construction instead of being left to the model to work out; the model is
   then only asked to read the result and say it in a sentence.

   The result is an ordinary passage, and it rides along with every question, so
   the assistant always knows what today is even when the question didn't look
   like it was about time. */

/* Named years only make sense for a four-year degree; anything else counts. */
const YEAR_NAMES = ["first-year", "sophomore", "junior", "senior"];
const ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth"];
const COUNTS = { 3: "three", 4: "four", 5: "five", 6: "six" };

const ordinal = (n) => ORDINALS[n - 1] || `${n}th`;

/**
 * Which year of a degree someone is in, from the year they finish and how long
 * the programme runs. No start date needed — the two together imply it.
 *
 * A US academic year runs August to May. June and July belong to neither: over
 * those the student has finished one year and not started the next, which is
 * what "rising junior" means and why it is worth a case of its own.
 *
 * @returns {{state: "in"|"summer"|"graduated"|"before", ...}}
 */
export function academicStanding(gradYear, programYears = 4, today = new Date()) {
  const month = today.getMonth();
  const calendarYear = today.getFullYear();

  /* August to December belong to the academic year that has just begun; January
     to May to the one that began last August. */
  const summer = month === 5 || month === 6;
  const startYear = month >= 7 ? calendarYear : calendarYear - 1;

  /* The academic year her first year began in. */
  const firstStart = gradYear - programYears;
  const index = startYear - firstStart + 1;

  const name = (n) =>
    programYears === 4 && YEAR_NAMES[n - 1] ? YEAR_NAMES[n - 1] : `${ordinal(n)}-year student`;

  if (index < 1) return { state: "before", firstStart, gradYear };

  /* In summer, `index` is the year she has just finished, not one she is in. */
  if (summer) {
    if (index >= programYears) return { state: "graduated", gradYear };
    return {
      state: "summer",
      finished: index,
      rising: index + 1,
      risingName: name(index + 1),
      gradYear,
    };
  }

  if (index > programYears) return { state: "graduated", gradYear };
  return { state: "in", index, name: name(index), startYear, programYears, gradYear };
}

/** Today's date, her year of school, and which roles are running — as prose. */
function rightNowPassage(data, today = new Date()) {
  const { site, experience = [], atPenn = [], work = [] } = data;
  const lines = [
    `Today's date is ${today.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}.`,
  ];

  const study = site.study;
  if (study && study.gradYear) {
    const standing = academicStanding(study.gradYear, study.programYears, today);
    if (standing.state === "in") {
      lines.push(
        `Alice is expected to graduate in ${standing.gradYear}, which makes her a ${standing.name} right now — her ${ordinal(standing.index)} year of ${COUNTS[standing.programYears] || standing.programYears}, in the ${standing.startYear}–${standing.startYear + 1} academic year.`
      );
    } else if (standing.state === "summer") {
      lines.push(
        `Alice is expected to graduate in ${standing.gradYear}. She finished her ${ordinal(standing.finished)} year in the spring, so over this summer she is a rising ${standing.risingName}.`
      );
    } else if (standing.state === "graduated") {
      lines.push(`Alice finished her degree in ${standing.gradYear}.`);
    }
  }

  /* "Present" in a date is what marks a role as still running — the same signal
     the page itself shows the reader. Everything else is listed with its dates
     rather than called finished: a bare year like "2026" doesn't say whether it
     is over, and that is a judgement to make from the dates, not to assert. */
  const all = [...experience, ...atPenn, ...work];
  const running = all.filter((item) => /present/i.test(item.date || ""));
  const rest = all.filter((item) => item.date && !/present/i.test(item.date));

  if (running.length) {
    lines.push(
      `Roles she holds right now, which the site marks as running to the present: ${running
        .map((i) => `${i.role || i.kind || "involved"} at ${i.org || i.name}`)
        .join("; ")}.`
    );
  }
  if (rest.length) {
    lines.push(
      `Everything else, with the dates the site gives: ${rest
        .map((i) => `${i.org || i.name} (${i.date})`)
        .join("; ")}.`
    );
  }

  const built = passage(
    "Where Alice is right now",
    `${HOME}#intro`,
    "Introduction",
    lines,
    "year school grade class standing freshman first-year sophomore junior senior undergrad undergraduate graduate graduation today date now current currently still age semester rising long since old"
  );
  /* Pinned: sent with every question, whatever the question was about. */
  if (built) built.pinned = true;
  return built;
}

export function buildKnowledge(data) {
  const { site, intro, experience, atPenn, work, about, press } = data;
  const education = data.education || [];
  const highSchool = data.highSchool || [];
  const awards = data.awards || [];
  const out = [];

  /* Worked out rather than published — see above. */
  out.push(rightNowPassage(data));

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

  // Give the model a map of the portfolio for broad and comparative questions.
  for (const [section, href, items, keywords] of [
    ["Experience overview", `${HOME}#experience`, experience, "career jobs internships employers roles finance banking compare"],
    ["At Penn overview", `${HOME}#penn`, atPenn, "clubs campus college involvement extracurricular activities leadership compare"],
    ["Projects overview", `${HOME}#work`, work, "projects project software built builds tools apps coding compare"],
  ]) {
    out.push(passage(section, href, section, items.map((item) =>
      `${item.org || item.name}: ${item.summary || item.role || item.kind || ""}`
    ), keywords));
  }

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
  return new Set(
    value.toLowerCase().match(/[a-z0-9]+/g)?.filter(
      (term) => term.length > 2 && !STOPWORDS.has(term)
    ) || []
  );
}

function rankPassages(knowledge, question) {
  const terms = tokenize(question);
  return knowledge
    .map((item) => {
      const title = tokenize(item.title);
      const topics = tokenize(`${item.section} ${item.keywords}`);
      const body = tokenize(item.text);
      let score = 0;
      for (const term of terms) {
        if (title.has(term)) score += 5;
        else if (topics.has(term)) score += 3;
        else if (body.has(term)) score += 1;
      }
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

export function selectPassages(knowledge, question, history, previousSources) {
  const latest = rankPassages(knowledge, question);
  const previousQuestion = history.at(-2)?.content || "";
  const earlier = rankPassages(knowledge, previousQuestion);
  const overview = knowledge.find(({ title }) => title === "Introduction");

  // Keep the newest question in charge while reserving space for the topic
  // of short follow-ups such as “How did she get into that?”
  return [...new Set([
    ...knowledge.filter(({ pinned }) => pinned),
    ...latest.slice(0, 3),
    ...previousSources.slice(0, 2),
    ...earlier.slice(0, 2),
    ...(overview ? [overview] : []),
    ...latest.slice(3),
  ])].slice(0, MAX_PASSAGES);
}

export function buildRequest(question, history, passages) {
  const body = {
    question,
    history: history.slice(-MAX_HISTORY),
    passages: passages.map(({ title, text }) => ({ title, text: text.slice(0, 2400) })),
  };
  const encoder = new TextEncoder();
  let serialized = JSON.stringify(body);
  while (encoder.encode(serialized).length > MAX_REQUEST_BYTES && body.passages.length) {
    body.passages.pop();
    serialized = JSON.stringify(body);
  }
  return { serialized, sent: passages.slice(0, body.passages.length) };
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

  const knowledge = buildKnowledge(data);
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
        text:
          "The AI assistant answers from what’s published on this page and can still be wrong.",
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
        const { serialized, sent } = buildRequest(trimmed, history, passages);
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: serialized,
          signal: AbortSignal.timeout(30_000),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.answer?.trim()) {
          throw new Error(payload?.error || "I couldn’t get an answer right now. Try again in a moment.");
        }

        const cited = new Set(payload.sources || []);
        result = {
          text: payload.answer,
          sources: sent.filter(({ title }) => cited.has(title)),
        };
        if (result.sources.length) previousSources = result.sources;
      }

      pending.remove();
      addMessage("assistant", result.text, result.sources);
      history.push({ role: "user", content: trimmed });
      history.push({ role: "assistant", content: result.text.slice(0, 2_000) });
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
