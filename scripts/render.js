/**
 * Renderer. Turns the plain data in content/content.js into the page.
 *
 * Nothing here knows about any particular entry — add an object to an array in
 * content.js and it picks up the same layout, spacing, and type automatically,
 * including its own page at item.html?id=<its id>.
 */

import { createWalker } from "./character.js";

/* ---------- small DOM helpers ---------- */

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (key === "html") node.innerHTML = value;
    else node.setAttribute(key, value === true ? "" : String(value));
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

export function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Stable id for an entry — its own `id` if set, otherwise from its name. */
export function entryId(item) {
  return item.id || slug(item.org || item.name);
}

export function entryHref(item) {
  return `item.html?id=${encodeURIComponent(entryId(item))}`;
}

const VIDEO = /\.(mp4|webm|mov|m4v)$/i;

/* Missing files remove their own figure rather than showing a broken icon, so a
   half-filled content file still looks finished. `onGone` lets a caller hear
   about it — figuresFold uses it to drop a heading whose pictures all vanished. */
function figure(media, onGone) {
  if (!media || !media.src) return null;

  const isVideo = VIDEO.test(media.src);

  /* preload="none" means the poster is all that loads until someone presses
     play — three clips on a page cost nothing to arrive at. */
  const inner = isVideo
    ? el("video", {
        src: media.src,
        poster: media.poster || null,
        controls: true,
        preload: "none",
        playsinline: true,
        "aria-label": media.alt || media.caption || "Video",
      })
    : el("img", {
        src: media.src,
        alt: media.alt || "",
        loading: "lazy",
        decoding: "async",
      });

  const fig = el("figure", { class: isVideo ? "shot shot--video" : "shot" }, [
    inner,
    media.caption ? el("figcaption", { text: media.caption }) : null,
  ]);

  /* A missing image quietly removes itself. Videos keep their poster — a browser
     that can't play the file should still show the still. */
  if (!isVideo) {
    inner.addEventListener(
      "error",
      () => {
        fig.remove();
        if (onGone) onGone();
      },
      { once: true }
    );
  }
  return fig;
}

/** Accepts `images`, `videos`, or `media` — anything with a src. */
export function figures(...lists) {
  const items = lists.flatMap((list) => list || []);
  const built = items.map((media) => figure(media)).filter(Boolean);
  if (!built.length) return null;
  return el(
    "div",
    { class: built.length === 1 ? "figures figures--single" : "figures" },
    built
  );
}

/* "Photos", "Video", "Photos and video" — whichever the set actually is. */
function mediaLabel(items) {
  const videos = items.filter((m) => VIDEO.test(m.src)).length;
  const photos = items.length - videos;
  if (photos && videos) return "Photos and video";
  if (videos) return videos === 1 ? "Video" : "Videos";
  return photos === 1 ? "Photo" : "Photos";
}

/**
 * The same figures, behind a heading you click to open.
 *
 * Used where entries sit in a list — the homepage and the archive — so a run of
 * photos doesn't push the next entry off the screen. An entry's own page shows
 * its pictures outright instead; there's nothing below them to bury.
 *
 * @param {Array<Array|undefined>} lists — `images`, `videos`, `media`
 * @param {{label?: string, note?: string, strip?: boolean}} options
 */
export function figuresFold(lists, options = {}) {
  const items = lists.flatMap((list) => list || []).filter((m) => m && m.src);
  if (!items.length) return null;

  /* If every picture turns out to be missing, take the heading with it —
     otherwise the fold opens onto nothing. */
  let remaining = items.length;
  let fold = null;
  let note = null;
  const gone = new WeakSet();
  function drop(fig) {
    if (!fig || gone.has(fig)) return; // a probe and the img's own error can both land
    gone.add(fig);
    fig.remove();
    remaining -= 1;
    if (remaining === 0 && fold) fold.remove();
    /* The count promises what's behind the heading, so it has to keep up. */
    else if (note && !options.note) note.textContent = remaining > 1 ? String(remaining) : "";
  }

  const built = items.map((media, index) => figure(media, () => drop(built[index])));

  /* The pictures are lazy and start out of sight, so nothing would fetch them
     until someone opened the fold — and a heading whose files are all missing
     would then vanish under their cursor. Settle it at load instead: ask for
     each one now, off-document, and let the answer prune the fold before it is
     ever clicked. The browser serves the same bytes from cache on open. */
  items.forEach((media, index) => {
    if (VIDEO.test(media.src)) return; // videos keep their poster by design
    const probe = new Image();
    probe.addEventListener("error", () => drop(built[index]), { once: true });
    probe.src = media.src;
  });

  const gallery = el(
    "div",
    {
      class: options.strip
        ? "figures figures--strip"
        : built.length === 1
          ? "figures figures--single"
          : "figures",
    },
    built
  );

  note = el("span", {
    class: "fold__note",
    text: options.note || (built.length > 1 ? String(built.length) : ""),
  });

  fold = el("details", { class: "fold fold--media" }, [
    el("summary", { class: "fold__summary" }, [
      el("span", { class: "fold__marker", "aria-hidden": "true" }),
      el("span", { class: "fold__label", text: options.label || mediaLabel(items) }),
      note,
    ]),
    el("div", { class: "fold__body" }, [gallery]),
  ]);
  return fold;
}

function linkButtons(links, className = "entry__links") {
  if (!links || !links.length) return null;
  return el(
    "div",
    { class: className },
    links.map((link) =>
      link.action === "ask"
        ? el("button", { class: "btn", type: "button", "data-ask-alice": true }, [
            link.label,
            el("span", { class: "btn__glyph", text: "→", "aria-hidden": "true" }),
          ])
        : el(
            "a",
            {
              class: "btn",
              href: link.href,
              target: link.external ? "_blank" : null,
              rel: link.external ? "noreferrer noopener" : null,
            },
            [
              link.label,
              link.external
                ? el("span", { class: "btn__glyph", text: "↗", "aria-hidden": "true" })
                : null,
            ]
          )
    )
  );
}

function paragraphs(items, className) {
  if (!items || !items.length) return null;
  return el("div", { class: className }, items.map((text) => el("p", { text })));
}

function bullets(points) {
  if (!points || !points.length) return null;
  return el("ul", { class: "entry__points" }, points.map((p) => el("li", { text: p })));
}

function tags(items) {
  if (!items || !items.length) return null;
  return el("ul", { class: "entry__tags" }, items.map((t) => el("li", { text: t })));
}

/* ---------- press ---------- */

export function renderPressList(items, className = "press-list") {
  if (!items || !items.length) return null;
  return el(
    "ul",
    { class: className },
    items.map((row) =>
      el("li", {}, [
        el("span", { class: "press-list__pub", text: row.publication || "" }),
        el("a", {
          class: "press-list__title",
          href: row.href,
          text: row.title,
          target: "_blank",
          rel: "noreferrer noopener",
        }),
        el("span", { class: "press-list__date", text: row.date || "" }),
      ])
    )
  );
}

/* ---------- introduction ---------- */

export function renderIntro(host, { site, intro }) {
  const aside = el(
    "aside",
    { class: "intro__aside", "aria-label": "Details" },
    (intro.sidebar || []).map((block) =>
      el("dl", { class: "aside-block" }, [
        el("dt", { class: "label", text: block.label }),
        ...(block.lines || []).map((line) => el("dd", { text: line })),
      ])
    )
  );

  /* She paces along the bottom of the sidebar. Clicking her opens the
     assistant — the walker just carries data-ask-alice, which is all the
     assistant listens for. */
  const walker = createWalker({ size: 42 });
  aside.append(el("div", { class: "aside-walk" }, [walker.node]));

  host.replaceChildren(
    el("div", { class: "intro__grid" }, [
      el("div", { class: "intro__main" }, [
        el("h1", { class: "intro__name", text: site.title || site.name }),
        paragraphs(intro.paragraphs, "intro__body"),
        linkButtons(intro.links, "intro__links"),
      ]),
      aside,
    ])
  );
}

/* ---------- section shell ---------- */

/**
 * The plum squares that sit on the rule above a section and breathe. Decoration
 * only — they carry no text and are hidden from assistive tech. `--n` is the
 * square's place in the row and `--phase` shifts the whole row, so two rules on
 * screen at once don't pulse in lockstep. styles.css turns both into delays.
 */
function sparks(order = 0, count = 5) {
  return el(
    "div",
    { class: "sparks", "aria-hidden": "true", style: `--phase: ${(order % 4) * 1.9}s` },
    Array.from({ length: count }, (_, index) =>
      el("span", { class: "spark", style: `--n: ${index}` })
    )
  );
}

function sectionShell(id, heading, note, order = 0) {
  const section = el("section", { class: "section", id }, [
    sparks(order),
    el("div", { class: "wrap" }, [
      el("div", { class: "section__head" }, [
        heading.index ? el("span", { class: "section__num", text: heading.index }) : null,
        el("h2", { class: "section__title", text: heading.title }),
        note ? el("p", { class: "section__note", text: note }) : null,
      ]),
    ]),
  ]);
  return { section, body: section.querySelector(".wrap") };
}

/* ---------- entry list ----------
   The homepage shows the short version. Photos, videos, press, and the longer
   write-up live on the entry's own page. */

function entryRow(item) {
  const rail = el("div", { class: "entry__rail" }, [
    item.date ? el("span", { class: "meta", text: item.date }) : null,
    item.place ? el("span", { class: "label", text: item.place }) : null,
  ]);

  const main = el("div", { class: "entry__main" }, [
    el("h3", { class: "entry__title" }, [
      el("a", { class: "entry__link", href: entryHref(item) }, [
        item.org || item.name,
        el("span", { class: "entry__arrow", text: "↗", "aria-hidden": "true" }),
      ]),
    ]),
    item.role || item.kind ? el("p", { class: "entry__role", text: item.role || item.kind }) : null,
    item.summary ? el("p", { class: "entry__summary", text: item.summary }) : null,
    tags(item.tags),
  ]);

  return el("article", { class: "entry", id: entryId(item) }, [rail, main]);
}

export function renderEntries(items) {
  return el("div", { class: "entries" }, items.map(entryRow));
}

/**
 * Entries shown in full, in place — no title link, nothing behind them. Used on
 * the archive page, where there are no separate pages to click through to.
 * `press` is the whole press list; each entry picks out the articles naming it.
 */
export function renderDetailedEntries(items, press = []) {
  return el(
    "div",
    { class: "entries" },
    items.map((item) => {
      const id = entryId(item);
      const cited = press.filter((row) => row.item && row.item === id);

      const rail = el("div", { class: "entry__rail" }, [
        item.date ? el("span", { class: "meta", text: item.date }) : null,
        item.place ? el("span", { class: "label", text: item.place }) : null,
      ]);

      const main = el("div", { class: "entry__main" }, [
        el("h3", { class: "entry__title", text: item.org || item.name }),
        item.role || item.kind
          ? el("p", { class: "entry__role", text: item.role || item.kind })
          : null,
        item.summary ? el("p", { class: "entry__summary", text: item.summary }) : null,
        paragraphs(item.body, "entry__body"),
        bullets(item.points),
        tags(item.tags),
        figuresFold([item.images, item.videos, item.media]),
        cited.length
          ? el("div", { class: "entry__press" }, [
              el("p", { class: "label", text: "Press" }),
              renderPressList(cited),
            ])
          : null,
      ]);

      return el("article", { class: "entry", id }, [rail, main]);
    })
  );
}

/** A plain list of one-liners — the "also did" tail of the archive. */
export function renderPlainList(items) {
  if (!items || !items.length) return null;
  return el("ul", { class: "plain-list" }, items.map((text) => el("li", { text })));
}

/** Awards and the like, grouped with a small left column per row. */
export function renderGroups(groups) {
  if (!groups || !groups.length) return null;
  return el(
    "div",
    { class: "archive" },
    groups.map((group) =>
      el("div", { class: "archive-year" }, [
        el("div", { class: "archive-year__label", text: group.group || group.year }),
        el(
          "div",
          {},
          (group.items || group.entries || []).map((row) =>
            el("div", { class: "archive-item" }, [
              el("span", { class: "archive-item__when", text: row.when || "" }),
              row.href
                ? el("a", {
                    class: "archive-item__what",
                    href: row.href,
                    text: row.what,
                    target: "_blank",
                    rel: "noreferrer noopener",
                  })
                : el("span", { class: "archive-item__what", text: row.what }),
              el("span", { class: "archive-item__tag", text: row.tag || "" }),
            ])
          )
        ),
      ])
    )
  );
}

/* ---------- clubs (At Penn) ----------
   Tabs across the top, one card each. Everything about a club lives on its
   card — there's no separate page to click through to. */

function pills(item) {
  const values = [item.role, item.date, item.place, ...(item.tags || [])].filter(Boolean);
  if (!values.length) return null;
  return el("ul", { class: "pills" }, values.map((v) => el("li", { class: "pill", text: v })));
}

function clubCard(item, selected) {
  const id = entryId(item);
  return el(
    "div",
    {
      class: "card",
      id,
      role: "tabpanel",
      "aria-labelledby": `tab-${id}`,
      tabindex: "0",
      hidden: !selected,
    },
    [
      el("div", { class: "card__head" }, [
        el("h3", { class: "card__title", text: item.org || item.name }),
        item.website
          ? el("div", { class: "card__links" }, [
              el("a", {
                href: item.website,
                target: "_blank",
                rel: "noreferrer noopener",
                text: "Website",
              }),
            ])
          : null,
      ]),
      el("div", { class: "card__body" }, [
        item.summary ? el("p", { class: "card__desc", text: item.summary }) : null,
        pills(item),
        bullets(item.points),
        figuresFold([item.images, item.videos, item.media]),
      ]),
    ]
  );
}

export function renderClubs(items) {
  const tabs = items.map((item, index) => {
    const id = entryId(item);
    return el("button", {
      class: "tab",
      type: "button",
      role: "tab",
      id: `tab-${id}`,
      "aria-controls": id,
      "aria-selected": index === 0 ? "true" : "false",
      tabindex: index === 0 ? "0" : "-1",
      text: item.short || item.org || item.name,
    });
  });

  const cards = items.map((item, index) => clubCard(item, index === 0));

  function select(index) {
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
    });
    cards.forEach((card, i) => {
      card.hidden = i !== index;
    });
  }

  const list = el("div", { class: "tabs", role: "tablist", "aria-label": "Clubs" }, tabs);

  list.addEventListener("click", (event) => {
    const index = tabs.indexOf(event.target.closest(".tab"));
    if (index !== -1) select(index);
  });

  list.addEventListener("keydown", (event) => {
    const current = tabs.indexOf(document.activeElement);
    if (current === -1) return;
    const step = { ArrowRight: 1, ArrowLeft: -1, Home: -Infinity, End: Infinity }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const next = Math.min(tabs.length - 1, Math.max(0, current + (Number.isFinite(step) ? step : 0)));
    const target = step === -Infinity ? 0 : step === Infinity ? tabs.length - 1 : next;
    select(target);
    tabs[target].focus();
  });

  /* #wuec and friends open straight onto that club. */
  const fromHash = items.findIndex((item) => `#${entryId(item)}` === location.hash);
  if (fromHash > 0) select(fromHash);

  return el("div", { class: "clubs" }, [list, ...cards]);
}

/* ---------- about & contact ---------- */

/** A heading you click to unfold — used for the puzzle collection under About. */
export function renderCollection(collection) {
  return figuresFold([collection.media], {
    label: collection.label,
    note: collection.note,
    strip: true,
  });
}

export function renderAbout(about) {
  /* The personal gallery is a mix of portrait and landscape, so it flows as
     columns rather than a grid. */
  const media = figuresFold([about.media], { strip: true });
  const folds = (about.collections || []).map(renderCollection).filter(Boolean);

  return el("div", { class: "about-grid" }, [
    el("div", {}),
    el("div", {}, [
      el("div", { class: "about-body" }, [
        el("div", { class: "about-text" }, [paragraphs(about.paragraphs, "")]),
        el("div", { class: "about-side" }, [
          about.portrait
            ? el("div", { class: "about-portrait" }, [figure(about.portrait)].filter(Boolean))
            : null,
          el("p", { class: "label", text: "Contact" }),
          el(
            "ul",
            { class: "contact-list" },
            (about.contact || []).map((row) =>
              el("li", {}, [
                el("span", { class: "k", text: row.label }),
                row.href
                  ? el("a", {
                      class: "v",
                      href: row.href,
                      text: row.value,
                      target: /^https?:/.test(row.href) ? "_blank" : null,
                      rel: /^https?:/.test(row.href) ? "noreferrer noopener" : null,
                    })
                  : el("span", { class: "v", text: row.value }),
              ])
            )
          ),
        ]),
      ]),
      media,
      ...folds,
    ]),
  ]);
}

/* ---------- page assembly ---------- */

export function renderSections(host, data) {
  const { sections, experience, atPenn, work, about } = data;
  const built = [];

  const bodies = {
    experience: () => (experience.length ? renderEntries(experience) : null),
    penn: () => (atPenn.length ? renderClubs(atPenn) : null),
    work: () => (work.length ? renderEntries(work) : null),
    about: () => renderAbout(about),
  };

  for (const spec of sections) {
    const build = bodies[spec.id];
    if (!build) continue; // entries with an `href` are pages, not sections
    const content = build();
    if (!content) continue; // an empty section is never published

    const { section, body } = sectionShell(
      spec.id,
      { title: spec.heading, index: String(built.length + 1).padStart(2, "0") },
      spec.note,
      built.length
    );
    body.append(content);
    built.push({ spec, section });
  }

  host.replaceChildren(...built.map((b) => b.section));
  return built.map((b) => b.spec);
}

/**
 * `specs` may mix sections (linked by anchor) and pages (linked by href).
 * `absolute` prefixes anchors with index.html, for use away from the homepage.
 */
export function renderNav(host, specs, { absolute = false } = {}) {
  host.replaceChildren(
    ...specs.map((spec) =>
      el("a", {
        href: spec.href || `${absolute ? "index.html" : ""}#${spec.id}`,
        text: spec.label,
      })
    )
  );
}

/* Highlights the nav link for whichever section is currently on screen. */
export function trackNav(navHost, specs) {
  const links = new Map(
    specs.map((spec) => [spec.id, navHost.querySelector(`a[href="#${spec.id}"]`)])
  );
  const targets = specs.map((s) => document.getElementById(s.id)).filter(Boolean);
  if (!targets.length || !("IntersectionObserver" in window)) return;

  const visible = new Set();
  const observer = new IntersectionObserver(
    (records) => {
      for (const record of records) {
        if (record.isIntersecting) visible.add(record.target.id);
        else visible.delete(record.target.id);
      }
      const current = specs.find((s) => visible.has(s.id));
      for (const [id, link] of links) {
        if (!link) continue;
        if (current && id === current.id) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      }
    },
    { rootMargin: "-56px 0px -60% 0px", threshold: 0 }
  );
  targets.forEach((t) => observer.observe(t));
}
