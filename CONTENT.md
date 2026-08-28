# Editing this site

Everything you'd want to change day to day is in **`content/content.js`**. It's a
plain list of objects. Add one, and it gets the same type, spacing, and rules as
everything else — you never have to touch the layout.

Nothing else needs a build step. Edit the file, commit, push; GitHub Pages
redeploys on its own.

```
content/content.js      all the words and which photos go where
assets/img/             photos and screenshots you add
assets/images/          older photos already in the repo
scripts/render.js       turns content.js into the page
scripts/assistant.js    the Ask about Alice panel
scripts/character.js    the pixel character (artwork only)
scripts/config.js       assistant endpoint on/off
styles.css              the whole visual system
worker/                 the assistant's backend — see worker/README.md
```

## Adding an experience or a Penn activity

Copy an entry, edit it, and put it where you want it in the array. Array order
is page order.

```js
{
  role: "Summer Analyst",              // the job title
  org: "Firm Name",                    // the heading — required
  date: "Jun 2027 — Aug 2027",         // shown in the left rail
  place: "New York, NY",               // optional, under the date
  summary: "One line of context.",     // optional
  points: [                            // optional; each becomes a bullet
    "The thing you did, with the number in it.",
  ],
  tags: ["Python", "React"],           // optional, small gray words
  links: [                             // optional, compact buttons
    { label: "Write-up", href: "https://…", external: true },
  ],
  images: [                            // optional, see below
    { src: "assets/img/file.jpg", alt: "What it shows", caption: "Optional." },
  ],
}
```

Every field but `org` is optional. Leave one out and it simply isn't rendered —
no gap, no placeholder.

## Adding a project

Same shape, in the `work` array, with two differences: use `name` instead of
`org`, and `kind` instead of `role`. Use `body` for real paragraphs (each string
is its own paragraph) and `points` for a list.

```js
{
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

### Photos still to add

These entries reference files that aren't in the repo yet. Drop them in with
exactly these names and they'll appear:

| Path | What it is |
| --- | --- |
| `assets/img/slimetime-stats.png` | SlimeTime stats page |
| `assets/img/slimetime-home.png` | SlimeTime home / slime screen |
| `assets/img/wuec-nyc-trek-group.jpg` | WUEC NYC trek, group outside the building |
| `assets/img/wuec-nyc-trek-boardroom.jpg` | WUEC NYC trek, boardroom |

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

## The character

`scripts/character.js` holds the pixel drawing and nothing else. `PIXELS` is a
16×16 grid of letters, `PALETTE` maps each letter to a colour. Redraw her by
editing those two — the chat panel doesn't know or care what she looks like.

## A note on what's here now

`SoloStep` and `Bridge Design` under Selected work, and the awards in the
archive, were carried over from the previous version of this site. If you'd
rather lead with newer work, delete those objects — nothing else breaks.
