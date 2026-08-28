/**
 * Renderer. Turns the plain data in content/content.js into the page.
 *
 * Nothing here knows about any particular entry — add an object to an array in
 * content.js and it picks up the same layout, spacing, and type automatically.
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

/* Missing image files remove their own figure rather than showing a broken icon,
   so a half-filled content file still looks finished. */
function figure(image) {
  if (!image || !image.src) return null;
  const img = el("img", {
    src: image.src,
    alt: image.alt || "",
    loading: "lazy",
    decoding: "async",
  });
  const fig = el("figure", { class: "shot" }, [
    img,
    image.caption ? el("figcaption", { text: image.caption }) : null,
  ]);
  img.addEventListener("error", () => fig.remove(), { once: true });
  return fig;
}

function figures(images) {
  const list = (images || []).map(figure).filter(Boolean);
  if (!list.length) return null;
  return el(
    "div",
    { class: list.length === 1 ? "figures figures--single" : "figures" },
    list
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

/* ---------- entry list (Experience, At Penn, Selected work) ---------- */

function entryRow(item, kind) {
  const rail = el("div", { class: "entry__rail" }, [
    item.date ? el("span", { class: "meta", text: item.date }) : null,
    item.place ? el("span", { class: "label", text: item.place }) : null,
  ]);

  const main = el("div", { class: "entry__main" }, [
    el("h3", { class: "entry__title", text: item.org || item.name }),
    item.role || item.kind ? el("p", { class: "entry__role", text: item.role || item.kind }) : null,
    item.summary ? el("p", { class: "entry__summary", text: item.summary }) : null,
    paragraphs(item.body, "entry__body"),
    bullets(item.points),
    tags(item.tags),
    figures(item.images),
    linkButtons(item.links),
  ]);

  return el("article", { class: "entry", id: `${kind}-${slug(item.org || item.name)}` }, [rail, main]);
}

export function renderEntries(items, kind) {
  return el("div", { class: "entries" }, items.map((item) => entryRow(item, kind)));
}

/* ---------- archive ---------- */

export function renderArchive(groups) {
  return el(
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
}

/* ---------- about & contact ---------- */

export function renderAbout(about) {
  return el("div", { class: "about-grid" }, [
    el("div", {}),
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
  ]);
}

/* ---------- page assembly ---------- */

export function renderSections(host, data) {
  const { sections, experience, atPenn, work, archive, about } = data;
  const built = [];

  const bodies = {
    experience: () => (experience.length ? renderEntries(experience, "experience") : null),
    penn: () => (atPenn.length ? renderEntries(atPenn, "penn") : null),
    work: () => (work.length ? renderEntries(work, "work") : null),
    archive: () => (archive.length ? renderArchive(archive) : null),
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

export function renderNav(host, specs) {
  host.replaceChildren(
    ...specs.map((spec) => el("a", { href: `#${spec.id}`, text: spec.label }))
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
