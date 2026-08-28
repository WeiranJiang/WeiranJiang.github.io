# Editing this site

Everything you'd want to change day to day is in **`content/content.js`**. It's a
plain list of objects. Add one, and it gets the same type, spacing, and rules as
everything else — you never have to touch the layout.

Nothing else needs a build step. Edit the file, commit, push; GitHub Pages
redeploys on its own.

```
content/content.js      all the words and which photos go where
assets/img/             photos and screenshots you add
assets/media/           videos and their poster frames
assets/images/          older photos already in the repo
index.html              the homepage
item.html               the page behind every title — one file, every entry
scripts/render.js       turns content.js into the homepage
scripts/item.js         turns content.js into the entry pages
scripts/assistant.js    the Ask about Alice panel
scripts/character.js    the pixel character (artwork only)
scripts/config.js       assistant endpoint on/off
styles.css              the whole visual system
worker/                 the assistant's backend — see worker/README.md
```

## How the two levels work

The homepage is the short version: date, title, role, one-line summary, and the
bullets. Every title is a link to that entry's own page, which is where the
photos, videos, longer write-up, and press live.

Those pages are all one file. `item.html?id=hologlitterpacks` looks up the entry
whose `id` is `hologlitterpacks` and renders it. Add an entry with an `id` and
its page exists immediately — nothing to create, nothing to link up.

Give every entry a short, permanent `id`. It's the URL, so changing it later
breaks any link anyone saved.

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

Set `item` to an entry's `id` and the article also appears on that entry's page.
Leave it off and the article only shows in the Archive.

### Photos still to add

These entries reference files that aren't in the repo yet. Drop them in with
exactly these names and they'll appear:

| Path | What it is |
| --- | --- |
| `assets/img/slimetime-stats.png` | SlimeTime stats page |
| `assets/img/slimetime-home.png` | SlimeTime home / slime screen |
| `assets/img/wuec-nyc-trek-group.jpg` | WUEC NYC trek, group outside the building |
| `assets/img/wuec-nyc-trek-boardroom.jpg` | WUEC NYC trek, boardroom |

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

## Reordering or removing a section

`sections` at the bottom of `content.js` controls the nav and the section order:

```js
export const sections = [
  { id: "experience", label: "Experience", heading: "Experience" },
  …
];
```

Move a line to reorder. Delete a line to drop the section from the page and the
nav. Section numbers in the left rail renumber themselves. A section whose array
is empty is skipped automatically — the site never publishes an empty heading.

## The assistant

`scripts/config.js` has one switch. Set `assistantEndpoint` to your Worker URL to
enable written answers; leave it blank and the assistant quotes the page instead
and says so. Set `assistantEnabled: false` to remove it entirely.

The assistant reads `content/content.js` and nothing else, so it can only repeat
what's published here. **If you don't want it said, don't put it in
`content.js`.** Deployment and cost notes are in `worker/README.md`.

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
16×16 grid of letters, `PALETTE` maps each letter to a colour. Redraw her by
editing those two — the chat panel doesn't know or care what she looks like.

## A note on what's here now

`SoloStep` and `Bridge Design` under Selected work, and the awards in the
archive, were carried over from the previous version of this site. If you'd
rather lead with newer work, delete those objects — nothing else breaks.
