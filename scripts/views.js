/**
 * Page assembly — the part of each page that is only its content.
 *
 * Everything here fills a page's <main> from content/content.js and stops
 * there: no assistant, no scrolling effects, no timers, nothing that needs a
 * real browser. That restraint is the whole point. It lets
 * scripts/build/prerender.mjs run this same code under Node and ship finished
 * HTML, so the words are already in the file a search engine downloads instead
 * of arriving a moment later once JavaScript has run.
 *
 * The four boot files — main.js, item.js, archive.js, pitches.js — call into
 * here and then add the interactive parts on top.
 *
 * One renderer, two runtimes. Add an entry to content.js and it appears in the
 * built HTML and in the browser without either being told about it.
 */

import * as content from "../content/content.js";
import {
  el,
  entryId,
  entryHref,
  figures,
  renderNav,
  renderPressList,
  renderIntro,
  renderSections,
  renderDetailedEntries,
  renderPlainList,
  renderGroups,
} from "./render.js";

/** The one bundle every page passes around, the assistant included. */
export const data = {
  site: content.site,
  intro: content.intro,
  experience: content.experience,
  atPenn: content.atPenn,
  work: content.work,
  education: content.education,
  highSchool: content.highSchool,
  alsoDid: content.alsoDid,
  summerPrograms: content.summerPrograms,
  awards: content.awards,
  about: content.about,
  press: content.press,
  sections: content.sections,
};

export const archivePage = content.archivePage || {};
export const pitchesPage = content.pitchesPage || {};
export const pitches = content.pitches || [];

/* Which list an entry belongs to, and where "back" goes from its page. */
export const ENTRY_GROUPS = [
  { sectionId: "experience", label: "Experience", items: data.experience },
  { sectionId: "penn", label: "At Penn", items: data.atPenn },
  { sectionId: "work", label: "Projects", items: data.work },
];

/** Every entry that gets a page of its own, in the order the build writes them. */
export function allEntries() {
  return ENTRY_GROUPS.flatMap((group) =>
    group.items.map((item, index) => ({ group, item, index }))
  );
}

export function findEntry(id) {
  for (const group of ENTRY_GROUPS) {
    const index = group.items.findIndex((item) => entryId(item) === id);
    if (index !== -1) return { group, item: group.items[index], index };
  }
  return null;
}

/* ---------- shared chrome ---------- */

/** Title, header brand, footer line. The same three on every page. */
export function applyChrome(title) {
  document.title = title;
  const brand = document.querySelector(".brand");
  if (brand) brand.textContent = data.site.brand || data.site.name;
  const footerNote = document.getElementById("footer-note");
  if (footerNote) footerNote.textContent = `${data.site.name} · ${new Date().getFullYear()}`;
}

function backLink(href, label) {
  return el("p", { class: "label item__back" }, [
    el("a", { href }, [el("span", { text: "← ", "aria-hidden": "true" }), label]),
  ]);
}

function paragraphs(items, className) {
  if (!items || !items.length) return null;
  return el("div", { class: className }, items.map((text) => el("p", { text })));
}

/* ---------- the homepage ---------- */

/**
 * Fills #intro and #sections, then the nav from whichever sections published.
 * Returns the published specs so the caller can hang scroll-tracking off them.
 */
export function renderHomePage() {
  applyChrome(data.site.metaTitle || data.site.name);

  renderIntro(document.getElementById("intro"), data);
  const published = renderSections(document.getElementById("sections"), data);

  /* The nav carries the published sections plus any page links (Archive). */
  const publishedIds = new Set(published.map((spec) => spec.id));
  const navSpecs = data.sections.filter((spec) => spec.href || publishedIds.has(spec.id));
  renderNav(document.getElementById("site-nav"), navSpecs);

  return published;
}

/* ---------- an entry's own page ---------- */

function metaLine(item) {
  return [item.date, item.place].filter(Boolean).join(" · ");
}

function entryLinks(item) {
  if (!item.links || !item.links.length) return null;
  return el(
    "div",
    { class: "entry__links" },
    item.links.map((link) =>
      el(
        "a",
        {
          class: "btn",
          href: link.href,
          target: link.external ? "_blank" : null,
          rel: link.external ? "noreferrer noopener" : null,
        },
        [
          link.label,
          link.external ? el("span", { class: "btn__glyph", text: "↗", "aria-hidden": "true" }) : null,
        ]
      )
    )
  );
}

function pressFor(id) {
  const list = renderPressList((data.press || []).filter((row) => row.item === id));
  if (!list) return null;
  return el("section", { class: "item__block" }, [
    el("p", { class: "label", text: "Press" }),
    list,
  ]);
}

function neighbours(group, index) {
  const previous = group.items[index - 1];
  const next = group.items[index + 1];
  if (!previous && !next) return null;

  return el("nav", { class: "item__pager", "aria-label": "Other entries" }, [
    previous
      ? el("a", { class: "item__pager-link", href: entryHref(previous) }, [
          el("span", { class: "label", text: "Previous" }),
          el("span", { class: "item__pager-name", text: previous.org || previous.name }),
        ])
      : el("span", {}),
    next
      ? el("a", { class: "item__pager-link item__pager-link--next", href: entryHref(next) }, [
          el("span", { class: "label", text: "Next" }),
          el("span", { class: "item__pager-name", text: next.org || next.name }),
        ])
      : el("span", {}),
  ]);
}

/** The title and description an entry's page should carry, for <head>. */
export function entryMeta(item) {
  const title = item.org || item.name;
  const summary = item.summary || (item.body && item.body[0]) || "";
  return {
    title: `${title} — ${data.site.name}`,
    heading: title,
    description: summary ? `${title} — ${summary}` : data.site.description,
  };
}

export function renderEntryPage(host, { group, item, index }) {
  const meta = entryMeta(item);
  applyChrome(meta.title);

  host.replaceChildren(
    el("div", { class: "wrap item-head" }, [
      backLink(`index.html#${group.sectionId}`, group.label),
      el("div", { class: "item__headmain" }, [
        el("h1", { class: "item__title", text: meta.heading }),
        item.role || item.kind
          ? el("p", { class: "item__role", text: item.role || item.kind })
          : null,
        metaLine(item) ? el("p", { class: "meta item__meta", text: metaLine(item) }) : null,
      ]),
    ]),

    el("div", { class: "wrap item-body" }, [
      el("div", { class: "item__rail" }),
      el("div", { class: "item__main" }, [
        item.summary ? el("p", { class: "item__lede", text: item.summary }) : null,
        paragraphs(item.body, "item__prose"),
        item.points && item.points.length
          ? el("section", { class: "item__block" }, [
              el("p", { class: "label", text: "Highlights" }),
              el("ul", { class: "entry__points" }, item.points.map((p) => el("li", { text: p }))),
            ])
          : null,
        item.tags && item.tags.length
          ? el("ul", { class: "entry__tags" }, item.tags.map((t) => el("li", { text: t })))
          : null,
        entryLinks(item),
        figures(item.images, item.videos, item.media),
        pressFor(entryId(item)),
      ]),
    ]),

    el("div", { class: "wrap" }, [neighbours(group, index)].filter(Boolean))
  );

  renderNav(document.getElementById("site-nav"), data.sections, { absolute: true });
  return meta;
}

export function renderMissingPage(host) {
  applyChrome(`Not found — ${data.site.name}`);
  host.replaceChildren(
    el("div", { class: "wrap item-head" }, [
      backLink("index.html", "Home"),
      el("div", { class: "item__headmain" }, [
        el("h1", { class: "item__title", text: "Nothing here" }),
        el("p", {
          class: "item__role",
          text: "That link doesn’t point at anything on this site — it may be old, or mistyped. Everything Alice has published is on the homepage.",
        }),
        el("div", { class: "entry__links" }, [
          el("a", { class: "btn", href: "index.html", text: "Back to the homepage" }),
        ]),
      ]),
    ])
  );
  renderNav(document.getElementById("site-nav"), data.sections, { absolute: true });
}

/* ---------- the archive ---------- */

/* Each block gets the same head as a homepage section, minus the number. */
function block(title, body, note) {
  if (!body) return null;
  return el("section", { class: "section" }, [
    el("div", { class: "wrap" }, [
      el("div", { class: "section__head" }, [
        el("h2", { class: "section__title", text: title }),
        note ? el("p", { class: "section__note", text: note }) : null,
      ]),
      body,
    ]),
  ]);
}

export function renderArchivePage(host) {
  const heading = archivePage.heading || "Archive";
  applyChrome(`${heading} — ${data.site.name}`);

  host.replaceChildren(
    el("div", { class: "wrap item-head" }, [
      backLink("index.html", "Home"),
      el("div", { class: "item__headmain" }, [
        el("h1", { class: "item__title", text: heading }),
        archivePage.intro
          ? el("p", { class: "item__lede archive-intro", text: archivePage.intro })
          : null,
      ]),
    ]),

    ...[
      block("Activities", renderDetailedEntries(data.highSchool || [], data.press)),
      block("Education", renderDetailedEntries(data.education || [])),
      block("Summer programs", renderDetailedEntries(data.summerPrograms || [])),
      block("Also", renderPlainList(data.alsoDid)),
      block("Awards", renderGroups(data.awards)),
      block(
        "Press",
        renderPressList((data.press || []).filter((row) => !row.item)),
        "Articles tied to a particular thing sit with it above."
      ),
    ].filter(Boolean)
  );

  renderNav(document.getElementById("site-nav"), data.sections, { absolute: true });
}

/* ---------- stock pitches ---------- */

/* One pitch, laid out like every other row on the site. */
function pitchRow(pitch) {
  const rail = el("div", { class: "entry__rail" }, [
    pitch.date ? el("span", { class: "meta", text: pitch.date }) : null,
    pitch.ticker ? el("span", { class: "label", text: pitch.ticker }) : null,
  ]);

  const main = el("div", { class: "entry__main" }, [
    el("h2", { class: "entry__title", text: pitch.company }),
    pitch.summary ? el("p", { class: "entry__summary", text: pitch.summary }) : null,
    pitch.link && pitch.link.href
      ? el("div", { class: "entry__links" }, [
          el("a", { class: "btn", href: pitch.link.href }, [pitch.link.label || "Read the pitch"]),
        ])
      : null,
  ]);

  return el("article", { class: "entry" }, [rail, main]);
}

export function renderPitchesPage(host) {
  const heading = pitchesPage.heading || "Stock pitches";
  applyChrome(`${heading} — ${data.site.name}`);

  /* With nothing to show, deliberately just the note. No previews, no
     placeholders, no countdown. */
  const body = pitches.length
    ? el("div", { class: "entries" }, pitches.map(pitchRow))
    : el("p", { class: "status-note", text: pitchesPage.note || "Offline for now." });

  host.replaceChildren(
    el("div", { class: "wrap item-head" }, [
      backLink("index.html", "Home"),
      el("div", { class: "item__headmain" }, [
        el("h1", { class: "item__title", text: heading }),
      ]),
    ]),
    el("div", { class: "wrap item-body" }, [
      el("div", { class: "item__rail" }),
      el("div", { class: "item__main" }, [body]),
    ])
  );

  renderNav(document.getElementById("site-nav"), data.sections, { absolute: true });
}
