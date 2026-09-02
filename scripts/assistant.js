/**
 * "Ask about Alice" — a small grounded assistant.
 *
 * How it works
 *   1. The knowledge base is built from content/content.js at load, so the
 *      assistant can only ever talk about what is already published on this page.
 *      A few facts are worked out from it rather than published — today's date,
 *      her year of school, which roles are still running — so that questions a
 *      step to the side of the page ("what year is she in?") have something to
 *      land on. See "derived facts" below.
 *   2. The question is matched against those passages locally, and the best few
 *      are sent to a Cloudflare Worker along with the question.
 *   3. The Worker holds the Gemini API key and asks the model to answer using
 *      only those passages, plus — on questions that call for them — a few of
 *      Alice's own notes, which live in the Worker and never come near the
 *      browser (worker/src/aliceKnowledge.js). No key is ever present here.
 *   4. The passages used are shown under the answer as links into the page. An
 *      answer written out of the notes has no section to point at, and shows
 *      no links rather than the nearest guess.
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

/* Anchors point at sections of the homepage, so everywhere that isn't the
   homepage has to say so. Entry pages are `<id>.html` at the root, which looks
   like any other page here — hence testing for home rather than for them. */
const HOME = /\/(index\.html)?$/.test(location.pathname) ? "" : "index.html";

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

/**
 * What actually gets sent. Retrieval decides what's relevant, but the derived
 * facts go along regardless: the model needs today's date to reason about "now",
 * and a question like "is she still doing that?" carries no word that would ever
 * match the passage holding the answer.
 *
 * Retrieval itself is left alone, so local mode can still tell a question it
 * knows nothing about from one it does.
 */
function withDerived(knowledge, matches) {
  const pinned = knowledge.filter((item) => item.pinned && !matches.includes(item));
  return [...pinned, ...matches];
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
    text: `${lead}\n\nThat’s quoted from the page rather than written for your question — the part that writes answers isn’t switched on yet.`,
    sources: matches.slice(0, 3),
  };
}

/* ---------------- UI ---------------- */

const SUGGESTIONS = [
  "What is Alice working on right now?",
  "What year of school is she in?",
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
    "Hi — I’m an AI assistant for Alice’s site. Ask me anything, and I’ll answer from what’s written here and point you to the section it came from."
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
            passages: withDerived(knowledge, matches).map((m) => ({
              title: m.title,
              section: m.section,
              text: m.text,
            })),
          }),
        });

        if (!response.ok) {
          const detail = await response.json().catch(() => ({}));
          const failure = new Error(detail.error || `The assistant service returned ${response.status}.`);
          /* Some failures don't clear by trying again — a spent daily quota, for
             one. The Worker says which, and the advice below follows it. */
          failure.retryable = detail.retryable !== false;
          throw failure;
        }

        const payload = await response.json();
        if (!payload.answer) throw new Error("The assistant service sent an empty answer.");

        /* The answer names the passages it used. An empty list is only worth
           believing when the backend says the model actually gave one: not
           every answer comes off the page — the Worker holds notes of Alice's
           own that have no section to link to — and "nothing on the page"
           should show no links rather than the nearest three. Without a list at
           all, the old guess is still the best available. */
        const cited = new Set((payload.sources || []).map(String));
        const listed = payload.cited === true;
        result = {
          text: payload.answer,
          sources: cited.size
            ? matches.filter((m) => cited.has(m.title))
            : listed
              ? []
              : matches.slice(0, 3),
        };
      }

      pending.remove();
      addMessage("assistant", result.text, result.sources);
      history.push({ role: "user", content: trimmed });
      history.push({ role: "assistant", content: result.text });
    } catch (error) {
      pending.remove();
      /* Nothing to add when the failure won't clear by retrying — the Worker's
         own message already says everything useful. */
      const advice =
        error.retryable === false
          ? ""
          : " Nothing was lost — try again in a moment, or read the section directly. If it keeps failing, the assistant service is probably down.";
      addMessage("error", `${error.message || "Something went wrong."}${advice}`);
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
