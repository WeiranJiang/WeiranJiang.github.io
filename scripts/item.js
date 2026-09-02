/**
 * An entry's own page.
 *
 * Every entry is built ahead of time as `<its id>.html`, and this re-renders it
 * live so the page has its assistant and its links behave. It reads the same
 * content/content.js the build did, so a new entry gets a working page the
 * moment it's added — no new file, no new markup.
 *
 * It also answers the old `item.html?id=<id>` shape and forwards to the built
 * page, so links anyone saved before still land in the right place.
 */

import { data, findEntry, renderEntryPage, renderMissingPage } from "./views.js";
import { entryHref } from "./render.js";
import { mountAssistant } from "./assistant.js";
import { protectPage } from "./protect.js";

/* `item.html?id=x` on the old scheme; `/x.html` on the built pages. */
const onItemHtml = /\/item\.html$/.test(location.pathname);
const id = onItemHtml
  ? (new URLSearchParams(location.search).get("id") || "").trim()
  : decodeURIComponent(location.pathname.split("/").pop() || "").replace(/\.html$/, "");

const match = findEntry(id);
const main = document.getElementById("main");

/* An old link that still names something real goes to where it now lives.
   `replace` rather than `assign` so Back doesn't bounce off this page. */
if (onItemHtml && match) {
  location.replace(entryHref(match.item));
} else {
  if (match) renderEntryPage(main, match);
  else renderMissingPage(main);

  mountAssistant(document.getElementById("assistant-root"), data);
  protectPage();
}
