/**
 * Alice's notes for the assistant — the half of what it knows that isn't on the
 * page.
 *
 * Why here rather than in content/content.js: everything in content/ is
 * rendered into the site and downloadable from it, so the browser-side
 * knowledge base is public by construction. These notes are not. They live in
 * the Worker, they are never returned to a browser, and the only thing a
 * visitor ever sees of them is an answer written out of them.
 *
 * How they are used: index.js scores these categories against the question,
 * takes the best few, and appends them to the prompt as <note> blocks, next to
 * the published passages the browser sent. Nothing else changes — the model is
 * still only allowed to say what it was given.
 *
 * Editing
 *   - One category per subject. Add facts as plain sentences; `keywords` are
 *     what the question is matched against and are never shown.
 *   - `use` is a single line about how to use the category — when to bring it
 *     up, when to leave it alone. It rides along with the facts.
 *   - A category with an empty `facts` array is skipped entirely. That is the
 *     safe state: an unfilled category can't produce a hollow answer, it just
 *     leaves the assistant saying it doesn't have that. Fill one in and it
 *     starts being used on the next deploy; no other change needed.
 *   - `always: true` sends a category with every question. Only worth it for
 *     something short that a question might not name — see `employer-fit`.
 *   - Changes take effect on `npx wrangler deploy`, not on push.
 *
 * What not to put here. This file is in a public git repository, and the model
 * reads every word of what gets retrieved. No phone numbers, no home address,
 * no keys or passwords, no anyone else's private business, nothing about health
 * or money that you would not say to a stranger who asked. The rule that
 * governs content/content.js governs this too, one step stricter: if you would
 * not want it said out loud to a recruiter, don't write it down here.
 */

/* Matched against, never shown. Same shape as the site's own knowledge base in
   scripts/assistant.js — deliberately duplicated rather than shared, because
   the Worker and the page are separate deploys and neither should be able to
   break the other. */
const STOPWORDS = new Set(
  (
    "a about all also an and any anything are as at back be been being by can could did do does for from get give had has have he her hers him his how i in into is it its just know like made make many me more much my need of on one or out over please said say she should some something tell than that the their them then there these they thing things this those to two us want was were what when where which who whom why will with would you your alice jiang"
  ).split(" ")
);

/* How many categories a single question can pull in, over and above the ones
   marked `always`. Three is enough to cover a question that straddles two
   subjects without turning the prompt into the whole file. */
const MAX_NOTES = 3;

export const notes = [
  {
    id: "basics",
    title: "Basics",
    keywords:
      "who name full legal weiran pronounce goes by age background overview summary study studying major degree school college university penn wharton seas m&t management technology dual jerome fisher philadelphia where based live",
    use: "Orientation, not an answer in itself. Use it to keep names, degrees and dates straight; the site itself is the better source for anything it already says.",
    facts: [
      "Her full name is Weiran Alice Jiang. She goes by Alice; the site's header writes it as (Weiran) Alice Jiang.",
      "She is an undergraduate at the University of Pennsylvania in the Jerome Fisher Program in Management and Technology, usually called M&T. It is a dual degree: a BS in Economics from Wharton, concentrating in finance, and a BSE in Computer Science from SEAS. Expected 2029.",
      "Term time is Philadelphia. Home is Saline, Michigan, just outside Ann Arbor.",
      "Her published one-line description of herself: finance and computer science, interested in investment banking and early-stage venture, building small software projects on the side.",
    ],
  },

  {
    id: "education",
    title: "Education",
    keywords:
      "education school high saline gpa rank class sat act ap exams scores coursework courses calculus linear algebra accounting community college oakland washtenaw transcript academics grades valedictorian",
    use: "Don't lead with numbers. Grades and test scores are published on the archive page and are fine to give if asked for, but they are not what to reach for when someone asks about her background.",
    facts: [
      "Penn, Jerome Fisher M&T: BS in Economics (finance) at Wharton and a BSE in Computer Science at SEAS, expected 2029.",
      "Saline High School, Saline, Michigan, 2021 to 2025. 4.4348 weighted GPA and 4.0 unweighted, ranked 1 of 396 unweighted and 2 of 396 weighted. SAT 1560, made up of 800 in maths and 760 in reading and writing.",
      "Eight AP exams: fives in Calculus BC, Chemistry, Chinese, Computer Science, Language and Composition, US Government and Psychology, and a four in US History. She took further AP coursework in Literature, Macroeconomics, Microeconomics, Physics C: Mechanics and Statistics.",
      "College coursework before Penn: Linear Algebra and Introduction to Advanced Mathematical Thinking at the Oakland University Summer Mathematics Institute in 2024, and Multivariable Calculus and Introduction to Accounting Principles at Washtenaw Community College the same year.",
    ],
  },

  {
    id: "personality",
    title: "Personality",
    keywords:
      "personality character like person kind sort temperament introvert extrovert quiet funny serious humour humor voice tone how she comes across what is she like down-to-earth grounded happy upbeat blue organized organizer planner",
    use: "Thin on purpose. What's below is how she describes and writes about herself, which is not the same as a character assessment — don't extrapolate one from her CV.",
    facts: [
      "In her own words on the site: \"I like understanding how something actually works, whether that's a capital structure or a codebase.\"",
      "Her own site copy is plain and a little dry rather than grand. Her line about a year of hosting at Applebee's reads, in full: \"Talked to a lot of cool people and levelled up at folding kid menus.\" That register is worth matching.",
      "People often tell Alice she is more down-to-earth and grounded than they initially expected.",
      "Her friends associate her with being happy, upbeat, and frequently dressed in blue.",
      "Alice naturally becomes the planner in her friend group — often the person who turns ideas in a group chat into actual plans.",
      "She enjoys organizing surprise birthday celebrations for her friends, and thoughtful gestures and shared experiences are important to her.",
      "Alice is a night owl.",
      "Alice is very bad at singing.",
    ],
  },

  {
    id: "favorites",
    title: "Favorites",
    keywords:
      "favorite favourite likes enjoys loves hobby hobbies fun free time relax unwind weekend kayaking tennis piano flute music thrifting doodling baking puzzles wooden lego build color colour green blue tea coffee chai latte jasmine food chinese stir-fry tomato egg season fall autumn holiday christmas restaurant masala movie show avatar ghibli lloyd lego batman",
    use: "Casual questions want a casual answer. Give one or two specifics and stop — don't tie a hobby back to her career.",
    facts: [
      "Favorite color: green. She is also known for wearing a lot of blue.",
      "Favorite food: Chinese tomato-and-egg stir-fry, a childhood favorite she never outgrew.",
      "She is more of a tea person than a coffee person. Favorite tea: jasmine tea. Coffee-shop order: chai latte.",
      "Favorite season: fall. Favorite holiday: Christmas.",
      "Favorite restaurant near Penn: Masala Kitchen.",
      "Favorite television show: Avatar: The Last Airbender.",
      "Favorite movie: Hi, Mom.",
      "Favorite fictional characters: Lloyd Frontera from The Greatest Estate Developer and Lego Batman.",
      "Alice enjoyed watching Studio Ghibli films at KCECH at Penn.",
      "Kayaking when the weather allows, usually the rapids in Argo Park in Ann Arbor.",
      "Tennis and piano since she was small. She also plays flute — first division at MSBOA Solo and Ensemble in 2023, on both flute and piano.",
      "Thrifting, doodling and baking — fruit tarts among other things, strawberries, kiwi and blueberries over pastry cream.",
      "3D wooden puzzles to relax, mostly mechanical music-box kits: a Magic Cello whose bow moves and plays a Nocturne, a grand piano that plays Canon in D, a locomotive, and a Christmas kit she wired up with LEDs.",
    ],
  },

  {
    id: "family-hometown",
    title: "Family and hometown",
    keywords:
      "family parents mother father sister brother siblings home hometown michigan saline ann arbor grew up childhood chinese biliteracy community roots oreo rabbit pet",
    use: "The site says nothing about her family, and neither do these notes. If someone asks about her family, say plainly that it's not something she puts on the site, and leave it there — hometown questions are a different thing and can be answered fully.",
    facts: [
      "She grew up in Michigan — Saline, a town just outside Ann Arbor — and came to Penn for M&T.",
      "She has two siblings: an older brother who attended the University of Michigan's Ross School of Business, and a younger sister who is currently in high school.",
      "Almost everything before college is anchored there: Saline High School, the e-commerce business, the Applebee's job, and now the Arbor Lake internship back in Ann Arbor.",
      "She spent a lot of that time on the town rather than just in it: the Saline Youth Council, where she started a snow-shovelling programme for senior citizens; Music for Seniors, playing piano and flute at retirement homes; National Honor Society food drives.",
      "Chinese and English: a Gold Seal on the Global Seal of Biliteracy in 2022, and a five on AP Chinese.",
      "Her favorite part of Ann Arbor is that many of her close friends are there. She enjoys kayaking with her friends and attending the Ann Arbor Art Fair.",
      "Alice has a pet rabbit named Oreo.",
    ],
  },

  {
    id: "interests-fun",
    title: "Interests and fun facts",
    keywords:
      "fun fact interesting unusual surprising quirky story anecdote chrome extension project bridges balsa applebees host patent middle school etsy poetry debate tedx tennis captain competitive building structure coding financial model",
    use: "For a light question, one fact is the whole answer. Pick the one that fits and resist adding a second.",
    facts: [
      "The Chrome Extension Project, her Chrome extension study tracker, exists because a plain timer wasn't enough to make her open it: focus time earns Dewdrops, Dewdrops buy items in a shop, and items feed the attribute XP that levels up a slime with a class and an adventurer rank.",
      "Alice becomes surprisingly competitive when she is building something — whether that's physical structures, coding projects, or financial models for stock pitches. Once she can measure the result and identify ways to improve it, she becomes deeply invested.",
      "Alice can build an 11-gram bridge that holds 15,000 grams — roughly the weight of two sheets of paper supporting the weight of a mountain bike. This skill came from Science Olympiad. Four years of Science Olympiad, with 56 placements across invitational, regional, state and national competitions. She drew full plans, down to member sizes on a 47 by 14 cm build, before cutting anything.",
      "She started HoloGlitterPacks in middle school with $50 of starting capital and ran it until January 2026, halfway through her first year at Penn.",
      "She hosted at Applebee's through her last year of high school, and describes the job as talking to a lot of cool people and levelling up at folding kid menus.",
      "She holds a provisional patent on SoloStep, the senior mobility device, obtained through Microsoft's Make What's Next programme.",
      "She played travel soccer from first through fifth grade.",
      "Also in the mix at high school: poetry club, debate, varsity tennis and JV co-captain, and co-leading TEDxYouth.",
      "She enjoys building physical structures, developing coding projects, and creating financial models for company analysis and stock pitches.",
      "She enjoys attending the Ann Arbor Art Fair.",
    ],
  },

  {
    id: "work-style",
    title: "Work style and teamwork",
    keywords:
      "work style team teamwork collaborate collaboration lead leader leadership manage mentor teach organize organise run project deadline pressure conflict disagreement role group communicate communication dependable commitment follow-through",
    use: "What's here is the record, not a self-assessment: things she organised, led or built criteria for. Say what she did and let it stand as the answer.",
    facts: [
      "She tends to make the criteria explicit before judging anything. Standardised due-diligence frameworks at the M&T Innovation Fund, the project-evaluation criteria for the Imagine.Dev hackathon, and a rating scheme for reading 86 M&T Summer Institute applications are all hers.",
      "Alice works best with people who communicate clearly, care about producing strong work, and follow through on their commitments.",
      "She becomes frustrated when teammates fail to complete work on time, forget their responsibilities, don't communicate that they are falling behind, or allow delayed work to create additional responsibilities for everyone else.",
      "Alice often contributes structure to teams by organizing shared materials, clarifying responsibilities, tracking deadlines, and making sure plans are executed.",
      "For Alice, dependability means following through on a commitment or communicating early when circumstances change.",
      "Co-team lead and community outreach lead on the EMUiNVENT InvenTeam: she did the interviewing at StoryPoint, Saline Senior Center and University Living, and the team built a working, life-size prototype from it.",
      "As co-president of the Wharton Undergraduate Entrepreneurship Club she organised a 26-student venture trek to New York — a16z, Primary Venture Partners, Picus Capital and M13 — and ran the Imagine.Dev hackathon for 50 participants.",
      "A lot of her roles involve teaching the thing she was already doing: mentoring students through Business Professionals of America, co-founding the school e-commerce club, running Science Olympiad practices and summer camps.",
      "She has raised the money as well as spent it: a $7,500 Lemelson-MIT InvenTeam grant plus $1,500 from Saline Area Schools, and $450 for the National Honor Society banquet on a fundraising model she changed.",
    ],
  },

  {
    id: "feedback-growth",
    title: "Feedback and personal growth",
    keywords:
      "feedback criticism critique review improve improvement growth learn weakness weaknesses better working on develop coachable presentation visual design powerpoint",
    use: "Use this for questions about receiving feedback, improvement, presentation skills, coachability, or a skill Alice developed over time. The lesson is that Alice responds to feedback by identifying what needs to change and applying the feedback until the improvement is visible.",
    facts: [
      "During Alice's internship, Kevin initially told her that her PowerPoint presentations needed to be more visually attractive and better organized.",
      "Alice studied stronger examples and consistently applied the feedback.",
      "By the end of the internship, Kevin described her presentations as 'consulting level.'",
    ],
  },

  {
    id: "mistakes-lessons",
    title: "Mistakes and lessons",
    keywords:
      "mistake mistakes wrong failed failure regret hard difficult setback lesson learned taught fix recover miscommunication wasted effort",
    use: "Use only for questions about mistakes, communication, teamwork, wasted effort, overcommitting, or learning to align before executing. Alice learned that initiative is most useful when paired with alignment.",
    facts: [
      "During the fall of Alice's freshman year, she worked on a Golar LNG stock pitch for WUFC.",
      "Alice moved ahead without communicating enough with her teammates.",
      "She completed additional analysis that was ultimately unnecessary.",
      "Some of that work became unusable, and combining the remaining work required even more time.",
      "Alice learned that initiative is most useful when paired with alignment.",
      "She now confirms the objective, expected output, and division of responsibilities before investing substantial time in extra analysis.",
    ],
  },

  {
    id: "finance-cs",
    title: "Finance and computer-science interests",
    keywords:
      "finance financial banking investment ib analyst associate deal deals m&a merger acquisition sell-side buy-side valuation dcf comps modelling modeling markets equity hedge long short venture vc startup diligence portfolio coding code software engineering programming computer science python javascript chrome extension arduino hardware data science ai technical replicable scalable competitive differentiation",
    use: "The two halves are the point — she is in a dual-degree programme, and questions about one often want to know how it sits against the other.",
    facts: [
      "Banking, at Arbor Lake Capital: sell-side and buy-side work for middle-market clients with a cross-border M&A focus. She analysed 4 acquisition targets for automotive clients on ownership structure, financial performance and strategic fit, screened 57 potential buyers for the sale of an air spring company, built 3 presentations on target companies for the senior deal team, and prepared materials for a legal dispute tied to a prior M&A deal and a de-SPAC.",
      "Markets: weekly market updates and DCF and comparable-company valuation practice with the Wharton Undergraduate Finance Club, and the same work from the long/short side with the Wharton Hedge Fund Club.",
      "Venture: 9 of 70 Penn startup applicants evaluated at the M&T Innovation Fund, helping direct $15K across 3 investments, plus the Cengine portfolio team during its Cummins partnership; 15 startups assessed on business model, market and competitive positioning at Moso Capital; investment memos on an 80-applicant competition run with Center City Ventures at WUEC.",
      "Regulated operations, briefly: the operations committee of Penn's Student Federal Credit Union, a $6M AUM student-run institution, processing deposits, withdrawals and account services under federal regulations.",
      "Computer science: The Chrome Extension Project is a Chrome extension with a stopwatch, a countdown, a task list and passive tracking that reads Google Calendar events. SoloStep's control side was an Arduino wired to ultrasonic sensors and four motors. Add AP Computer Science, an introduction to data science and AI at Michigan's MIDAS in 2024, and linear algebra, multivariable calculus and proof-based maths before Penn.",
      "In her own words, the overlap is the whole interest: understanding how something actually works, whether that's a capital structure or a codebase.",
      "Computer science helps Alice look beyond a technology company's headline product. It provides a framework for considering how the product works, whether the technical claims are meaningful, how difficult the product may be to replicate, whether it can scale efficiently, and how technical design can affect competitive differentiation.",
      "Finance helps Alice connect those product characteristics with competitive positioning, growth, business quality, and valuation.",
    ],
  },

  {
    id: "preprofessional",
    title: "Preprofessional development",
    keywords:
      "preprofessional professional development insight program programme summer spring workshop career preparation financial industry programs career exploration seo goldman sachs morgan stanley point72",
    use: "Keep these apart. A summer programme, a club role and a job are three different things — say what each actually was, never upgrade one into another, and don't invent an insight day or a spring week, because the site lists none.",
    facts: [
      "Alice has actively explored the financial industry through several insight and professional-development programs, including SEO Career, Morgan Stanley Insights, the Goldman Sachs Possibilities Series, and Point72 Academy Spring Sessions.",
      "These experiences have helped her learn about different areas of finance, connect with professionals, and make more informed decisions about her career interests.",
      "Paid or employed roles: investment banking summer analyst at Arbor Lake Capital in Ann Arbor, from May 2026; founder of HoloGlitterPacks from August 2020 to January 2026; host at Applebee's in Ann Arbor from August 2024 to June 2025; application reader for the M&T Summer Institute, February to April 2026.",
      "Student organisations at Penn, which are activities rather than employment: the Wharton Undergraduate Entrepreneurship Club, the M&T Innovation Fund, Moso Capital, the Wharton Undergraduate Finance Club, the Wharton Hedge Fund Club, and the operations committee of the Student Federal Credit Union.",
      "Pre-college summer programmes, which are education rather than internships: the Wharton Global Youth Program in 2022 (Essentials of Leadership), University of Michigan Summer Discovery in 2023 (personal finance and entrepreneurship, public speaking, college essay writing, social psychology), and MIDAS at Michigan in 2024 (introduction to data science and AI).",
      "The Oakland University Summer Mathematics Institute and Washtenaw Community College in 2024 were college courses taken early, not programmes or jobs.",
    ],
  },

  {
    id: "writing-news",
    title: "Writing, news, and market interests",
    keywords:
      "writing writes essay memo memos pitch pitches stock coverage news read reading follow markets sector sectors publication published press article journalism debate speaking poetry business economic technology market developments opinion view perspectives",
    use: "Distinguish what she wrote from what was written about her. The press on the site is coverage of her projects, not her byline.",
    facts: [
      "Alice writes blog posts about business, technology, finance, markets, and other subjects she finds interesting.",
      "She regularly follows company, economic, technology, and market news.",
      "She does not only summarize developments; she forms and explains her own views.",
      "Her writing reflects her combined interest in understanding products, businesses, industries, and market reactions.",
      "Regular written output: weekly market updates for the Wharton Undergraduate Finance Club and the Wharton Hedge Fund Club, with long/short recommendations for the latter, and investment memos evaluating startups for WUEC and Moso Capital.",
      "Prize writing: she won the Lemelson-MIT EurekaFest essay contest in 2024, and the Kappy Family Anne Frank Art and Writing Competition at the Zekelman Holocaust Center in 2023.",
      "Speaking and argument, at school: debate through to nationals, where her Pro-Con Challenge team placed 5th, plus poetry club and co-leading TEDxYouth.",
      "The site has a stock pitches page, but it is empty and says so — 'Offline for now. Will be back!' Don't imply there are pitches to read.",
      "The press on the site — MLive, the Ypsilanti Press, Lemelson-MIT, The Saline Post, The Sun Times News — is coverage of SoloStep, Science Olympiad, NHS and the Saline Youth Council. Written about her, not by her.",
    ],
  },

  {
    id: "career-priorities",
    title: "Career priorities",
    keywords:
      "career priorities want wants looking for next goal near-term industry path plan interested seeking recruiting full-time offer role choose choice preference learning people team colleagues meaningful work transactions deal flow",
    use: "Only what's below is settled. If someone asks what she wants next, or to rank finance against software, say the site doesn't spell that out rather than guessing at it.",
    facts: [
      "The site states the interest plainly: investment banking and early-stage venture, with small software projects on the side.",
      "That's what she's actually doing now — banking at Arbor Lake over the summer, and the venture side through the M&T Innovation Fund, Moso Capital and WUEC during term.",
      "Alice's leading priorities when evaluating an opportunity are: learning experience, deal flow, and people.",
      "Alice wants to learn quickly, work with people she respects, and gain exposure to meaningful transactions.",
      "The quality of the team and experience matters more to her than prestige or compensation alone.",
    ],
  },

  {
    id: "long-term-goals",
    title: "Long-term goals",
    keywords:
      "long term future five ten years ambition ambitions aspire dream eventually someday vision plan later start found own firm private equity investment banking career path trajectory exit",
    use: "Use this for questions about her long-term plans, future goals, or eventual ambitions. She is open-minded as she gains more experience.",
    facts: [
      "Alice wants to learn as much as possible about the financial industry.",
      "She could see herself remaining in investment banking or eventually moving into private equity.",
      "She genuinely enjoys analyzing companies, industries, markets, and transactions.",
      "She wants to remain open-minded as she gains more experience.",
    ],
  },

  {
    id: "employer-fit",
    title: "Employer-specific response rules",
    keywords:
      "hire hiring recruit recruiter fit good candidate why should employer firm bank fund company role position group team interview offer strengths pitch",
    /* The one category sent with every question. Hiring questions arrive in
       pieces — "why should I hire her", then "Goldman, TMT, summer analyst" two
       turns later — and the piece that names the firm carries none of the words
       that would retrieve this. Short enough that carrying it always is
       cheaper than getting it wrong. */
    always: true,
    use: "These are rules for answering, not facts about Alice. Ask only for whichever of firm, group and position is still missing — never for one already given. Once you have them, answer in that frame and lead with the closest evidence below.",
    facts: [
      "With the firm known but not the group: take the shape below that the firm fits as a whole, answer from it, and say plainly that the emphasis would change once the group is known. A partial answer offered as partial is useful; one passed off as tailored is not.",
      "For an investment bank or an M&A group: lead with Arbor Lake — cross-border middle-market M&A, 4 targets analysed, 57 buyers screened, 3 deal-team presentations — then the DCF and comparable-company work through the finance and hedge fund clubs, then the P&L she actually owned at HoloGlitterPacks, $50 of starting capital to $65K net profit across 15K orders.",
      "For a venture or growth fund: lead with the diligence — 9 of 70 applicants at the M&T Innovation Fund and $15K directed across 3 investments, 15 startups at Moso Capital, investment memos on an 80-applicant competition at WUEC — and note that she has been a founder herself, which most student analysts haven't.",
      "For a software or technical role: lead with the CS half of M&T, then the Chrome Extension Project as something she designed, built and shipped, then SoloStep's Arduino control system, then the data science coursework.",
      "For a startup or an operating role: lead with HoloGlitterPacks end to end, five years of pricing, cost models and the full P&L, and SoloStep from senior-centre interviews through to a working prototype and a provisional patent.",
      "If the employer doesn't fit any of those shapes, use the nearest evidence and say why it's the nearest, rather than stretching what she's done to fit.",
      "Say what the evidence supports and stop. No superlatives she hasn't earned, no skills the record doesn't show, and never a claim about why she's interested in that particular firm — she hasn't said, and inventing enthusiasm on her behalf is the fastest way to embarrass her.",
    ],
  },
];

function tokenize(value) {
  return String(value)
    .toLowerCase()
    .split(/[^a-z0-9&]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

/** A category as the prompt sees it: its usage line, if it has one, then its facts. */
function render(category) {
  const lines = category.use ? [`How to use these: ${category.use}`, ...category.facts] : category.facts;
  return { title: category.title, text: lines.join(" ") };
}

/**
 * The categories worth sending for one question.
 *
 * Scored the same way the page's own retrieval scores passages — a term present
 * anywhere counts once, a term in the title counts more — so that a question
 * pulls in the two or three subjects it actually touches rather than the file.
 *
 * Categories with no facts in them are skipped before anything else: an unwritten
 * category should leave the assistant with nothing to say, not with a heading.
 *
 * @param {string} query The question, plus any earlier turn worth matching on.
 * @returns {{title: string, text: string}[]}
 */
export function selectNotes(query, limit = MAX_NOTES) {
  const written = notes.filter((category) => category.facts.length);
  const pinned = written.filter((category) => category.always);
  const rest = written.filter((category) => !category.always);

  const terms = tokenize(query);
  if (!terms.length) return pinned.map(render);

  const scored = rest.map((category) => {
    const title = category.title.toLowerCase();
    const keywords = category.keywords.toLowerCase();
    const body = category.facts.join(" ").toLowerCase();

    /* Weighted by how deliberate the match is. `keywords` were written to be
       matched on, so a hit there says more than the same word turning up in a
       sentence — "summer" is the subject of the preprofessional category and an
       accident in every category that mentions a summer. Without that
       separation the ties break by position in the file, which means nothing. */
    let score = 0;
    for (const term of terms) {
      if (title.includes(term)) score += 3;
      else if (keywords.includes(term)) score += 2;
      else if (body.includes(term)) score += 1;
    }
    return { category, score };
  });

  const matched = scored
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.category);

  return [...pinned, ...matched].map(render);
}
