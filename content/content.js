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
  /* Shown in the header only. The page title and footer use `name`. */
  brand: "(Weiran) Alice Jiang",
  title: "Alice Jiang",
  /* `title` is the heading on the page. This is the line a search result shows,
     so it carries the program and the school as well as the name — that's what
     someone searching "alice jiang m&t" is actually typing. Keep it under about
     60 characters or Google truncates the end. */
  metaTitle: "Alice Jiang — Jerome Fisher M&T, University of Pennsylvania",
  tagline:
    "Student at Penn in the Jerome Fisher M&T Program, studying finance at Wharton and computer science at SEAS.",
  description:
    "Alice Jiang is a Jerome Fisher M&T student at the University of Pennsylvania studying finance and computer science, interested in investment banking and early-stage venture, and building small software projects on the side.",
  email: "wajiang@wharton.upenn.edu",
  location: "Philadelphia, PA",

  /* What the site shows she works on. This goes into the schema.org Person the
     build writes, which is part of how a search engine decides what this site
     is about and whose it is.
     Only list something the entries below actually evidence — it's a claim, and
     an unsupported one helps nothing. */
  knowsAbout: [
    "Finance",
    "Computer Science",
    "Investment Banking",
    "Mergers and Acquisitions",
    "Venture Capital",
    "Financial Modeling",
    "E-commerce",
  ],

  /* The assistant works out what year of school she is in from these, rather
     than being told — see `academicStanding` in scripts/assistant.js. Keep them
     in step with the "Studying" rows in the sidebar above. */
  study: {
    gradYear: 2029,
    programYears: 4,
  },
};

/* ---------------------------------------------------------------------------
 * 1. Introduction
 * ------------------------------------------------------------------------ */

export const intro = {
  /* Each string is its own paragraph. */
  paragraphs: [
    "I’m a student at the University of Pennsylvania in the Jerome Fisher M&T Program, studying finance at Wharton and computer science at SEAS. Most of what I do is somewhere between the two: analyzing company financials and building small software projects.",
    "Right now I’m an investment banking summer analyst at Arbor Lake Capital, co-president of the Wharton Undergraduate Entrepreneurship Club, and on the team at the M&T Innovation Fund. Before college I spent five years running a small e-commerce business (HoloGlitterPacks), which is still the best hands-on experience I’ve had.",
  ],

  /* Compact buttons under the introduction. */
  links: [
    /* action: "ask" opens the assistant instead of navigating. */
    { label: "Ask about Alice", action: "ask" },
    { label: "Résumé", href: "assets/files/alice-jiang-resume.pdf", external: true },
    { label: "GitHub", href: "https://github.com/WeiranJiang", external: true },
    { label: "Stock pitches", href: "pitches.html" },
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
        "Team Member, MTIF",
        "Investment Analyst, Moso Capital",
      ],
    },
    {
      label: "Otherwise",
      lines: ["Kayaking, personal coding projects, wooden puzzles", "tennis, piano, thrifting, doodling, baking"],
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
    date: "May 2026 -- Present",
    place: "Ann Arbor, MI",
    summary:
      "Sell-side and buy-side work for middle-market clients, with a focus on cross border M&A.",
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
    date: "Aug 2020 -- Jan 2026",
    place: "Ann Arbor, MI",
    summary:
      "An e-commerce business I started in middle school and ran through my first year of college.",
    points: [
      "Grew from $50 of starting capital to $65K net profit across 15K orders, building the pricing and cost models and managing the full P&L.",
      "Earned 2,500 five-star reviews by reading conversion and demand data to refine the product mix and listings.",
    ],
    images: [
      {
        src: "assets/images/etsy4.png",
        alt: "HoloGlitterPacks seller dashboard",
        caption: "The shop dashboard.",
      },
    ],
  },
  {
    id: "penn-sfcu",
    role: "Operations Committee",
    org: "University of Pennsylvania Student Federal Credit Union",
    date: "Feb 2026 -- May 2026",
    place: "Philadelphia, PA",
    summary: "Day-to-day operations for a $6M AUM student-run financial institution.",
    points: [
      "Processed deposits, withdrawals, and account services, and monitored transaction activity under federal regulations.",
    ],
  },
  {
    id: "mt-summer-institute",
    role: "Application Reader",
    org: "M&T Summer Institute",
    date: "Feb 2026 -- Apr 2026",
    place: "Philadelphia, PA",
    summary: "Read 86 applications for the M&T Summer Institute.",
    points: [
      "Read 86 applications (essays, recommendation letters, transcripts, extracurriculars) for the M&T Summer Institute.",
      "Rated essays, recommendation letters, transcripts, and extracurriculars to be used for final review.",
    ],
  },
  {
    id: "applebees",
    role: "Host, part-time",
    org: "Applebee’s Neighborhood Grill + Bar",
    date: "Aug 2024 -- Jun 2025",
    place: "Ann Arbor, MI",
    summary: "Talked to a lot of cool people and levelled up at folding kid menus.",
  },
];

/* ---------------------------------------------------------------------------
 * 3. At Penn
 *
 * These render as tabs. `short` is the tab label, `org` is the full name shown
 * in the card, and `website` is the club's own site — the only link on the card.
 * Leave `website` empty and no link is shown.
 * ------------------------------------------------------------------------ */

export const atPenn = [
  {
    id: "wuec",
    short: "WUEC",
    website: "https://whartonentrepreneurship.org/",
    role: "Co-President, VC Committee Member",
    org: "Wharton Undergraduate Entrepreneurship Club",
    date: "Oct 2025 -- Present",
    place: "Philadelphia, PA",
    summary:
      "WUEC runs Penn’s undergraduate entrepreneurship programming — conferences, treks, and pitch competitions.",
    points: [
      "Organized and led a 26-student NYC venture trek with visits to a16z, Primary Venture Partners, Picus Capital, and M13.",
      "Wrote investment memos evaluating startups from an 80-applicant competition run with Center City Ventures.",
      "Organized the Imagine.Dev hackathon for 50 participants and designed the project-evaluation criteria.",
    ],
    images: [
      {
        src: "assets/img/wuec-nyc-trek-group.jpg",
        alt: "WUEC members standing together outside a building on the NYC venture trek",
        caption: "Outside our last stop on the NYC trek.",
      },
      {
        src: "assets/img/wuec-nyc-trek-boardroom.jpg",
        alt: "WUEC members around a boardroom table during the NYC trek",
        caption: "NY Career Trek - at a16z.",
      },
      {
        src: "assets/img/wuec-trek-poster.jpg",
        alt: "Poster for the WUEC NY VC Trek on April 3rd, listing visits to Primary Ventures, a16z, M13, and Picus Capital",
        caption: "The sign-up poster.",
      },
      {
        src: "assets/images/moso-capital-penn.png",
        alt: "WUEC members together on the New York career trek",
        caption: "WUEC NY Career Trek",
      },
    ],
  },
  {
    id: "mtif",
    short: "MTIF",
    website: "https://mtinnovationfund.com/",
    role: "Team Member",
    org: "Management and Technology Innovation Fund",
    date: "Oct 2025 -- Present",
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
    short: "Moso",
    website: "https://www.mosocapital.org/",
    role: "Investment Analyst, Comma Capital Team",
    org: "Moso Capital",
    date: "Feb 2026 -- Present",
    place: "Philadelphia, PA",
    summary:
      "A student investment team backing early-stage companies, with a Penn founder pipeline behind it.",
    points: [
      "Evaluated 15 startups on business model, market opportunity, and competitive positioning.",
      "Helped build a Penn founder pipeline by identifying student-led ventures and tracking investment opportunities.",
    ],
  },
  {
    id: "wufc",
    short: "WUFC",
    website: "https://www.whartonfinanceclub.com/",
    role: "Committee Member",
    org: "Wharton Undergraduate Finance Club",
    date: "Oct 2025 -- Present",
    place: "Philadelphia, PA",
    summary: "Wharton's undergraduate finance club — markets coverage and company analysis.",
    points: [
      "Produced weekly market updates and did practices on DCF and comparable-company valuation.",
    ],
  },
  {
    id: "whfc",
    short: "WHFC",
    website: "https://whartonhedgefundclub.com/",
    role: "Committee Member",
    org: "Wharton Hedge Fund Club",
    date: "Oct 2025 -- Present",
    place: "Philadelphia, PA",
    summary: "The hedge fund club, covering the same markets work from the long/short side.",
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
    summary: "A personal gamified study tracker for passive logging.",
    body: [
      "SlimeTime is a google chrome extension progress tracker. It has a stopwatch, a countdown, and a task list. It allows for passive tracking by reading through google calendar events and logging study time that way as well.",
      "The other half is the part that makes me open it: Focus time earns Dewdrops, Dewdrops buy items in a shop, and items feed attribute XP which level up a slime with a class and an adventurer rank.",
    ],
    images: [
      {
        src: "assets/img/slimetime-stats.png",
        alt: "SlimeTime stats page showing focus hours, study streak, weekly study map, per-subject breakdown, and a radar chart",
        caption: "The personal stats page.",
      },
      {
        src: "assets/img/slimetime-home.png",
        alt: "SlimeTime home screen showing the slime, its level, adventurer rank, and attribute XP bars",
        caption: "Home page.",
      },
    ],
  },
  {
    id: "solostep",
    name: "SoloStep",
    kind: "EMUiNVENT InvenTeam — Co-Team Lead & Community Outreach Lead",
    date: "2023 -- 2024",
    place: "Ypsilanti, MI",
    summary:
      "A working, life-size mobility device for seniors, built with a Lemelson-MIT InvenTeam grant. Received a provisional patent and presented at MIT.",
    body: [
      "SoloStep came out of our EMUiNVENT InvenTeam: a device to help people with limited mobility move between sitting, standing, and lying down. Through lots of resources and mentorship we built a working, life-size prototype. We also hold a provisional patent, thanks to Microsoft’s Make What’s Next program.",
      "We presented at EurekaFest at MIT in June 2024, where I also won the Lemelson-MIT EurekaFest essay contest.",
    ],
    points: [
      "Co-led the team and ran community outreach.",
      "Interviewed senior centers and retirement homes (StoryPoint, Saline Senior Center, University Living).",
      "Secured a $7,500 Lemelson-MIT InvenTeam grant and a further $1,500 from Saline Area Schools.",
      "Presented at MIT’s EurekaFest, and won the Lemelson-MIT EurekaFest essay contest.",
    ],
    images: [
      {
        src: "assets/images/MIT1.png",
        alt: "Wiring diagram of the SoloStep control system: an Arduino board connected to ultrasonic sensors and four motors",
        caption: "The control wiring of the miniature prototype.",
      },
      {
        src: "assets/images/emuinvent-team-1.jpg",
        alt: "The EMUiNVENT InvenTeam gathered around the SoloStep prototype in the lab",
        caption: "Playing around in the shop.",
      },
      {
        src: "assets/images/emuinvent-team-2.jpg",
        alt: "EMUiNVENT team members standing together after a build session with the mobility device",
        caption: "Playing with dishes.",
      },
      {
        src: "assets/images/MIT3.jpg",
        alt: "Four members of the EMUiNVENT InvenTeam standing beside the SoloStep poster at EurekaFest",
        caption: "The EMUiNVENT InvenTeam at EurekaFest, MIT.",
      },
      {
        src: "assets/img/solostep-sticker.jpg",
        alt: "A SoloStep sticker: a line drawing of a foot stepping, above the words SoloStep — Seize the Movement",
        caption: "Part of materials - our logo/sticker.",
      },
    ],
  },
];

/* ---------------------------------------------------------------------------
 * 5. Archive — its own page at archive.html, linked from the nav but not part
 * of the homepage. Everything from before Penn lives here.
 * ------------------------------------------------------------------------ */

/* `intro` is optional — without one the page opens straight into the entries. */
export const archivePage = {
  heading: "Archive",
};

/* Schools and coursework. */
export const education = [
  {
    org: "Saline High School",
    place: "Saline, MI",
    date: "2021 — 2025",
    points: [
      "4.4348 weighted GPA, 4.0 unweighted. Ranked 1 of 396 unweighted, 2 of 396 weighted.",
      "SAT 1560 — 800 math, 760 reading and writing.",
      "AP exams: Calculus BC 5, Chemistry 5, Chinese 5, Computer Science 5, Language and Composition 5, U.S. Government 5, Psychology 5, U.S. History 4.",
      "Further AP coursework: Literature, Macroeconomics, Microeconomics, Physics C: Mechanics, Statistics.",
    ],
  },
  {
    org: "Oakland University Summer Mathematics Institute",
    place: "Rochester, MI",
    date: "2024",
    points: ["Linear Algebra (MTH 2775) and Introduction to Advanced Mathematical Thinking (MTH 3002)."],
  },
  {
    org: "Washtenaw Community College",
    place: "Ann Arbor, MI",
    date: "2024",
    points: ["Multivariable Calculus (MTH 293) and Introduction to Accounting Principles."],
  },
];

/* Activities, shown in full — there are no separate pages behind these. */
export const highSchool = [
  {
    id: "science-olympiad",
    org: "Science Olympiad",
    role: "Captain",
    date: "2021 — 2025",
    place: "Saline, MI",
    summary:
      "Four years of science events — mostly photos of light balsa bridges.",
    body: [
      "56 placements across invitational, regional, state, and national competitions.",
    ],
    points: [
      "Helped with practices and summer camps, and with the team\u2019s logistics, budget, and schedule.",
      "Set up the Extracurricular Night table with air trajectory demos and bridge tests.",
      "Spoke at the STEAM building groundbreaking and at annual Saline School Board meetings.",
    ],
    images: [
      {
        src: "assets/images/bridge2.png",
        alt: "Hand-drawn top, side, and bottom views of a bridge with dimensions and member sizes",
        caption: "Plans for a 47 \u00d7 14 cm build, drawn before cutting anything.",
      },
      {
        src: "assets/img/bridge-load-test.jpg",
        alt: "A balsa bridge on a test rig, loaded through a chain hung from its centre",
        caption: "Load testing.",
      },
      {
        src: "assets/img/science-olympiad-medals.jpg",
        alt: "A pile of Science Olympiad medals, lanyards, and place ribbons spread across a table",
        caption: "Science Olympiad medals.",
      },
      {
        src: "assets/images/science-olympiad-workbench.jpg",
        alt: "Alice at the workbench during a Science Olympiad bridge build session",
        caption: "Another build session.",
      },
    ],
  },
  {
    id: "saline-nhs",
    org: "National Honor Society",
    role: "President",
    date: "2021 — 2025",
    place: "Saline, MI",
    summary: "Running the chapter, and the volunteering that came with it.",
    points: [
      "Helped lead chapter meetings and committee meetings, and managed 70+ volunteering opportunities a year.",
      "Raised $450 for the club banquet with a new fundraising model.",
    ],
    images: [
      {
        src: "assets/img/nhs-food-drive.jpg",
        alt: "Students sorting donated cans and boxes into postal bins at a food pantry",
        caption: "Sorting a food drive into the pantry\u2019s bins.",
      },
      {
        src: "assets/images/nhs-auditorium.jpg",
        alt: "NHS members gathered at a school event",
        caption: "NHS at a school assembly.",
      },
    ],
  },
  {
    id: "bpa",
    org: "Business Professionals of America",
    role: "President",
    date: "2021 — 2025",
    place: "Saline, MI",
    summary: "Michigan\u2019s high school business competition circuit, and the chapter behind it.",
    points: [
      "Ran club meetings, organized resources, mentored students, and built bonding events.",
      "Implemented a Google Drive system for team resources.",
    ],
  },
  {
    id: "saline-youth-council",
    org: "Saline Youth Council",
    role: "Co-Chair",
    date: "2021 — 2025",
    place: "Saline, MI",
    summary: "The city\u2019s youth council, focused on community service.",
    points: [
      "Set agendas and oversaw council activities.",
      "Started and ran a snow-shovelling program for senior citizens.",
    ],
  },
  {
    id: "music-for-seniors",
    org: "Music for Seniors",
    role: "Founder",
    date: "2021 — 2025",
    place: "Saline, MI",
    summary: "Playing piano and flute for residents at retirement homes.",
    images: [
      {
        src: "assets/img/music-for-seniors.jpg",
        alt: "Alice playing flute from sheet music, seated in front of an audience in a common room",
        caption: "Playing flute.",
      },
      {
        src: "assets/img/senior-center-music.jpg",
        alt: "Alice playing flute for residents in a senior living community room",
        caption: "A music session for senior residents.",
      },
    ],
  },
  {
    id: "shs-ecommerce",
    org: "SHS E-commerce Club",
    role: "Co-Founder & President",
    date: "2022 — 2025",
    place: "Saline, MI",
    summary: "A club for the thing I was already doing after school.",
    points: ["Mentored students on e-commerce and led teams in business competitions."],
  },
];

/* Everything else, as one short list. */
export const alsoDid = [
  "SHS Debate",
  "SHS Tennis — Varsity, JV Co-Captain",
  "SHS TEDxYouth — Co-leader",
  "Washtenaw County Youth Commission — Saline District Commissioner",
  "Tech Town Hall — Founder",
  "ALLY, Asian Youth Liberty League — Secretary",
  "SHS Poetry Club",
];

export const summerPrograms = [
  {
    org: "Wharton Global Youth Program",
    date: "2022",
    points: ["Essentials of Leadership."],
  },
  {
    org: "University of Michigan Summer Discovery",
    date: "2023",
    points: [
      "Personal Finance and Entrepreneurship, Public Speaking and Presentation Skills, College Essay Writing, and Social Psychology.",
    ],
  },
  {
    org: "MIDAS, University of Michigan",
    date: "2024",
    points: ["Introduction to Data Science and AI."],
  },
];

/* Awards, grouped. `when` is the small left column. */
export const awards = [
  {
    group: "Academic",
    items: [
      { when: "2025", what: "Swartz Scholarship for Entrepreneurs." },
      { when: "2024", what: "National Merit Semifinalist." },
      { when: "2024", what: "AP Scholar with Distinction." },
      { when: "2024", what: "Lemelson-MIT EurekaFest essay winner." },
      { when: "2024", what: "Lila Howard Make-a-Difference Scholarship." },
      { when: "2024", what: "Michigan Impact Award, for volunteering." },
      { when: "2022", what: "Global Seal of Biliteracy \u2014 Gold Seal, Chinese and English." },
    ],
  },
  {
    group: "Science Olympiad",
    items: [
      { when: "2023—24", what: "Regionals: Anatomy & Physiology 1st, Experimental Design 1st, Forensics 2nd. States: Ecology 2nd." },
      { when: "2022—23", what: "Regionals: Chemistry Lab 3rd, Bridge 3rd, Experimental Design 2nd, Forensics 2nd. States: Bridge 2nd, Forensics 7th." },
      { when: "2021—22", what: "Regionals: Experimental Design 1st, Wright Stuff 1st, Bridge 2nd. States: Experimental Design 1st, Wright Stuff 4th, Bridge 7th." },
      { when: "2021", what: "Caltech National Invitational: Bridge 18th." },
    ],
  },
  {
    group: "Business Professionals of America",
    items: [
      { when: "2023—24", what: "Nationals: Start-Up Enterprise Team 3rd, as team captain." },
      { when: "2023—24", what: "States: Health Administration Concepts 4th." },
      { when: "2023—24", what: "Regionals: Administrative Support 1st; Management, Marketing and Human Resources Concepts 1st; Entrepreneurship 3rd." },
      { when: "2022—23", what: "Regionals: Administrative Support 5th." },
    ],
  },
  {
    group: "Debate",
    items: [
      { when: "2022—23", what: "U-M Debate Tournament: Octofinalist." },
      { when: "2021—22", what: "Nationals: Pro-Con Challenge 5th. States: Pappas Invitational DUDL 2, Finalist." },
    ],
  },
  {
    group: "Music & art",
    items: [
      { when: "2023", what: "First division, MSBOA Solo and Ensemble, flute and piano." },
      { when: "2023", what: "Winner, Kappy Family Anne Frank Art & Writing Competition, Zekelman Holocaust Center." },
      { when: "2022", what: "Level 10, Student Achievement Testing, Music Teachers Association." },
    ],
  },
];

/* ---------------------------------------------------------------------------
 * Press.
 *
 * `item` matches an entry's id. Articles about a project show on that project's
 * page; articles about a high school activity show inside that activity on the
 * archive page. Anything without an `item` shows at the end of the archive.
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
    item: "science-olympiad",
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
    item: "saline-youth-council",
  },
];

/* ---------------------------------------------------------------------------
 * Stock pitches — its own page at pitches.html.
 *
 * While `pitches` is empty the page shows `pitchesPage.note` and nothing else.
 * Add an entry and the note disappears on its own; the list is rendered with
 * the same rows as the rest of the site.
 *
 *   {
 *     company: "Acme Corporation",
 *     ticker: "ACME",                       // optional
 *     date: "Mar 2027",                     // optional
 *     summary: "The one-line thesis.",      // optional
 *     link: { label: "Deck", href: "assets/files/acme-pitch.pdf" },  // optional
 *   }
 *
 * Only commit a PDF you're happy to have public — anything in the repo is
 * downloadable whether or not it's linked.
 * ------------------------------------------------------------------------ */

export const pitchesPage = {
  heading: "Stock pitches",
  note: "Offline for now. Will be back!",
};

export const pitches = [];

/* ---------------------------------------------------------------------------
 * 6. About & Contact
 * ------------------------------------------------------------------------ */

export const about = {
  paragraphs: [
    "I grew up in Michigan and came to Penn for the M&T Program. I like understanding how something actually works, whether that’s a capital structure or a codebase.",
    "Outside of that, I enjoy kayaking when the weather allows, tennis and piano since I was small, thrifting, doodling, baking, and 3D wooden puzzles to relax.",
  ],
  portrait: {
    /* The alt names her, because this is the picture image search returns for
       "Alice Jiang" and the alt is most of what it has to go on. */
    src: "assets/img/portrait.jpg",
    alt: "Alice Jiang, photographed in Florida",
  },
  /* Photos shown under the About text. */
  media: [
    {
      src: "assets/img/kayaking.jpg",
      alt: "Alice paddling a green kayak through a stretch of whitewater on a wooded river",
      caption: "The Rapids in Argo Park.",
    },
    {
      src: "assets/img/fruit-tart.jpg",
      alt: "A fruit tart topped with sliced strawberries, kiwi, and blueberries over pastry cream",
      caption: "A freshly decorated fruit tart.",
    },
  ],
  /* Folded away behind a heading you click to open. Add another object here and
     you get another dropdown. */
  collections: [
    {
      label: "3D wooden puzzles",
      note: "Photos and clips of the builds.",
      media: [
        {
          src: "assets/img/puzzle-magic-cello.jpg",
          alt: "An assembled wooden Magic Cello music box, gears and carved leaves visible through the body, standing on a book-shaped base",
          caption: "The bow moves and plays a Nocturne.",
        },
        {
          src: "assets/img/puzzle-piano-bear.jpg",
          alt: "The finished wooden grand piano music box, lid open on its gearing, beside a small teddy bear in a Penn shirt",
          caption: "The piano plays Canon in D.",
        },
        {
          src: "assets/img/puzzle-wiring.jpg",
          alt: "Hands connecting a small circuit board to the motor and gearing inside a half-built wooden kit",
          caption: "The Christmas special kit, wired up.",
        },
        {
          src: "assets/media/puzzle-piano.mp4",
          poster: "assets/media/puzzle-piano.jpg",
          alt: "A finished laser-cut wooden grand piano music box with a candelabra and bench",
          caption: "The grand piano music box lid details.",
        },
        {
          src: "assets/media/puzzle-train.mp4",
          poster: "assets/media/puzzle-train.jpg",
          alt: "The inside of a wooden model locomotive, showing a motor and circuit board wired in",
          caption: "The locomotive kit’s major components.",
        },
        {
          src: "assets/media/puzzle-1.mp4",
          poster: "assets/media/puzzle-1.jpg",
          alt: "A wooden kit with gearing, a driver board, and a string of LEDs lighting up",
          caption: "Wiring up the lights on a build.",
        },
      ],
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
  { id: "work", label: "Projects", heading: "Projects" },
  { id: "about", label: "About", heading: "About & Contact" },
  /* A page rather than a section: `href` sends the nav link elsewhere. */
  { id: "archive", label: "Archive", href: "archive.html" },
];

/* An entry with `heading` is a section on the homepage; one with `href` is just
   a nav link to another page. Only the sections are numbered, and they number
   themselves from their order here. */
