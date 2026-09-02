/**
 * The archive — everything from before Penn, on its own page.
 *
 * Linked from the nav but not part of the homepage. Entries here are shown in
 * full where they sit; there are no separate pages behind them. The page itself
 * is built ahead of time; this re-renders it live and adds the moving parts.
 */

import { data, renderArchivePage } from "./views.js";
import { attachTimelines } from "./timeline.js";
import { mountAssistant } from "./assistant.js";
import { protectPage } from "./protect.js";

renderArchivePage(document.getElementById("main"));

attachTimelines(".entries");
mountAssistant(document.getElementById("assistant-root"), data);
protectPage();
