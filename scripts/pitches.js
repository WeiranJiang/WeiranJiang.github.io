/**
 * Stock pitches. Static, same as the rest of the site — no backend.
 *
 * While `pitches` in content/content.js is empty, the page shows the short note
 * and nothing else. Add an entry there and the note is replaced by the list;
 * nothing here needs changing.
 */

import * as content from "../content/content.js";
import { el, renderNav } from "./render.js";
import { attachTimelines } from "./timeline.js";
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

const page = content.pitchesPage || {};
const pitches = content.pitches || [];

function backLink() {
  return el("p", { class: "label item__back" }, [
    el("a", { href: "index.html" }, [
      el("span", { text: "← ", "aria-hidden": "true" }),
      "Home",
    ]),
  ]);
}

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

function body() {
  if (!pitches.length) {
    /* Deliberately just the note. No previews, no placeholders, no countdown. */
    return el("p", { class: "status-note", text: page.note || "Offline for now." });
  }
  return el("div", { class: "entries" }, pitches.map(pitchRow));
}

const main = document.getElementById("main");
main.replaceChildren(
  el("div", { class: "wrap item-head" }, [
    backLink(),
    el("div", { class: "item__headmain" }, [
      el("h1", { class: "item__title", text: page.heading || "Stock pitches" }),
    ]),
  ]),
  el("div", { class: "wrap item-body" }, [
    el("div", { class: "item__rail" }),
    el("div", { class: "item__main" }, [body()]),
  ])
);

document.title = `${page.heading || "Stock pitches"} — ${data.site.name}`;

const brand = document.querySelector(".brand");
if (brand) brand.textContent = data.site.brand || data.site.name;

const footerNote = document.getElementById("footer-note");
if (footerNote) footerNote.textContent = `${data.site.name} · ${new Date().getFullYear()}`;

renderNav(document.getElementById("site-nav"), data.sections, { absolute: true });
attachTimelines(".entries");
mountAssistant(document.getElementById("assistant-root"), data);
