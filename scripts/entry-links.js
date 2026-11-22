export function slug(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Stable id for an entry — its own `id` if set, otherwise from its name. */
export function entryId(item) {
  return item.id || slug(item.org || item.name);
}

/**
 * Every entry has its own page, built ahead of time at `<its id>.html`.
 *
 * It used to be `item.html?id=<id>`, which no static host can pre-render — one
 * file can't be two pages. `item.html` still answers that old shape and
 * forwards, so links people saved keep working.
 */
export function entryHref(item) {
  return `${entryId(item)}.html`;
}
