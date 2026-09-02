# Editing this site

Everything you'd want to change day to day is in **`content/content.js`**. It's a
plain list of objects. Add one, and it gets the same type, spacing, and rules as
everything else — you never have to touch the layout.

Edit the file, commit, push. GitHub Pages redeploys on its own — there's a build
step now, but it runs up in Actions, so it isn't a thing you do.

```
content/content.js      all the words and which photos go where
assets/img/             photos and screenshots you add
assets/media/           videos and their poster frames
assets/images/          older photos already in the repo
index.html              the homepage
item.html               the shell every entry page is built from
archive.html            everything from before Penn
pitches.html            stock pitches
scripts/views.js        assembles each page — used by the browser and the build
scripts/render.js       turns content.js into the pieces of a page
scripts/item.js         the entry pages
scripts/assistant.js    the Ask about Alice panel
scripts/character.js    the pixel character (artwork only)
scripts/config.js       assistant endpoint, and copy protection, on/off
scripts/protect.js      makes the page awkward to copy from
scripts/theme.js        the light / dark switch
scripts/build/          the build — see "The build" below
styles.css              the whole visual system
robots.txt              tells crawlers where the sitemap is
worker/                 the assistant's backend — see worker/README.md
```

## How the two levels work

The homepage is the short version: date, title, role, and a one-line summary.
Every title is a link to that entry's own page, which is where the bullets,
photos, videos, longer write-up, and press live.

Each of those pages is written out by the build: an entry whose `id` is
`hologlitterpacks` becomes `hologlitterpacks.html`. Add an entry with an `id`
and its page exists on the next push — nothing to create, nothing to link up.

Give every entry a short, permanent `id`. It's the URL, so changing it later
breaks any link anyone saved. It's also a filename, so it can't be `index`,
`item`, `archive`, `pitches`, `robots`, `sitemap`, `styles`, or `404` — the
build stops with an error rather than overwriting one of those.

Links from before this changed, of the form `item.html?id=hologlitterpacks`,
still work: `item.html` reads the id and forwards to the page.

## Adding an experience or a Penn activity

Copy an entry, edit it, and put it where you want it in the array. Array order
is page order.

```js
{
  id: "firm-name",                     // its URL — short, permanent
  role: "Summer Analyst",              // the job title
  org: "Firm Name",                    // the heading — required
  date: "Jun 2027 — Aug 2027",         // shown in the left rail
  place: "New York, NY",               // optional, under the date
  summary: "One line of context.",     // optional
  body: ["A paragraph.", "Another."],  // optional; entry page only
  points: [                            // optional; each becomes a bullet
    "The thing you did, with the number in it.",
  ],
  tags: ["Python", "React"],           // optional, small gray words
  links: [                             // optional, compact buttons
    { label: "Write-up", href: "https://…", external: true },
  ],
  images: [                            // optional, entry page only — see below
    { src: "assets/img/file.jpg", alt: "What it shows", caption: "Optional." },
  ],
}
```

Every field but `org` is optional. Leave one out and it simply isn't rendered —
no gap, no placeholder. `body` and `images` only appear on the entry's own page;
everything else shows on both.

## Adding a club (At Penn)

At Penn is the one section laid out as tabs — one tab per club, one card each.
The card says everything worth saying about a club, so you don't need to click
through; there's a page behind it all the same, because a club nobody can link
to is a club search engines can't find.

```js
{
  id: "wuec",                        // the tab anchor, and its page: wuec.html
  short: "WUEC",                     // the tab label — keep it short
  org: "Wharton Undergraduate Entrepreneurship Club",  // the card heading
  website: "https://…",              // the club's own site; omit for none
  role: "Co-President",              // these three become the small pills
  date: "Oct 2025 — Present",
  place: "Philadelphia, PA",
  summary: "One or two lines about the club.",
  points: ["What you did there."],
  images: [{ src: "assets/img/file.jpg", alt: "…", caption: "…" }],
}
```

Add one to `atPenn` and it becomes a new tab automatically. Order in the array
is tab order, and the first one is selected on load. `index.html#wuec` opens
straight onto that tab.

Each card carries two small links: **Details**, which goes to the club's own
page, and **Website**, the club's own site. Leave `website` out and only
Details is shown.

## Adding a project

Same shape, in the `work` array, with two differences: use `name` instead of
`org`, and `kind` instead of `role`. Use `body` for real paragraphs (each string
is its own paragraph) and `points` for a list.

```js
{
  id: "project-name",
  name: "Project name",
  kind: "Personal project",   // or "Research", "Course project", "Venture"…
  date: "2027",
  summary: "One line.",
  body: ["A paragraph.", "Another paragraph."],
  images: [{ src: "assets/img/shot.png", alt: "…", caption: "…" }],
  links: [{ label: "Try it", href: "https://…", external: true }],
}
```

Projects don't have to be software. An essay, a venture, a research project, or
a competition entry all use the same fields — give it the format that fits, and
skip what doesn't apply.

## Adding photos

Drop the file in `assets/img/` and point `src` at it. One image renders wide;
two or more render side by side and stack on mobile. Proportions are preserved —
nothing is cropped.

`alt` describes the picture for someone who can't see it. `caption` is the small
gray line underneath, and is worth writing when the photo needs context.

If a file is missing, its figure removes itself rather than showing a broken
image, so a half-finished entry still looks finished.

Some older files in `assets/images/` are HEIC photos with a `.png` name
(`etsy1`, `etsy2`, `etsy3`, `bridge1`). No browser can display those — convert
them to real JPEG or PNG before using them.

## Adding a video

Same `images` array — the renderer notices the file extension and builds a video
player instead. Always give it a `poster`; it's the still shown before anyone
presses play, and nothing but the poster downloads until they do.

```js
images: [
  {
    src: "assets/media/clip.mp4",
    poster: "assets/media/clip.jpg",
    alt: "What happens in the clip",
    caption: "Optional.",
  },
]
```

Phone videos need converting first — straight-from-iPhone `.MOV` files are often
HEVC, which only Safari plays. With ffmpeg installed:

```bash
ffmpeg -i input.MOV -vf "scale='min(1280,iw)':-2" -c:v libx264 -preset slow \
  -crf 28 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 64k -ac 1 \
  assets/media/clip.mp4
ffmpeg -ss 0.5 -i assets/media/clip.mp4 -frames:v 1 -q:v 4 assets/media/clip.jpg
```

The three puzzle clips under About were converted this way — 37 MB of `.MOV`
became 8 MB of `.mp4`.

## Adding press

`press` in `content.js` is one list, shown at the end of the Archive.

```js
{
  publication: "MLive",
  title: "The headline, as written",
  date: "Apr 2024",              // optional
  href: "https://…",
  item: "solostep",              // optional
}
```

Set `item` to an entry's `id` and the article appears on that entry's page,
under its highlights.

**The archive and press are no longer sections on the homepage.** The data is
still in `content.js` and the assistant still reads it, but the only press a
visitor sees is on the entry page it belongs to — so an article with no `item`
isn't shown anywhere. To bring the archive back as a section, add
`{ id: "archive", label: "Archive", heading: "Archive" }` to `sections`; it
renders the press list at the end, as before.

### Photos still to add

Several entries name files that aren't in the repo yet. You don't have to keep
a list — run `npm run build` and it prints every one of them:

```
15 pictures named in content.js aren't in the repo, so
they were left out of the built pages. Add the files to publish them:
  assets/img/slimetime-stats.png
  assets/img/wuec-nyc-trek-group.jpg
  …
```

Drop a file in under exactly that name and it appears on the next push. Until
then the entry is built without it, so nothing shows a broken picture.

The food-drive photo has no home yet. Two articles in `press` — the Saline
National Honor Society one and the Saline Youth Council one — aren't attached to
any entry, because there's no entry for them. To add one, create it in `work`
with an `id`, set `item:` on those press rows to match, and drop the photo in.

## Adding an archive entry

The archive is grouped newest year first. Add to an existing year, or add a new
group at the top.

```js
{
  year: "2027",
  entries: [
    { when: "Mar", what: "What happened.", tag: "Award", href: "https://…" },
  ],
}
```

`when` is the short left column, `tag` is the gray word on the right (`Work`,
`Penn`, `Project`, `Award`, `Milestone`, `Press` — anything you like), and
`href` is optional and makes the line a link.

## The archive

`archive.html` holds everything from before Penn. It's linked from the nav but
isn't part of the homepage, and its entries are shown in full where they sit —
no pages behind them. Four lists in `content.js` feed it:

- `education` — schools and coursework
- `highSchool` — activities, using the same fields as any other entry
- `summerPrograms` — same shape again
- `alsoDid` — a plain list of one-liners for everything else
- `awards` — `{ group, items: [{ when, what }] }`

A press article whose `item` matches a `highSchool` entry's `id` appears inside
that entry. Anything with no `item` collects at the bottom of the page.

## Reordering or removing a section

`sections` at the bottom of `content.js` controls the nav and the section order:

```js
export const sections = [
  { id: "experience", label: "Experience", heading: "Experience" },  // a section
  { id: "archive", label: "Archive", href: "archive.html" },         // a page
];
```

An entry with `heading` is a section on the homepage. An entry with `href` is
just a nav link to another page. Move a line to reorder. Delete a line to drop
it from the nav. Only sections are numbered, and they renumber themselves. A
section whose array is empty is skipped — the site never publishes an empty
heading.

## Dropdowns under About

`about.media` is shown straight away. `about.collections` is a list of things
folded away behind a heading you click:

```js
collections: [
  { label: "3D wooden puzzles", note: "Photos and clips of the builds.", media: [ … ] },
]
```

Add another object and you get another dropdown. `media` takes photos and
videos in the same array.

## The assistant

`scripts/config.js` has one switch. Set `assistantEndpoint` to your Worker URL to
enable written answers; leave it blank and the assistant quotes the page instead
and says so. Set `assistantEnabled: false` to remove it entirely.

The assistant reads `content/content.js`, so it can repeat anything published
here. **If you don't want it said, don't put it in `content.js`.**

It also reads a second, private file that isn't part of the site:
`worker/src/aliceKnowledge.js`, Alice's own notes about herself — hometown,
favourites, how she works, how to answer a recruiter. Those live in the Worker
so they're never downloadable from the page, and they only change when the
Worker is redeployed. Both files, and the deployment and cost notes, are covered
in `worker/README.md`.

## Stock pitches

`pitches.html` is its own page, linked from the buttons under the introduction.
It's driven by two things in `content.js`:

```js
export const pitchesPage = { heading: "Stock pitches", note: "Offline for now. Will be back!" };
export const pitches = [];
```

While `pitches` is empty the page shows the note and nothing else. Add an entry
and the note is replaced by the list — no other change needed:

```js
{
  company: "Acme Corporation",
  ticker: "ACME",                                              // optional
  date: "Mar 2027",                                            // optional
  summary: "The one-line thesis.",                             // optional
  link: { label: "Deck", href: "assets/files/acme-pitch.pdf" },// optional
}
```

Empty fields are skipped, so a pitch with only a company name still renders
cleanly. The page is fully static — no backend, nothing to deploy.

**One warning.** Anything committed to this repo is downloadable by anyone who
guesses the URL, linked or not. Only commit a pitch PDF you're happy to have
public; don't rely on leaving it unlinked.

## The build

The site renders itself from `content.js` in the browser. That's lovely to edit
and invisible to anything that doesn't run JavaScript — what a search engine
first downloads is an empty `<div>`, and the real page turns up on a later pass
that can be days behind and is never promised.

So `scripts/build/prerender.mjs` runs the same renderer under Node against a
fake browser and writes finished pages into `dist/`. There's no second copy of
the layout to keep in step: `scripts/views.js` is the only place a page is
assembled, and it doesn't know which of the two runtimes it's in. Add an entry
and it appears in the built HTML and in the browser without either being told.

Out of it come the homepage, the archive, the pitches page, one real page per
entry, and `sitemap.xml`, all with their titles, descriptions, and link
previews filled in from `content.js`.

GitHub Actions runs it on every push and publishes `dist/`. That also means the
Worker source and these notes are no longer served to the web — only the built
site is.

To see it locally:

```bash
npm install     # once
npm run build   # writes dist/
```

`dist/` is generated, ignored by git, and safe to delete.

**If a push doesn't deploy, look at the Actions tab first.** A mistake in
`content.js` now fails the build rather than reaching the site, which is the
right way round, but it does mean a broken edit shows up as a failed run rather
than a broken page.

## Being found

The point of all of the above is that someone searching your name finds you.
Three things do the work, and all three come out of `content.js`:

- `site.metaTitle` — the line a search result shows. It carries the program and
  the school as well as the name, because "alice jiang m&t" is what people type.
  Keep it under about 60 characters or Google cuts the end off.
- `site.description` — the grey line underneath it.
- `site.knowsAbout` — the subjects the site shows you work on. Only add one the
  entries actually evidence; it's a claim, and an unsupported claim helps
  nothing.
- The `schema.org` block the build writes into the homepage. It's how you say
  that Alice Jiang, Weiran Jiang, M&T, UPenn, Wharton, SEAS, that GitHub account
  and that LinkedIn are one person rather than eight unrelated words — each
  school listed under every name someone actually types. It's assembled from
  `site`, `education`, `atPenn`, and the external links under `intro.links`, so
  adding a profile link to the introduction also tells Google about it.

Nothing here needs maintaining. Keep `content.js` true and it stays true.

Worth knowing what this can and can't do. Your name, alone or with any of Penn,
M&T, Wharton, finance, or computer science beside it, is winnable and is what
all of the above is for. A bare "finance" or "computer science" is not: those
results belong to Wikipedia and universities, and no amount of work on a
personal site changes that. Aim at the queries someone looking for *you* types.

A mistyped or dead link gets `404.html`, built from the same shell as everything
else, so it looks like the site and offers a way back into it.

## Copy protection

`scripts/protect.js` turns off text selection, swallows copy and cut, removes
the right-click menu, stops pictures being dragged off, and makes printing come
out blank. Turn it off with `protectContent: false` in `scripts/config.js`.

Contact details are deliberately exempt — an email address nobody can copy is a
contact detail that doesn't work — as is anything you can type into. Add
`data-copyable` to anything else you want left alone.

**Be clear-eyed about what it is.** It stops idle drag-select-copy and nothing
sterner. Anyone can read View Source, and the pages are pre-rendered now, so
every word is right there in the file — that's the point of them. And no
website can prevent a screenshot: there is no browser API for it, and a phone
camera pointed at the screen ends the argument anyway.

## Light and dark

`scripts/theme.js` runs in `<head>` before anything paints, so the page never
flashes the wrong colours. It sets `data-theme="light"` or `"dark"` on `<html>`
and builds the switch in the header.

A first visit follows the reader's system setting; once they pick a side it's
remembered and stops following the system.

Every colour on the site comes from a variable at the top of `styles.css`, and
the `[data-theme="dark"]` block right below re-declares those variables. No
other rule knows which theme is on — so if you add something new, use the
variables (`var(--ink)`, `var(--line)`, `var(--paper)`…) and it works in both
without any extra work.

## The reading line

The thin line down the left of Experience, At Penn, and Selected work is
`scripts/timeline.js`. It draws downward as you scroll into a section, retracts
as you scroll back up, and fills each dot as the line reaches it. Each section
tracks itself.

You never have to touch it. It measures nothing up front — the tip of the line
always sits at the same height on screen, and a dot lights when it passes that
height — so new entries, taller photos, and longer text are handled on their
own. It's attached in `scripts/main.js` with one line:

```js
attachTimelines(".entries");
```

Point it at another container to add one elsewhere. Two knobs live in
`styles.css`: `--tl-gutter` (how far the line sits from the text) and
`--tl-dot-top` (how far below an entry's top its dot sits). The script reads the
second one, so the dot and the line can't drift apart.

With reduced motion the line is drawn once, fully, and never moves. With
JavaScript off the CSS still leaves a plain gray rail.

## The character

`scripts/character.js` holds the pixel drawing and nothing else. `PIXELS` is a
grid of letters, `PALETTE` maps each letter to a colour, and `LEGS` holds the
two frames of her walk. Redraw her by editing those — the chat panel doesn't
know or care what she looks like.

She appears twice: as the launcher in the bottom corner, and pacing along the
foot of the introduction sidebar. Both open the chat, and neither is wired to
it directly — they just carry `data-ask-alice`, which is the only thing the
assistant listens for. Put that attribute on anything and it opens the chat
too.

The pacing one measures its container, so it walks the width of whatever it's
put in. It pauses while you point at it, so it can be clicked, and stands
still under reduced motion.

## A note on what's here now

`SoloStep` and `Bridge Design` under Selected work, and the awards in the
archive, were carried over from the previous version of this site. If you'd
rather lead with newer work, delete those objects — nothing else breaks.
