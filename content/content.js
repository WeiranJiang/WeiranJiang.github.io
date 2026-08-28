/**
 * All site content lives here. Layout lives in styles.css and scripts/render.js.
 *
 * To add an entry: copy an existing object, edit the fields, and put it where you
 * want it in its array. Order in the array is the order on the page.
 * Every field except the ones marked required is optional — leave it out and the
 * renderer simply skips it. See CONTENT.md for the full field reference.
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
    role: "Founder",
    org: "HoloGlitterPacks",
    date: "Aug 2020 — Jan 2026",
    place: "Ann Arbor, MI",
    summary:
      "An e-commerce business I started at fifteen and ran through my first year of college.",
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
    role: "Co-President, VC Committee Member",
    org: "Wharton Undergraduate Entrepreneurship Club",
    date: "Oct 2025 — Present",
    summary:
      "WUEC runs Penn’s undergraduate entrepreneurship programming — treks, hackathons, and an investment committee that writes real memos.",
    points: [
      "Organized and led a 26-student NYC venture trek with visits to a16z, Primary Venture Partners, Picus Capital, and M13.",
      "Wrote investment memos evaluating startups from an 80-applicant competition run with Center City Ventures.",
      "Organized the Imagine.Dev hackathon for 50 participants and designed the project-evaluation criteria.",
    ],
    images: [
      {
        src: "assets/img/wuec-nyc-trek-group.jpg",
        alt: "WUEC members outside a venture firm’s office during the NYC trek",
        caption: "The NYC venture trek, outside one of the day’s stops.",
      },
      {
        src: "assets/img/wuec-nyc-trek-boardroom.jpg",
        alt: "WUEC members around a boardroom table during the NYC trek",
        caption: "26 students, four firms, one long day of meetings.",
      },
    ],
  },
  {
    role: "Team Member",
    org: "Management and Technology Innovation Fund",
    date: "Oct 2025 — Present",
    summary:
      "MTIF invests in student-founded companies at Penn and supports them afterwards.",
    points: [
      "Evaluated 9 of 70 Penn startup applicants using standardized due diligence frameworks, helping direct $15K across 3 portfolio investments.",
      "Served on the Cengine portfolio team during its Fortune 500 partnership with Cummins.",
    ],
  },
  {
    role: "Investment Analyst, Comma Capital Team",
    org: "Moso Capital",
    date: "Feb 2026 — Present",
    points: [
      "Evaluated 15 startups on business model, market opportunity, and competitive positioning.",
      "Helped build a Penn founder pipeline by identifying student-led ventures and tracking investment opportunities.",
    ],
  },
  {
    role: "Committee Member",
    org: "Wharton Undergraduate Finance Club & Wharton Hedge Fund Club",
    date: "Oct 2025 — Present",
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
    name: "SoloStep",
    kind: "Lemelson-MIT InvenTeam",
    date: "2024",
    summary:
      "A mobility prototype for older adults, built with a high school InvenTeam and presented at EurekaFest.",
    body: [
      "I worked with a team of students, mentors, and engineers to take a practical mobility problem through prototyping to a working demonstration. I also won the Lemelson-MIT EurekaFest essay award that year.",
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
    ],
  },
  {
    name: "Bridge Design",
    kind: "Science Olympiad",
    date: "2021 — 2025",
    summary:
      "Years of building balsa bridges that weighed almost nothing and held a great deal.",
    body: [
      "Structure, material choice, and joint geometry, tested to failure over and over. Part of 56 Science Olympiad placements across invitational, regional, state, and national competitions.",
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
 * 6. About & contact
 * ------------------------------------------------------------------------ */

export const about = {
  paragraphs: [
    "I grew up in Michigan and came to Penn for the M&T Program. The two halves of it have turned out to be the same instinct pointed in different directions — I like understanding how something actually works, whether that’s a capital structure or a codebase.",
    "Outside of that: kayaking when the weather allows, tennis and piano since I was small, thrifting, doodling, and 3D wooden puzzles. I build small software projects mostly because I want to use them.",
  ],
  /* Add a portrait here when you have one you like:
     portrait: { src: "assets/img/portrait.jpg", alt: "Alice Jiang", caption: "" } */
  portrait: null,
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
