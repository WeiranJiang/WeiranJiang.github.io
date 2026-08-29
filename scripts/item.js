/**
 * The page behind each title on the homepage: item.html?id=<entry id>.
 *
 * It reads the same content/content.js, so a new entry gets a working page the
 * moment it's added — no new file, no new markup.
 */

import * as content from "../content/content.js";
import { el, entryId, entryHref, figures, renderNav, renderPressList } from "./render.js";
import { mountAssistant } from "./assistant.js";

const data = {
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

/* Which list each entry belongs to, and where "back" goes. */
const GROUPS = [
  { sectionId: "experience", label: "Experience", items: data.experience },
  { sectionId: "penn", label: "At Penn", items: data.atPenn },
  { sectionId: "work", label: "Projects", items: data.work },
];

function find(id) {
  for (const group of GROUPS) {
    const index = group.items.findIndex((item) => entryId(item) === id);
    if (index !== -1) return { group, item: group.items[index], index };
  }
  return null;
}

function backLink(group) {
  return el("p", { class: "label item__back" }, [
    el("a", { href: `index.html#${group.sectionId}` }, [
      el("span", { text: "← ", "aria-hidden": "true" }),
      group.label,
    ]),
  ]);
}

function metaLine(item) {
  return [item.date, item.place].filter(Boolean).join(" · ");
}

function links(item) {
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

function paragraphs(items, className) {
  if (!items || !items.length) return null;
  return el("div", { class: className }, items.map((text) => el("p", { text })));
}

function pressFor(id) {
  const rows = (data.press || []).filter((row) => row.item === id);
  const list = renderPressList(rows);
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

function renderMissing(host) {
  document.title = `Not found — ${data.site.name}`;
  host.replaceChildren(
    el("div", { class: "wrap item-head" }, [
      el("p", { class: "label item__back" }, [
        el("a", { href: "index.html" }, [el("span", { text: "← ", "aria-hidden": "true" }), "Home"]),
      ]),
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
}

function render(host, { group, item, index }) {
  const title = item.org || item.name;
  document.title = `${title} — ${data.site.name}`;

  const description = item.summary || (item.body && item.body[0]) || "";
  const meta = document.querySelector('meta[name="description"]');
  if (meta && description) meta.setAttribute("content", `${title} — ${description}`);

  host.replaceChildren(
    el("div", { class: "wrap item-head" }, [
      backLink(group),
      el("div", { class: "item__headmain" }, [
        el("h1", { class: "item__title", text: title }),
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
        links(item),
        figures(item.images, item.videos, item.media),
        pressFor(entryId(item)),
      ]),
    ]),

    el("div", { class: "wrap" }, [neighbours(group, index)].filter(Boolean))
  );
}

/* ---- boot ---- */

const params = new URLSearchParams(location.search);
const match = find((params.get("id") || "").trim());
const main = document.getElementById("main");

if (match) render(main, match);
else renderMissing(main);

const brand = document.querySelector(".brand");
if (brand) brand.textContent = data.site.brand || data.site.name;

const footerNote = document.getElementById("footer-note");
if (footerNote) footerNote.textContent = `${data.site.name} · ${new Date().getFullYear()}`;

renderNav(document.getElementById("site-nav"), data.sections, { absolute: true });
mountAssistant(document.getElementById("assistant-root"), data);
