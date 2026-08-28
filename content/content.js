/**
 * All site content lives here. Layout lives in styles.css and scripts/render.js.
 *
 * To add an entry: copy an existing object, edit the fields, and put it where you
 * want it in its array. Order in the array is the order on the page.
 * Every field except the ones marked required is optional — leave it out and the
 * renderer simply skips it. See CONTENT.md for the full field reference.
 *
 * Each entry gets its own page at item.html?id=<its id>. The homepage shows the
 * short version; the item page shows the photos, videos, and press.
 */

export const site = {
  name: "Alice Jiang",
  fullName: "Weiran Alice Jiang",
  title: "Alice Jiang",
  tagline:
    "Student at Penn in the Jerome Fisher M&T Program, studying finance at Wharton and computer science at SEAS.",
  description:
    "Alice Jiang is a Jerome Fisher M&T student at the University of Pennsylvania studying finance and computer science, working in investment banking and early-stage venture, and building small software projects on the side.",
  email: "wajiang@wharton.upenn.edu",
  location: "Philadelphia, PA",
};

/* ---------------------------------------------------------------------------
 * 1. Introduction
 * ------------------------------------------------------------------------ */

export const intro = {
  /* Each string is its own paragraph. */
  paragraphs: [
    "I’m a student at the University of Pennsylvania in the Jerome Fisher M&T Program, studying finance at Wharton and computer science at SEAS. Most of what I do sits somewhere between those two: reading a company’s numbers closely enough to have an opinion, then building the small thing that makes the work easier.",
    "Right now I’m an investment banking summer analyst at Arbor Lake Capital, co-president of the Wharton Undergraduate Entrepreneurship Club, and on the team at the M&T Innovation Fund. Before college I spent five years running a small e-commerce business, which is still the best product education I’ve had.",
  ],

  /* Compact buttons under the introduction. */
  links: [
    /* action: "ask" opens the assistant instead of navigating. */
    { label: "Ask about Alice", action: "ask" },
    { label: "Résumé", href: "assets/files/alice-jiang-resume.pdf", external: true },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/weiran-jiang", external: true },
    { label: "Email", href: "mailto:wajiang@wharton.upenn.edu" },
  ],

  /* Narrow sidebar. Keep it to short factual rows — it is not a second bio. */
  sidebar: [
    {
      label: "Studying",
      lines: [
        "BS Economics, Wharton — Finance",
        "BSE, SEAS — Computer Science",
        "Jerome Fisher M&T, expected 2029",
      ],
    },
    {
      label: "Currently",
      lines: [
        "IB Summer Analyst, Arbor Lake Capital",
        "Co-President, WUEC",
        "Team Member, M&T Innovation Fund",
      ],
    },
    {
      label: "Working with",
      lines: ["Python, Java, OCaml, React, Swift", "Firebase, Unity, Cloudflare, Excel"],
    },
    {
      label: "Otherwise",
      lines: ["Kayaking, tennis, piano", "Thrifting, doodling, wooden puzzles"],
    },
  ],
};

/* ---------------------------------------------------------------------------
 * 2. Experience
 * ------------------------------------------------------------------------ */

export const experience = [
  {
    id: "arbor-lake-capital",
    role: "Investment Banking Summer Analyst",
    org: "Arbor Lake Capital",
    date: "May 2026 — Present",
    place: "Ann Arbor, MI",
    summary:
      "Sell-side and buy-side M&A work for middle-market industrial clients.",
    points: [
      "Analyzed 4 acquisition targets for automotive clients on ownership structure, financial performance, and strategic fit.",
      "Screened 57 potential buyers for an air spring company sale on fit, financial capacity, and acquisition rationale.",
      "Built 3 presentations on target companies, researching business models and financials for the senior deal team.",
      "Prepared materials supporting a legal dispute related to a prior M&A deal and de-SPAC transaction.",
    ],
  },
  {
    id: "hologlitterpacks",
    role: "Founder",
    org: "HoloGlitterPacks",
    date: "Aug 2020 — Jan 2026",
    place: "Ann Arbor, MI",
    summary:
      "An e-commerce business I started at fifteen and ran through my first year of college.",
    body: [
      "It started with $50 and a vague sense that the sticker packs I wanted didn’t exist at a price I’d pay. Five and a half years later it had turned over 15K orders and $65K in net profit, all of it run out of my bedroom around school.",
      "The interesting part was never the product. It was building pricing and cost models that survived contact with real demand, watching conversion data to work out which listings were carrying the shop, and learning that a margin you don’t measure is a margin you don’t have.",
    ],
    points: [
      "Grew from $50 of starting capital to $65K net profit across 15K orders, building the pricing and cost models and managing the full P&L.",
      "Earned 2,500 five-star reviews by reading conversion and demand data to refine the product mix and listings.",
    ],
    images: [
      {
        src: "assets/images/etsy4.png",
        alt: "The HoloGlitterPacks seller dashboard, showing lifetime views, visits, orders, and revenue",
        caption: "The shop dashboard, five years in.",
      },
    ],
  },
  {
    id: "penn-sfcu",
    role: "Operations Committee",
    org: "University of Pennsylvania Student Federal Credit Union",
    date: "Feb 2026 — May 2026",
    place: "Philadelphia, PA",
    summary: "Day-to-day operations for a $6M AUM student-run financial institution.",
    points: [
      "Processed deposits, withdrawals, and account services, and monitored transaction activity under federal regulations.",
    ],
  },
];

/* ---------------------------------------------------------------------------
 * 3. At Penn
 * ------------------------------------------------------------------------ */

export const atPenn = [
  {
    id: "wuec",
    role: "Co-President, VC Committee Member",
    org: "Wharton Undergraduate Entrepreneurship Club",
    date: "Oct 2025 — Present",
    place: "Philadelphia, PA",
    summary:
      "WUEC runs Penn’s undergraduate entrepreneurship programming — treks, hackathons, and an investment committee that writes real memos.",
    body: [
      "The trek is the piece I’m proudest of: 26 students to New York for a day of meetings at a16z, Primary Venture Partners, Picus Capital, and M13. Organizing it meant pitching four firms on why a room of undergraduates was worth an hour of their afternoon, then building a schedule that let people actually ask questions.",
    ],
    points: [
      "Organized and led a 26-student NYC venture trek with visits to a16z, Primary Venture Partners, Picus Capital, and M13.",
      "Wrote investment memos evaluating startups from an 80-applicant competition run with Center City Ventures.",
      "Organized the Imagine.Dev hackathon for 50 participants and designed the project-evaluation criteria.",
    ],
    images: [
      {
        src: "assets/img/wuec-nyc-trek-group.jpg",
        alt: "WUEC members standing together outside a building on the NYC venture trek",
        caption: "Outside one of the day’s stops on the NYC trek.",
      },
      {
        src: "assets/img/wuec-nyc-trek-boardroom.jpg",
        alt: "WUEC members around a boardroom table during the NYC trek",
        caption: "26 students, four firms, one long day of meetings.",
      },
      {
        src: "assets/img/wuec-trek-poster.jpg",
        alt: "Poster for the WUEC NY VC Trek on April 3rd, listing visits to Primary Ventures, a16z, M13, and Picus Capital",
        caption: "The sign-up poster that started it.",
      },
    ],
  },
  {
    id: "mtif",
    role: "Team Member",
    org: "Management and Technology Innovation Fund",
    date: "Oct 2025 — Present",
    place: "Philadelphia, PA",
    summary:
      "MTIF invests in student-founded companies at Penn and supports them afterwards.",
    points: [
      "Evaluated 9 of 70 Penn startup applicants using standardized due diligence frameworks, helping direct $15K across 3 portfolio investments.",
      "Served on the Cengine portfolio team during its Fortune 500 partnership with Cummins.",
    ],
  },
  {
    id: "moso-capital",
    role: "Investment Analyst, Comma Capital Team",
    org: "Moso Capital",
    date: "Feb 2026 — Present",
    place: "Philadelphia, PA",
    points: [
      "Evaluated 15 startups on business model, market opportunity, and competitive positioning.",
      "Helped build a Penn founder pipeline by identifying student-led ventures and tracking investment opportunities.",
    ],
  },
  {
    id: "wharton-finance-clubs",
    role: "Committee Member",
    org: "Wharton Undergraduate Finance Club & Wharton Hedge Fund Club",
    date: "Oct 2025 — Present",
    place: "Philadelphia, PA",
    points: [
      "Produced weekly market updates and long/short recommendations using DCF and comparable-company valuation.",
    ],
  },
];

/* ---------------------------------------------------------------------------
 * 4. Selected work
 * ------------------------------------------------------------------------ */

export const work = [
  {
    id: "slimetime",
    name: "SlimeTime",
    kind: "Personal project",
    date: "2026",
    summary:
      "A study tracker that turns focus hours into a small creature you look after.",
    body: [
      "SlimeTime is a study timer with a stopwatch and a countdown, a task list, and per-subject tracking. Hours logged roll up into a stats page — focus hours, a study streak, a weekly study map, and a radar chart across the subjects you choose to track. It syncs with Google Calendar so events matching a subject keyword are counted automatically.",
      "The other half is the part that makes me actually open it. Focus time earns Dewdrops, Dewdrops buy items in a shop, and items feed attribute XP — healing, strategy, magic, martial arts, stealth, swordsmanship — which level up a slime with a class and an adventurer rank. It was an experiment in whether a progress system could make a study log something I’d keep using, and so far it has.",
    ],
    images: [
      {
        src: "assets/img/slimetime-stats.png",
        alt: "SlimeTime stats page showing focus hours, study streak, weekly study map, per-subject breakdown, and a radar chart",
        caption: "The stats page: focus hours, streak, study map, and per-subject radar.",
      },
      {
        src: "assets/img/slimetime-home.png",
        alt: "SlimeTime home screen showing the slime, its level, adventurer rank, and attribute XP bars",
        caption: "Home: your slime, its class and rank, and attribute XP earned from focus time.",
      },
    ],
  },
  {
    id: "solostep",
    name: "SoloStep",
    kind: "Lemelson-MIT InvenTeam",
    date: "2024",
    place: "Ypsilanti, MI",
    summary:
      "A mobility prototype for older adults, built with a high school InvenTeam and presented at EurekaFest.",
    body: [
      "SoloStep came out of the EMUiNVENT InvenTeam, a Lemelson-MIT funded team of high school students working on a device to help people with limited mobility move between sitting, standing, and lying down without another person there to help.",
      "I worked with students, mentors, and engineers to take a practical problem through prototyping to a working demonstration, and presented the result at EurekaFest at MIT. I also won the Lemelson-MIT EurekaFest essay award that year.",
    ],
    images: [
      {
        src: "assets/images/MIT1.png",
        alt: "Wiring diagram of the SoloStep control system: an Arduino board connected to ultrasonic sensors and four motors",
        caption: "The control wiring, worked out before anything was built.",
      },
      {
        src: "assets/images/MIT3.jpg",
        alt: "Four members of the EMUiNVENT InvenTeam standing beside the SoloStep poster at EurekaFest",
        caption: "The EMUiNVENT InvenTeam at EurekaFest, MIT.",
      },
      {
        src: "assets/img/solostep-sticker.jpg",
        alt: "A SoloStep sticker: a line drawing of a foot stepping, above the words SoloStep — Seize the Movement",
        caption: "The team’s mark. Seize the movement.",
      },
    ],
  },
  {
    id: "bridge-design",
    name: "Bridge Design",
    kind: "Science Olympiad",
    date: "2021 — 2025",
    place: "Saline, MI",
    summary:
      "Years of building balsa bridges that weighed almost nothing and held a great deal.",
    body: [
      "Structure, material choice, and joint geometry, tested to failure over and over. Every build started as a drawing with the member sizes worked out first, because balsa is unforgiving about weight you spend in the wrong place.",
      "Part of 56 Science Olympiad placements across invitational, regional, state, and national competitions.",
    ],
    images: [
      {
        src: "assets/images/bridge7.JPG",
        alt: "Alice at a workbench covered in balsa, holding a partly built bridge",
        caption: "The workbench, mid-build.",
      },
      {
        src: "assets/images/bridge2.png",
        alt: "Hand-drawn top, side, and bottom views of a bridge with dimensions and member sizes",
        caption: "Plans for a 47 × 14 cm build, drawn before cutting anything.",
      },
      {
        src: "assets/img/science-olympiad-medals.jpg",
        alt: "A pile of Science Olympiad medals, lanyards, and place ribbons spread across a table",
        caption: "Four years of Science Olympiad, in one box.",
      },
    ],
  },
  {
    id: "saline-nhs",
    name: "Saline National Honor Society",
    kind: "Community",
    place: "Saline, MI",
    summary: "Volunteering through high school, including food-drive sorting at a local pantry.",
    images: [
      {
        src: "assets/img/nhs-food-drive.jpg",
        alt: "Students sorting donated cans and boxes into postal bins at a food pantry",
        caption: "Sorting a food drive into the pantry’s bins.",
      },
    ],
  },
];

/* ---------------------------------------------------------------------------
 * 5. Archive — chronological record, newest year first.
 * ------------------------------------------------------------------------ */

export const archive = [
  {
    year: "2026",
    entries: [
      { when: "May", what: "Started as an investment banking summer analyst at Arbor Lake Capital.", tag: "Work" },
      { when: "Apr", what: "Led the WUEC venture trek to New York — Primary Ventures, a16z, M13, and Picus Capital.", tag: "Penn" },
      { when: "Feb", what: "Joined Moso Capital as an investment analyst on the Comma Capital team.", tag: "Penn" },
      { when: "Feb", what: "Joined the Operations Committee of the Penn Student Federal Credit Union.", tag: "Penn" },
      { when: "Jan", what: "Wound down HoloGlitterPacks after five and a half years and 15K orders.", tag: "Project" },
    ],
  },
  {
    year: "2025",
    entries: [
      { when: "Oct", what: "Became co-president of the Wharton Undergraduate Entrepreneurship Club.", tag: "Penn" },
      { when: "Oct", what: "Joined the M&T Innovation Fund, and the Wharton Finance and Hedge Fund clubs.", tag: "Penn" },
      { when: "Aug", what: "Started at Penn in the Jerome Fisher M&T Program.", tag: "Milestone" },
      { when: "Jun", what: "Graduated from Saline High School.", tag: "Milestone" },
      { when: "2025", what: "National Merit Scholarship, and the Swartz Scholarship for Entrepreneurs.", tag: "Award" },
    ],
  },
  {
    year: "2024",
    entries: [
      { when: "2024", what: "Lemelson-MIT EurekaFest essay winner; presented SoloStep with the InvenTeam.", tag: "Award" },
      { when: "Jun", what: "Began coursework at Oakland University (OUSMI) and Washtenaw Community College.", tag: "Milestone" },
      { when: "2024", what: "Lila Howard Make-a-Difference Scholarship.", tag: "Award" },
    ],
  },
  {
    year: "2021 — 2024",
    entries: [
      { when: "2021—25", what: "56 Science Olympiad placements across invitational, regional, state, and national competitions.", tag: "Award" },
      { when: "2023", what: "Third place, BPA Startup Enterprise.", tag: "Award" },
      { when: "2020", what: "Started HoloGlitterPacks with $50.", tag: "Project" },
    ],
  },
];

/* ---------------------------------------------------------------------------
 * Press — shown at the end of the Archive.
 *
 * `item` is optional. When it matches an entry's id, the article also appears on
 * that entry's page. Leave it off and the article only shows in the Archive.
 * ------------------------------------------------------------------------ */

export const press = [
  {
    publication: "MLive",
    title: "4 Michigan teens invent ‘Sitter Upper’ for seniors, will showcase work at MIT",
    date: "Apr 2024",
    href: "https://www.mlive.com/news/ann-arbor/2024/04/4-michigan-teens-invent-sitter-upper-for-seniors-will-showcase-work-at-mit.html",
    item: "solostep",
  },
  {
    publication: "Lemelson-MIT",
    title: "EMUiNVENT InvenTeam",
    href: "https://lemelson.mit.edu/teams/emuinvent-inventeam",
    item: "solostep",
  },
  {
    publication: "Ypsilanti Press",
    title: "Ypsilanti, Ann Arbor teens invent ‘Sitter Upper’ for seniors",
    href: "https://ypsilantipressllc.town.news/g/ypsilanti-mi/n/248083/ypsilanti-ann-arbor-teens-invent-sitter-upper-seniors",
    item: "solostep",
  },
  {
    publication: "The Saline Post",
    title: "Saline High School Science Olympiad qualifies for states",
    href: "https://thesalinepost.com/g/saline-mi/n/150372/saline-high-school-science-olympiad-qualifies-states-saline-middle-school-team",
    item: "bridge-design",
  },
  {
    publication: "The Sun Times News",
    title: "Saline National Honor Society: building a better community one volunteer at a time",
    href: "https://thesuntimesnews.com/saline-national-honor-society-building-a-better-community-one-volunteer-at-a-time/",
    item: "saline-nhs",
  },
  {
    publication: "The Sun Times News",
    title: "New Saline Youth Council sworn in with a focus on community service",
    href: "https://thesuntimesnews.com/new-saline-youth-council-sworn-in-with-a-focus-on-community-service/",
  },
];

/* ---------------------------------------------------------------------------
 * 6. About & contact
 * ------------------------------------------------------------------------ */

export const about = {
  paragraphs: [
    "I grew up in Michigan and came to Penn for the M&T Program. The two halves of it have turned out to be the same instinct pointed in different directions — I like understanding how something actually works, whether that’s a capital structure or a codebase.",
    "Outside of that: kayaking when the weather allows, tennis and piano since I was small, thrifting, doodling, and 3D wooden puzzles. The puzzles are the ones that got out of hand — the good kits are laser-cut plywood with real gearing and wiring inside, so finishing one means soldering-adjacent fiddling with a motor or a string of lights before anything moves.",
  ],
  /* Add a portrait here when you have one you like:
     portrait: { src: "assets/img/portrait.jpg", alt: "Alice Jiang", caption: "" } */
  portrait: null,
  /* Videos and photos shown under the About text. */
  media: [
    {
      src: "assets/media/puzzle-piano.mp4",
      poster: "assets/media/puzzle-piano.jpg",
      alt: "A finished laser-cut wooden grand piano music box with a candelabra and bench",
      caption: "A wooden grand piano music box, finished.",
    },
    {
      src: "assets/media/puzzle-train.mp4",
      poster: "assets/media/puzzle-train.jpg",
      alt: "The inside of a wooden model locomotive, showing a motor and circuit board wired in",
      caption: "The locomotive, with its motor and board going in.",
    },
    {
      src: "assets/media/puzzle-1.mp4",
      poster: "assets/media/puzzle-1.jpg",
      alt: "A wooden kit with gearing, a driver board, and a string of LEDs lighting up",
      caption: "Wiring up the lights on a build.",
    },
  ],
  contact: [
    { label: "Email", value: "wajiang@wharton.upenn.edu", href: "mailto:wajiang@wharton.upenn.edu" },
    { label: "LinkedIn", value: "weiran-jiang", href: "https://www.linkedin.com/in/weiran-jiang" },
    { label: "Résumé", value: "PDF", href: "assets/files/alice-jiang-resume.pdf" },
  ],
};

/* ---------------------------------------------------------------------------
 * Section registry — controls nav order and section headings.
 * ------------------------------------------------------------------------ */

export const sections = [
  { id: "experience", label: "Experience", heading: "Experience" },
  { id: "penn", label: "At Penn", heading: "At Penn" },
  { id: "work", label: "Work", heading: "Selected work" },
  { id: "archive", label: "Archive", heading: "Archive" },
  { id: "about", label: "About", heading: "About & contact" },
];
