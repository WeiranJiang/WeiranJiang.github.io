/** Entry point. Wires the content data to the renderer and mounts the assistant. */

import * as content from "../content/content.js";
import { renderIntro, renderSections, renderNav, trackNav } from "./render.js";
import { mountAssistant } from "./assistant.js";

const data = {
  site: content.site,
  intro: content.intro,
  experience: content.experience,
  atPenn: content.atPenn,
  work: content.work,
  archive: content.archive,
  about: content.about,
  sections: content.sections,
};

document.title = data.site.name;
const brand = document.querySelector(".brand");
if (brand) brand.textContent = data.site.name;

const footerNote = document.getElementById("footer-note");
if (footerNote) footerNote.textContent = `${data.site.name} · ${new Date().getFullYear()}`;

renderIntro(document.getElementById("intro"), data);

const published = renderSections(document.getElementById("sections"), data);
const nav = document.getElementById("site-nav");
renderNav(nav, published);
trackNav(nav, published);

mountAssistant(document.getElementById("assistant-root"), data);
