/**
 * Stock pitches. Static, same as the rest of the site — no backend.
 *
 * While `pitches` in content/content.js is empty, the page shows the short note
 * and nothing else. Add an entry there and the note is replaced by the list;
 * nothing here needs changing.
 */

import { data, renderPitchesPage } from "./views.js";
import { attachTimelines } from "./timeline.js";
import { mountAssistant } from "./assistant.js";
import { protectPage } from "./protect.js";

renderPitchesPage(document.getElementById("main"));

attachTimelines(".entries");
mountAssistant(document.getElementById("assistant-root"), data);
protectPage();
