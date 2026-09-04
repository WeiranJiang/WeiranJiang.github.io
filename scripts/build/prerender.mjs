/**
 * Pre-render — the build step that puts the site's words into its HTML.
 *
 * The site renders itself from content/content.js in the browser. That is lovely
 * to edit and invisible to anything that doesn't run JavaScript: what actually
 * arrives at a search engine is an empty <div>, and the real page shows up on a
 * later pass that may be days behind and is never guaranteed.
 *
 * So this runs the very same renderer under Node against a fake DOM, and writes
 * the finished pages into dist/. No second copy of the layout, no template to
 * keep in step — scripts/views.js is the only place a page is assembled, and it
 * doesn't know which of the two runtimes it's in.
 *
 * What comes out:
 *
 *   dist/index.html         the homepage, filled in
 *   dist/<entry id>.html    one real page per experience, club, and project
 *   dist/archive.html       the archive, filled in
 *   dist/pitches.html       stock pitches, filled in
 *   dist/item.html          the old ?id= links, which forward to the above
 *   dist/sitemap.xml        every page above, written from the same data
 *
 * Each page also gets the things a crawler reads and a person never sees: a
 * canonical URL, a description, Open Graph and Twitter cards for when a link is
 * pasted somewhere, and — on the homepage — a schema.org Person, which is how
 * you tell Google that "Alice Jiang", "Weiran Jiang", M&T, and Penn are all the
 * same someone rather than four unrelated words.
 *
 * Run it with `npm run build`. GitHub Actions runs it on every push and deploys
 * dist/, so editing content.js and pushing is still the whole workflow.
 */

import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseHTML } from "linkedom";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const DIST = path.join(ROOT, "dist");
const ORIGIN = "https://weiranjiang.github.io";

/** Copied across untouched. Anything not named here is not published. */
const ASSETS = [
  "styles.css",
  "scripts",
  "content",
  "assets",
  "robots.txt",
  "google25c28f57d641c7eb.html", // Search Console ownership. Removing it un-verifies the site.
];

/* An entry's id becomes a filename, so it can't be one we already use. */
const RESERVED = new Set(["index", "item", "archive", "pitches", "robots", "sitemap", "styles", "404"]);

const abs = (relative) => new URL(relative, `${ORIGIN}/`).href;

/* ---------------------------------------------------------------------------
 * A DOM good enough to render into
 * ------------------------------------------------------------------------ */

/**
 * linkedom gives us the tree; these fill in the two things it has no opinion
 * about. Neither matters to the output — the character measures herself again
 * in the browser, and the missing-image probe is a runtime concern — but the
 * renderer calls them, so they have to exist.
 */
function installDom(html) {
  const { window, document } = parseHTML(html);

  const rect = () => ({ width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0 });
  const element = window.Element.prototype;
  if (!element.getBoundingClientRect) element.getBoundingClientRect = rect;
  if (!("clientWidth" in element)) {
    Object.defineProperty(element, "clientWidth", { get: () => 0, configurable: true });
  }

  /* figuresFold asks the network whether each picture is really there. Off the
     network, every picture is presumed present — which is right: a file missing
     at build time is a file to go and add, not one to quietly drop. */
  class NoImage {
    addEventListener() {}
    removeEventListener() {}
    set src(_value) {}
  }

  /* Present but inert, so createWalker takes the observer path and doesn't
     leave a resize listener on a window that will never resize. */
  class NoResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  globalThis.window = window;
  globalThis.document = document;
  globalThis.Image = NoImage;
  globalThis.ResizeObserver = NoResizeObserver;
  window.ResizeObserver = NoResizeObserver;
  /* renderClubs opens on the tab named in the hash; a built page has no hash,
     so it opens on the first, which is what a first visit gets too. */
  globalThis.location = { hash: "", search: "", pathname: "/", href: `${ORIGIN}/` };

  return { window, document };
}

/* The renderer reads the globals above when it runs, so they go in first. */
installDom("<!DOCTYPE html><html><head></head><body></body></html>");
const views = await import("../views.js");
const { data } = views;

/* ---------------------------------------------------------------------------
 * Pictures that aren't there yet
 * ------------------------------------------------------------------------ */

/**
 * In the browser a missing photo quietly removes its own figure, so a
 * half-finished entry still looks finished. That trick needs a failed network
 * request, which a build doesn't have — but a build has something better, which
 * is the folder itself.
 *
 * Without this the built HTML would promise pictures that answer 404: bad for a
 * reader with images on and no JavaScript, and worse for a crawler, which reads
 * a page full of broken references as a page that isn't looked after.
 *
 * The names are collected and printed at the end, because a picture missing at
 * build time is usually one to go and add rather than one to forget about.
 */
const absentMedia = new Set();

/**
 * Is this file really there, spelled exactly this way?
 *
 * The second half matters more than it sounds. macOS doesn't care about case, so
 * a photo on disk as `Photo.JPG` and written as `photo.jpg` is found on the
 * laptop it was edited on — and then answers 404 on GitHub Pages, which runs on
 * Linux and does care. That failure never shows up until the site is live.
 * Walking the path a segment at a time and matching each name against the real
 * directory listing makes the build notice it the way the web server would.
 */
function existsExact(relative) {
  const segments = relative.split("/").filter(Boolean);
  let here = ROOT;
  for (const segment of segments) {
    let listing;
    try {
      listing = readdirSync(here);
    } catch {
      return false;
    }
    if (!listing.includes(segment)) return false;
    here = path.join(here, segment);
  }
  return true;
}

const onDisk = (ref) =>
  !ref || /^(https?:|data:)/.test(ref) || existsExact(ref.split("?")[0]);

function pruneMissingMedia(document) {
  for (const fig of document.querySelectorAll("figure.shot")) {
    const node = fig.querySelector("img, video");
    const src = node && node.getAttribute("src");
    if (onDisk(src)) continue;
    absentMedia.add(src);
    fig.remove();
  }

  /* One picture is laid out differently from several, so a group that lost some
     has to be told what it is now. A strip keeps its own layout either way. */
  for (const group of document.querySelectorAll(".figures")) {
    const count = group.children.length;
    if (!count) {
      group.remove();
      continue;
    }
    if (group.classList.contains("figures--strip")) continue;
    group.classList.toggle("figures--single", count === 1);
  }

  /* A fold whose pictures have all gone takes its heading with it — otherwise
     it opens onto nothing. One that lost only some corrects the count beside
     it. A note that isn't a count, like the wording on a collection, is left
     exactly as written. */
  for (const fold of document.querySelectorAll(".fold--media")) {
    const group = fold.querySelector(".figures");
    if (!group) {
      fold.remove();
      continue;
    }
    const note = fold.querySelector(".fold__note");
    if (note && /^\d*$/.test(note.textContent.trim())) {
      note.textContent = group.children.length > 1 ? String(group.children.length) : "";
    }
  }

  for (const holder of document.querySelectorAll(".about-portrait")) {
    if (!holder.children.length) holder.remove();
  }
}

/* ---------------------------------------------------------------------------
 * <head>
 * ------------------------------------------------------------------------ */

function upsert(document, tag, match, attrs) {
  let node = document.head.querySelector(match);
  if (!node) {
    node = document.createElement(tag);
    document.head.append(node);
  }
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

const meta = (document, name, content) =>
  content && upsert(document, "meta", `meta[name="${name}"]`, { name, content });

const property = (document, prop, content) =>
  content && upsert(document, "meta", `meta[property="${prop}"]`, { property: prop, content });

/**
 * The parts of a page nobody looks at and everything else reads: what it's
 * called, what it's about, where it really lives, and what to show when someone
 * pastes the link into Slack or iMessage.
 */
function applyHead(document, page) {
  const { title, description, canonical, image, jsonLd, noindex } = page;

  if (title) {
    upsert(document, "title", "title", {}).textContent = title;
    property(document, "og:title", title);
    meta(document, "twitter:title", title);
  }

  meta(document, "description", description);
  property(document, "og:description", description);
  meta(document, "twitter:description", description);

  property(document, "og:url", canonical);
  property(document, "og:type", page.ogType || "website");
  property(document, "og:site_name", data.site.name);
  property(document, "og:image", image);
  meta(document, "twitter:image", image);
  meta(document, "twitter:card", "summary_large_image");

  meta(document, "robots", noindex ? "noindex, follow" : "index, follow");
  upsert(document, "link", 'link[rel="canonical"]', { rel: "canonical", href: canonical });

  document.head.querySelectorAll('script[type="application/ld+json"]').forEach((n) => n.remove());
  if (jsonLd) {
    const script = document.createElement("script");
    script.setAttribute("type", "application/ld+json");
    script.textContent = JSON.stringify(jsonLd, null, 2);
    document.head.append(script);
  }
}

/* ---------------------------------------------------------------------------
 * Who she is, in the form a search engine reads
 * ------------------------------------------------------------------------ */

const PORTRAIT = abs(data.about?.portrait?.src || "assets/img/portrait.jpg");

/* Every external profile she links to from the introduction. Google uses these
   to confirm that this site, that GitHub account, and that LinkedIn are one
   person — which is most of what "rank me for my own name" comes down to. */
function profiles() {
  return (data.intro.links || [])
    .filter((link) => link.external && /^https?:/.test(link.href || ""))
    .map((link) => link.href);
}

const current = (item) => /present/i.test(item.date || "");

/**
 * The schools, each under every name a person actually types. Someone looking
 * for her writes "UPenn", or "Penn", or "M&T", far more often than they write
 * "University of Pennsylvania" — and a search engine matching a query to an
 * entity can only use the names it has been given.
 */
const SCHOOLS = [
  {
    "@type": "EducationalOrganization",
    name: "Jerome Fisher Program in Management & Technology",
    alternateName: ["Penn M&T", "M&T", "Jerome Fisher M&T"],
    url: "https://fisher.wharton.upenn.edu/",
  },
  {
    "@type": "CollegeOrUniversity",
    name: "University of Pennsylvania",
    alternateName: ["UPenn", "Penn"],
    url: "https://www.upenn.edu/",
  },
  {
    "@type": "CollegeOrUniversity",
    name: "The Wharton School",
    alternateName: "Wharton",
    url: "https://www.wharton.upenn.edu/",
  },
  {
    "@type": "CollegeOrUniversity",
    name: "University of Pennsylvania School of Engineering and Applied Science",
    alternateName: ["Penn Engineering", "SEAS"],
    url: "https://www.seas.upenn.edu/",
  },
];

function personSchema() {
  const job = data.experience.find(current);

  return {
    "@type": "Person",
    "@id": `${ORIGIN}/#alice`,
    name: data.site.name,
    /* She goes by Alice and is on paper as Weiran. Both are things people type. */
    alternateName: [data.site.fullName, "Weiran Jiang"].filter(Boolean),
    url: `${ORIGIN}/`,
    mainEntityOfPage: { "@id": `${ORIGIN}/#profile` },
    image: PORTRAIT,
    email: `mailto:${data.site.email}`,
    description: data.site.description,
    jobTitle: job ? job.role : undefined,
    worksFor: job ? { "@type": "Organization", name: job.org } : undefined,
    homeLocation: { "@type": "Place", name: data.site.location },
    knowsAbout: data.site.knowsAbout,
    affiliation: SCHOOLS,
    alumniOf: (data.education || []).map((school) => ({
      "@type": "EducationalOrganization",
      name: school.org,
    })),
    memberOf: (data.atPenn || []).map((club) => ({
      "@type": "Organization",
      name: club.org,
      url: club.website || undefined,
    })),
    sameAs: profiles(),
  };
}

/**
 * The homepage says three things at once: here is a website, here is a profile
 * page, here is the person it's about. Saying them as one linked graph rather
 * than three loose blocks is what lets a search engine treat the site and the
 * person as the same subject instead of two things that happen to share a page.
 */
function homeSchema() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      personSchema(),
      {
        "@type": "WebSite",
        "@id": `${ORIGIN}/#website`,
        url: `${ORIGIN}/`,
        name: `${data.site.name} — personal website`,
        alternateName: [data.site.name, "Weiran Jiang", data.site.fullName].filter(Boolean),
        inLanguage: "en",
        about: { "@id": `${ORIGIN}/#alice` },
        publisher: { "@id": `${ORIGIN}/#alice` },
      },
      {
        "@type": "ProfilePage",
        "@id": `${ORIGIN}/#profile`,
        url: `${ORIGIN}/`,
        name: data.site.metaTitle || data.site.name,
        isPartOf: { "@id": `${ORIGIN}/#website` },
        mainEntity: { "@id": `${ORIGIN}/#alice` },
      },
    ],
  };
}

/* Home › Experience › Arbor Lake Capital — the trail Google prints under a
   result instead of the raw URL. */
function breadcrumbs(group, item) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: data.site.name, item: `${ORIGIN}/` },
      { "@type": "ListItem", position: 2, name: group.label, item: `${ORIGIN}/#${group.sectionId}` },
      { "@type": "ListItem", position: 3, name: item.org || item.name },
    ],
  };
}

/* ---------------------------------------------------------------------------
 * Pages
 * ------------------------------------------------------------------------ */

const pages = [];

async function template(name) {
  return readFile(path.join(ROOT, name), "utf8");
}

/** Renders one page and records it for the sitemap. */
async function build({ from, to, render, head, sitemap = true }) {
  const { document } = installDom(await template(from));
  render(document);
  pruneMissingMedia(document);
  applyHead(document, head);

  await writeFile(path.join(DIST, to), `<!DOCTYPE html>\n${document.documentElement.outerHTML}\n`);
  if (sitemap) pages.push(to);
  return to;
}

async function buildHome() {
  await build({
    from: "index.html",
    to: "index.html",
    render: () => views.renderHomePage(),
    head: {
      title: data.site.metaTitle || data.site.name,
      description: data.site.description,
      canonical: `${ORIGIN}/`,
      image: PORTRAIT,
      ogType: "profile",
      jsonLd: homeSchema(),
    },
  });
}

async function buildEntries() {
  const written = [];

  for (const match of views.allEntries()) {
    const id = match.item.id || "";
    if (RESERVED.has(id)) {
      throw new Error(
        `The id "${id}" would overwrite ${id}.html, which is one of the site's own pages. ` +
          `Give that entry in content/content.js a different id.`
      );
    }

    const info = views.entryMeta(match.item);
    written.push(
      await build({
        from: "item.html",
        to: `${id}.html`,
        render: (document) => views.renderEntryPage(document.getElementById("main"), match),
        head: {
          title: info.title,
          description: info.description,
          canonical: abs(`${id}.html`),
          image: abs(match.item.images?.[0]?.src || data.about?.portrait?.src || "assets/img/portrait.jpg"),
          ogType: "article",
          jsonLd: breadcrumbs(match.group, match.item),
        },
      })
    );
  }

  return written;
}

async function buildArchive() {
  await build({
    from: "archive.html",
    to: "archive.html",
    render: (document) => views.renderArchivePage(document.getElementById("main")),
    head: {
      title: `${views.archivePage.heading || "Archive"} — ${data.site.name}`,
      description:
        "Alice Jiang's record from before Penn: Saline High School, 2021 to 2025 — activities, coursework, and awards.",
      canonical: abs("archive.html"),
      image: PORTRAIT,
    },
  });
}

async function buildPitches() {
  await build({
    from: "pitches.html",
    to: "pitches.html",
    render: (document) => views.renderPitchesPage(document.getElementById("main")),
    head: {
      title: `${views.pitchesPage.heading || "Stock pitches"} — ${data.site.name}`,
      description: `Stock pitches by ${data.site.name}.`,
      canonical: abs("pitches.html"),
      image: PORTRAIT,
    },
  });
}

/**
 * The old `item.html?id=…` links. Left as an empty shell on purpose: it can't
 * be pre-rendered, because one file can't be twelve different pages. Its script
 * reads the id and forwards to the built page. Kept out of the sitemap and
 * marked noindex so it never competes with the page it points at.
 */
async function buildItemShim() {
  await build({
    from: "item.html",
    to: "item.html",
    sitemap: false,
    render: () => {},
    head: {
      title: data.site.name,
      description: `A closer look at one piece of ${data.site.name}'s work.`,
      canonical: `${ORIGIN}/`,
      image: PORTRAIT,
      noindex: true,
    },
  });
}

/**
 * The page GitHub Pages serves for a URL that doesn't exist. It's the same
 * "Nothing here" the site already had, so a mistyped or dead link lands
 * somewhere that looks like the site and offers a way back into it.
 *
 * Pages serves this file at whatever address was asked for, which may be nested
 * — so its links are rewritten to start at the root. A relative "styles.css"
 * would otherwise be looked for next to a page that was never there.
 */
async function build404() {
  await build({
    from: "item.html",
    to: "404.html",
    sitemap: false,
    render: (document) => {
      views.renderMissingPage(document.getElementById("main"));

      for (const node of document.querySelectorAll("[href], [src]")) {
        for (const attribute of ["href", "src"]) {
          const value = node.getAttribute(attribute);
          if (!value || /^([a-z]+:|\/|#)/i.test(value)) continue;
          node.setAttribute(attribute, `/${value}`);
        }
      }
    },
    head: {
      title: `Not found — ${data.site.name}`,
      description: `That page isn't on ${data.site.name}'s site. Everything she has published is on the homepage.`,
      canonical: `${ORIGIN}/`,
      image: PORTRAIT,
      noindex: true,
    },
  });
}

/* ---------------------------------------------------------------------------
 * sitemap.xml
 * ------------------------------------------------------------------------ */

/* The commit this was built from — a date that means something, unlike "now",
   which would tell Google the whole site changed on every unrelated push. */
function lastModified() {
  try {
    return execFileSync("git", ["log", "-1", "--format=%cs"], { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

async function writeSitemap() {
  const lastmod = lastModified();
  const url = (page) => {
    const loc = page === "index.html" ? `${ORIGIN}/` : abs(page);
    const priority = page === "index.html" ? "1.0" : "0.7";
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>${priority}</priority>\n  </url>`;
  };

  await writeFile(
    path.join(DIST, "sitemap.xml"),
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `${pages.map(url).join("\n")}\n` +
      `</urlset>\n`
  );
}

/* ---------------------------------------------------------------------------
 * Go
 * ------------------------------------------------------------------------ */

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

/* Things that live next to the site's files but are not the site. .DS_Store is
   the one that matters: Finder writes a listing of the whole folder into it,
   including files you have since deleted, and copying it into dist/ puts that
   listing on the open web. The notes-to-self READMEs in assets/ are the same
   idea, less costly. */
const NOT_PUBLISHED = (source) => {
  const name = path.basename(source);
  return (
    source.includes(`${path.sep}scripts${path.sep}build`) ||
    name === ".DS_Store" ||
    name === "Thumbs.db" ||
    name.toLowerCase() === "readme.md"
  );
};

for (const asset of ASSETS) {
  await cp(path.join(ROOT, asset), path.join(DIST, asset), {
    recursive: true,
    filter: (source) => !NOT_PUBLISHED(source),
  });
}

await buildHome();
const entries = await buildEntries();
await buildArchive();
await buildPitches();
await buildItemShim();
await build404();
await writeSitemap();

console.log(`Built ${pages.length} pages into dist/`);
console.log(`  homepage, archive, pitches, and ${entries.length} entry pages`);
console.log(`  ${entries.join(", ")}`);

if (absentMedia.size) {
  console.log(`\n${absentMedia.size} pictures named in content.js aren't in the repo, so`);
  console.log(`they were left out of the built pages. Add the files to publish them:`);
  for (const src of [...absentMedia].sort()) console.log(`  ${src}`);
}

/* createCharacter arms a timer for her wave; nothing will ever fire it here. */
process.exit(0);
