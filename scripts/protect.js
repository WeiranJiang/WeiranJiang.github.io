/**
 * Makes the page awkward to copy from.
 *
 * What this actually does: turns off text selection, swallows copy and cut,
 * takes away the right-click menu, stops pictures being dragged onto the
 * desktop, and blanks the page when printed. Switch it off in scripts/config.js
 * with `protectContent: false`.
 *
 * What it does not do, and cannot:
 *
 *   - Stop a screenshot. There is no browser API for it. Cmd-Shift-4, the
 *     Windows snipping tool, and a phone camera all go straight past anything
 *     any website can do, and always will.
 *   - Stop anyone determined. View Source shows every word, and so does
 *     turning JavaScript off, since all of this is JavaScript. The site is
 *     pre-rendered for search engines, which means the text is right there in
 *     the file — that is the point of it.
 *
 * So: it stops the idle drag-select-copy, and nothing sterner. That is worth
 * having, as long as nobody mistakes it for a lock.
 *
 * `data-copyable` opts an element and its children back out — it's on the
 * contact list and the footer, because an email address nobody can copy is a
 * contact detail that doesn't work. Put it on anything else you want left
 * alone. Typing into the assistant is never affected.
 */

/* Places the reader is allowed to select, copy, and right-click as normal. */
const EXEMPT = [
  "[data-copyable]",
  "input",
  "textarea",
  "select",
  "[contenteditable]",
  "[contenteditable=true]",
].join(",");

function exempt(target) {
  return !!(target && target.closest && target.closest(EXEMPT));
}

/** True while the reader's selection sits entirely inside an exempt element. */
function selectionIsExempt() {
  const selection = window.getSelection && window.getSelection();
  if (!selection || selection.rangeCount === 0) return false;
  const node = selection.getRangeAt(0).commonAncestorContainer;
  return exempt(node.nodeType === 1 ? node : node.parentElement);
}

export function protectPage() {
  const config = window.ALICE_CONFIG || {};
  if (config.protectContent === false) return;

  /* The class carries the CSS half — user-select, and the print rules. Setting
     it from JavaScript rather than in the HTML means a reader with JavaScript
     off gets an ordinary, selectable page instead of one they can't use. */
  document.documentElement.classList.add("protected");

  /* Contact details stay copyable wherever they appear. */
  document
    .querySelectorAll(".contact-list, .site-footer, .intro__links a[href^='mailto:']")
    .forEach((node) => node.setAttribute("data-copyable", ""));

  const stop = (event) => {
    if (!exempt(event.target)) event.preventDefault();
  };

  document.addEventListener("contextmenu", stop);
  document.addEventListener("dragstart", stop);

  for (const type of ["copy", "cut"]) {
    document.addEventListener(type, (event) => {
      if (!exempt(event.target) && !selectionIsExempt()) event.preventDefault();
    });
  }

  /* Save-page and print, from the keyboard. The print stylesheet catches the
     menu route as well, so this is only about the shortcut. */
  document.addEventListener("keydown", (event) => {
    if (!(event.metaKey || event.ctrlKey)) return;
    if (["s", "p"].includes(event.key.toLowerCase())) event.preventDefault();
  });
}
