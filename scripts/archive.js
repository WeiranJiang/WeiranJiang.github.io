/**
 * The archive — everything from before Penn, on its own page.
 *
 * Linked from the nav but not part of the homepage. Entries here are shown in
 * full where they sit; there are no separate pages behind them.
 */

import * as content from "../content/content.js";
import {
  el,
  renderNav,
  renderDetailedEntries,
  renderPlainList,
  renderGroups,
  renderPressList,
} from "./render.js";
import { attachTimelines } from "./timeline.js";
import { mountAssistant } from "./assistant.js";

const data = {
  site: content.site,
  intro: content.intro,
  experience: content.experience,
  atPenn: content.atPenn,
  work: content.work,
  about: content.about,
  press: content.press,
  sections: content.sections,
  education: content.education,
  highSchool: content.highSchool,
  alsoDid: content.alsoDid,
  summerPrograms: content.summerPrograms,
  awards: content.awards,
};

const page = content.archivePage || {};

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

const main = document.getElementById("main");

main.replaceChildren(
  el("div", { class: "wrap item-head" }, [
    el("p", { class: "label item__back" }, [
      el("a", { href: "index.html" }, [
        el("span", { text: "← ", "aria-hidden": "true" }),
        "Home",
      ]),
    ]),
    el("div", { class: "item__headmain" }, [
      el("h1", { class: "item__title", text: page.heading || "Archive" }),
      page.intro ? el("p", { class: "item__lede archive-intro", text: page.intro }) : null,
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

document.title = `${page.heading || "Archive"} — ${data.site.name}`;

const brand = document.querySelector(".brand");
if (brand) brand.textContent = data.site.brand || data.site.name;

const footerNote = document.getElementById("footer-note");
if (footerNote) footerNote.textContent = `${data.site.name} · ${new Date().getFullYear()}`;

renderNav(document.getElementById("site-nav"), data.sections, { absolute: true });
attachTimelines(".entries");
mountAssistant(document.getElementById("assistant-root"), data);
