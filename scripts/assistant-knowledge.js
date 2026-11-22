import { entryHref } from "./entry-links.js";

export const ASSISTANT_LIMITS = {
  question: 500,
  historyTurns: 8,
  historyText: 2_000,
  bodyBytes: 24_000,
  passageText: 2_400,
};

const MAX_PASSAGES = 8;

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
function rightNowPassage(data, home, today) {
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
    `${home}#intro`,
    "Introduction",
    lines,
    "year school grade class standing freshman first-year sophomore junior senior undergrad undergraduate graduate graduation today date now current currently still age semester rising long since old"
  );
  /* Pinned: sent with every question, whatever the question was about. */
  if (built) built.pinned = true;
  return built;
}

export function buildKnowledge(data, { home = "index.html", today = new Date() } = {}) {
  const { site, intro, experience, atPenn, work, about, press } = data;
  const education = data.education || [];
  const highSchool = data.highSchool || [];
  const awards = data.awards || [];
  const out = [];

  /* Worked out rather than published — see above. */
  out.push(rightNowPassage(data, home, today));

  out.push(
    passage(
      "Introduction",
      `${home}#intro`,
      "Introduction",
      [site.description, ...(intro.paragraphs || [])],
      "who bio background overview summary studying major school college university now currently"
    )
  );

  for (const block of intro.sidebar || []) {
    out.push(
      passage(block.label, `${home}#intro`, "Introduction", [
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
    ["Experience overview", `${home}#experience`, experience, "career jobs internships employers roles finance banking compare"],
    ["At Penn overview", `${home}#penn`, atPenn, "clubs campus college involvement extracurricular activities leadership compare"],
    ["Projects overview", `${home}#work`, work, "projects project software built builds tools apps coding compare"],
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
      `${home}#about`,
      "About & contact",
      about.paragraphs || [],
      "personal hobbies interests hometown michigan fun outside free time puzzles"
    )
  );
  out.push(
    passage(
      "Contact",
      `${home}#about`,
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

export function rankPassages(knowledge, question) {
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
  const previousQuestion = history.findLast((message) => message.role === "user")?.content || "";
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
