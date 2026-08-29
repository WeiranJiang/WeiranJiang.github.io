/** Entry point. Wires the content data to the renderer and mounts the assistant. */

import * as content from "../content/content.js";
import { renderIntro, renderSections, renderNav, trackNav } from "./render.js";
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

document.title = data.site.name;
const brand = document.querySelector(".brand");
if (brand) brand.textContent = data.site.brand || data.site.name;

const footerNote = document.getElementById("footer-note");
if (footerNote) footerNote.textContent = `${data.site.name} · ${new Date().getFullYear()}`;

renderIntro(document.getElementById("intro"), data);

const published = renderSections(document.getElementById("sections"), data);
const nav = document.getElementById("site-nav");
/* The nav carries the published sections plus any page links (Archive). */
const publishedIds = new Set(published.map((spec) => spec.id));
const navSpecs = data.sections.filter((spec) => spec.href || publishedIds.has(spec.id));

renderNav(nav, navSpecs);
trackNav(nav, published);

/* One reading line per entry list — Experience, At Penn, Selected work. */
attachTimelines(".entries");

mountAssistant(document.getElementById("assistant-root"), data);
