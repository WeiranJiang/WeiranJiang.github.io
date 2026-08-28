/**
 * Scroll-linked reading line.
 *
 * Draws a thin gray rail down the left of a list of entries, with a black line
 * that extends from the top as the reader scrolls into the section and retracts
 * as they scroll back up. A dot sits beside each entry and turns black when the
 * line reaches it.
 *
 *     attachTimeline(document.querySelector(".entries"));
 *
 * Every section that gets one tracks its own scroll position independently.
 *
 * Nothing is measured and cached: the tip of the black line always sits at a
 * fixed reading height in the viewport, and a dot lights when its own position
 * passes that height. So adding entries, photos, or longer text needs no
 * recalculation — and an image that loads late can't leave the dots stale.
 *
 * With prefers-reduced-motion the same timeline is drawn once, fully, and never
 * moves. Without JavaScript the CSS still leaves a plain gray rail and dots.
 */

/* Where on screen the line's tip sits, as a fraction of viewport height. */
export const READING_LINE = 0.55;

/** The height in the viewport that the tip of the drawn line sits at. */
export function readingLine(viewportHeight) {
  return viewportHeight * READING_LINE;
}

/**
 * How much of a section is drawn: 0 before its top reaches the reading line,
 * 1 once its bottom has passed it. Retracting is the same function run
 * backwards, which is why scrolling up undraws it.
 */
export function progressFor(boxTop, boxHeight, anchor) {
  if (!(boxHeight > 0)) return 0;
  return Math.min(1, Math.max(0, (anchor - boxTop) / boxHeight));
}

/**
 * A dot is lit once it has risen past the reading line — the same height the
 * tip of the line sits at, so the two can never disagree.
 */
export function isLit(itemTop, dotOffset, anchor) {
  return itemTop + dotOffset <= anchor;
}

const reduceMotion =
  typeof matchMedia === "function"
    ? matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false, addEventListener() {} };

/**
 * @param {HTMLElement} root container holding the entries
 * @param {{itemSelector?: string}} [options]
 * @returns {() => void} detaches the timeline
 */
export function attachTimeline(root, options = {}) {
  const itemSelector = options.itemSelector || ".entry";
  const items = Array.from(root.querySelectorAll(itemSelector));
  if (!root || !items.length) return () => {};

  const rail = document.createElement("div");
  rail.className = "timeline";
  rail.setAttribute("aria-hidden", "true");

  const fill = document.createElement("div");
  fill.className = "timeline__fill";
  rail.append(fill);
  root.prepend(rail);
  root.classList.add("has-timeline");

  /* Distance from an entry's top to the centre of its dot. Kept in CSS so the
     dot and the line can never drift apart. */
  const dotOffset = () => {
    const raw = getComputedStyle(root).getPropertyValue("--tl-dot-top");
    const value = parseFloat(raw);
    return Number.isFinite(value) ? value : 36;
  };

  let frame = 0;
  let detached = false;

  function paint() {
    frame = 0;
    if (detached) return;

    if (reduceMotion.matches) {
      fill.style.transform = "scaleY(1)";
      items.forEach((item) => item.classList.add("is-lit"));
      return;
    }

    const box = root.getBoundingClientRect();
    if (box.height <= 0) return;

    const anchor = readingLine(window.innerHeight);
    fill.style.transform = `scaleY(${progressFor(box.top, box.height, anchor)})`;

    const offset = dotOffset();
    for (const item of items) {
      item.classList.toggle("is-lit", isLit(item.getBoundingClientRect().top, offset, anchor));
    }
  }

  function schedule() {
    if (frame || detached) return;
    frame = requestAnimationFrame(paint);
  }

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  reduceMotion.addEventListener?.("change", schedule);

  /* Late-loading images and videos change the height under us. */
  let observer = null;
  if ("ResizeObserver" in window) {
    observer = new ResizeObserver(schedule);
    observer.observe(root);
  }

  paint();

  return function detach() {
    detached = true;
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    reduceMotion.removeEventListener?.("change", schedule);
    observer?.disconnect();
    rail.remove();
    root.classList.remove("has-timeline");
    items.forEach((item) => item.classList.remove("is-lit"));
  };
}

/** Attaches one to every matching container on the page. */
export function attachTimelines(selector = ".entries", options) {
  return Array.from(document.querySelectorAll(selector)).map((node) =>
    attachTimeline(node, options)
  );
}
