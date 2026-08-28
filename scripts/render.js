/**
 * Renderer. Turns the plain data in content/content.js into the page.
 *
 * Nothing here knows about any particular entry — add an object to an array in
 * content.js and it picks up the same layout, spacing, and type automatically,
 * including its own page at item.html?id=<its id>.
 */

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
   half-filled content file still looks finished. */
function figure(media) {
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
  if (!isVideo) inner.addEventListener("error", () => fig.remove(), { once: true });
  return fig;
}

/** Accepts `images`, `videos`, or `media` — anything with a src. */
export function figures(...lists) {
  const items = lists.flatMap((list) => list || []);
  const built = items.map(figure).filter(Boolean);
  if (!built.length) return null;
  return el(
    "div",
    { class: built.length === 1 ? "figures figures--single" : "figures" },
    built
  );
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
  host.replaceChildren(
    el("div", { class: "intro__grid" }, [
      el("div", { class: "intro__main" }, [
        el("p", { class: "label intro__label", text: "01 / Introduction" }),
        el("h1", { class: "intro__name", text: site.title || site.name }),
        paragraphs(intro.paragraphs, "intro__body"),
        linkButtons(intro.links, "intro__links"),
      ]),
      el(
        "aside",
        { class: "intro__aside", "aria-label": "Details" },
        (intro.sidebar || []).map((block) =>
          el("dl", { class: "aside-block" }, [
            el("dt", { class: "label", text: block.label }),
            ...(block.lines || []).map((line) => el("dd", { text: line })),
          ])
        )
      ),
    ])
  );
}

/* ---------- section shell ---------- */

function sectionShell(id, heading, note) {
  const section = el("section", { class: "section", id }, [
    el("div", { class: "wrap" }, [
      el("div", { class: "section__head" }, [
        el("p", { class: "label", text: heading.index || "" }),
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
    bullets(item.points),
    tags(item.tags),
  ]);

  return el("article", { class: "entry", id: entryId(item) }, [rail, main]);
}

export function renderEntries(items) {
  return el("div", { class: "entries" }, items.map(entryRow));
}

/* ---------- archive ---------- */

export function renderArchive(groups, press) {
  const node = el(
    "div",
    { class: "archive" },
    groups.map((group) =>
      el("div", { class: "archive-year" }, [
        el("div", { class: "archive-year__label", text: group.year }),
        el(
          "div",
          {},
          (group.entries || []).map((entry) =>
            el("div", { class: "archive-item" }, [
              el("span", { class: "archive-item__when", text: entry.when || "" }),
              entry.href
                ? el("a", {
                    class: "archive-item__what",
                    href: entry.href,
                    text: entry.what,
                    target: /^https?:/.test(entry.href) ? "_blank" : null,
                    rel: /^https?:/.test(entry.href) ? "noreferrer noopener" : null,
                  })
                : el("span", { class: "archive-item__what", text: entry.what }),
              el("span", { class: "archive-item__tag", text: entry.tag || "" }),
            ])
          )
        ),
      ])
    )
  );

  const list = renderPressList(press);
  if (list) {
    node.append(
      el("div", { class: "archive-year" }, [
        el("div", { class: "archive-year__label", text: "Press" }),
        el("div", {}, [list]),
      ])
    );
  }
  return node;
}

/* ---------- about & contact ---------- */

export function renderAbout(about) {
  const media = figures(about.media);
  if (media) media.classList.add("figures--strip");

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
    ]),
  ]);
}

/* ---------- page assembly ---------- */

export function renderSections(host, data) {
  const { sections, experience, atPenn, work, archive, about, press } = data;
  const built = [];

  const bodies = {
    experience: () => (experience.length ? renderEntries(experience) : null),
    penn: () => (atPenn.length ? renderEntries(atPenn) : null),
    work: () => (work.length ? renderEntries(work) : null),
    archive: () => (archive.length ? renderArchive(archive, press) : null),
    about: () => renderAbout(about),
  };

  for (const [index, spec] of sections.entries()) {
    const build = bodies[spec.id];
    if (!build) continue;
    const content = build();
    if (!content) continue; // an empty section is never published

    const { section, body } = sectionShell(
      spec.id,
      { title: spec.heading, index: `${String(index + 2).padStart(2, "0")} /` },
      spec.note
    );
    body.append(content);
    built.push({ spec, section });
  }

  host.replaceChildren(...built.map((b) => b.section));
  return built.map((b) => b.spec);
}

export function renderNav(host, specs, { absolute = false } = {}) {
  host.replaceChildren(
    ...specs.map((spec) =>
      el("a", { href: `${absolute ? "index.html" : ""}#${spec.id}`, text: spec.label })
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
