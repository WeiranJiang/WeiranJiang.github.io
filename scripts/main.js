/**
 * The homepage.
 *
 * The content is already in the HTML — scripts/build/prerender.mjs put it there
 * with the same code this calls. Rendering again on load produces the identical
 * markup, but live: tabs that switch, a character that walks, an assistant that
 * answers. Someone with JavaScript off, or a crawler that never runs it, keeps
 * the built version and misses only the moving parts.
 */

import { data, renderHomePage } from "./views.js";
import { trackNav } from "./render.js";
import { attachTimelines } from "./timeline.js";
import { mountAssistant } from "./assistant.js";
import { protectPage } from "./protect.js";

const published = renderHomePage();

trackNav(document.getElementById("site-nav"), published);

/* One reading line per entry list — Experience, At Penn, Selected work. */
attachTimelines(".entries");

mountAssistant(document.getElementById("assistant-root"), data);
protectPage();
