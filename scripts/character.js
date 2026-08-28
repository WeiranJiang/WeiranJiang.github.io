/**
 * "Pixel Alice" — the assistant's character.
 *
 * Self-contained on purpose: the artwork, its palette, and its animations all
 * live here, and the only thing the assistant asks of it is
 *
 *     const alice = createCharacter({ size: 34 });
 *     document.body.append(alice.node);
 *     alice.setState("thinking" | "idle" | "wave");
 *
 * Redraw her however you like — change PIXELS or PALETTE — and the chat panel
 * keeps working untouched.
 *
 * States
 *   idle      blinks every few seconds
 *   wave      one small wave, then back to idle
 *   thinking  three dots pulse above her while an answer is being written
 *
 * With prefers-reduced-motion, nothing moves: eyes stay open, the arm stays
 * down, and the thinking dots are shown as a static row.
 */

const PALETTE = {
  H: "#17161c", // hair
  h: "#302c3a", // hair highlight
  S: "#f2d6c0", // skin
  E: "#17161c", // eye
  M: "#c08a80", // mouth
  P: "#6d4aa8", // purple shirt
  p: "#553a86", // purple shirt, shadow
  W: "#ffffff", // white placket detail
};

/* 16 x 16. "." is transparent; every other character is a key in PALETTE. */
const PIXELS = [
  "....HHHHHHHH....",
  "..HHHHHHHHHHHH..",
  ".HHHHHHHHHHHHHH.",
  ".HHhhHHHHHHHHHH.",
  ".HHHSSSSSSSSHHH.",
  ".HHHSSSSSSSSHHH.",
  ".HHHSESSSSESHHH.",
  ".HHHSSSSSSSSHHH.",
  ".HHHSSSMMSSSHHH.",
  ".HHHSSSSSSSSHHH.",
  ".HHHHSSSSSSHHHH.",
  ".HHHHHSSSSHHHHH.",
  ".HHHHPPWWPPHHHH.",
  ".HHHPPPWWPPPHHH.",
  ".HHPPPPWWPPPPHH.",
  "..pPPPPPPPPPPp..",
];

/* Eyes are drawn separately so they can blink. [column, row] */
const EYES = [
  [5, 6],
  [10, 6],
];

/* The waving arm, in the same 16-unit grid. Only shown while waving — the rest
   of the time she's a tidy bust. */
const ARM = [
  { x: 15, y: 13, w: 1, h: 1, key: "P" },
  { x: 15, y: 12, w: 1, h: 1, key: "P" },
  { x: 15, y: 11, w: 1, h: 1, key: "S" },
];

const STYLE_ID = "pixel-alice-style";

const CSS = `
.pixel-alice {
  display: block;
  flex: none;
  image-rendering: pixelated;
  overflow: visible;
}
.pixel-alice__eye {
  transform-box: fill-box;
  transform-origin: center;
}
.pixel-alice[data-state="idle"] .pixel-alice__eye,
.pixel-alice[data-state="wave"] .pixel-alice__eye {
  animation: pixel-alice-blink 5.6s infinite;
}
.pixel-alice__arm {
  transform-box: fill-box;
  transform-origin: 0% 100%;
  opacity: 0;
}
.pixel-alice[data-state="wave"] .pixel-alice__arm {
  opacity: 1;
  animation: pixel-alice-wave 0.42s ease-in-out 3;
}
.pixel-alice__dots { opacity: 0; }
.pixel-alice[data-state="thinking"] .pixel-alice__dots { opacity: 1; }
.pixel-alice[data-state="thinking"] .pixel-alice__dot {
  animation: pixel-alice-dot 1.05s infinite;
}
.pixel-alice[data-state="thinking"] .pixel-alice__dot:nth-child(2) { animation-delay: 0.16s; }
.pixel-alice[data-state="thinking"] .pixel-alice__dot:nth-child(3) { animation-delay: 0.32s; }

@keyframes pixel-alice-blink {
  0%, 92%, 100% { transform: scaleY(1); }
  95%, 97%      { transform: scaleY(0.12); }
}
@keyframes pixel-alice-wave {
  0%, 100% { transform: rotate(-6deg); }
  50%      { transform: rotate(-32deg); }
}
@keyframes pixel-alice-dot {
  0%, 100% { opacity: 0.25; }
  40%      { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .pixel-alice * { animation: none !important; }
  .pixel-alice__dots { opacity: 1; }
}
`;

function injectStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.append(style);
}

const SVG_NS = "http://www.w3.org/2000/svg";

function rect(x, y, w, h, fill, className) {
  const node = document.createElementNS(SVG_NS, "rect");
  node.setAttribute("x", x);
  node.setAttribute("y", y);
  node.setAttribute("width", w);
  node.setAttribute("height", h);
  node.setAttribute("fill", fill);
  /* Hairline overlap keeps sub-pixel seams from showing between blocks. */
  node.setAttribute("shape-rendering", "crispEdges");
  if (className) node.setAttribute("class", className);
  return node;
}

/**
 * @param {{size?: number, label?: string}} options
 * @returns {{node: SVGSVGElement, setState: (state: string) => void, state: () => string}}
 */
export function createCharacter(options = {}) {
  injectStyle();

  const size = options.size || 32;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "pixel-alice");
  svg.setAttribute("viewBox", "0 -4 16 16");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size * 1.25));
  svg.setAttribute("data-state", "idle");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", options.label || "Pixel drawing of Alice");

  /* Body — one run of same-coloured pixels per rect, so the SVG stays small. */
  const body = document.createElementNS(SVG_NS, "g");
  PIXELS.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const key = row[x];
      let run = 1;
      while (row[x + run] === key) run += 1;
      if (key !== "." && key !== "E" && PALETTE[key]) {
        body.append(rect(x, y, run, 1, PALETTE[key]));
      }
      x += run;
    }
  });
  svg.append(body);

  /* Arm (behind nothing, drawn after the body so it reads on top) */
  const arm = document.createElementNS(SVG_NS, "g");
  arm.setAttribute("class", "pixel-alice__arm");
  ARM.forEach((part) => arm.append(rect(part.x, part.y, part.w, part.h, PALETTE[part.key])));
  svg.append(arm);

  /* Eyes */
  EYES.forEach(([x, y]) => {
    svg.append(rect(x, y, 1, 1, PALETTE.E, "pixel-alice__eye"));
  });

  /* Thinking dots, floating just above her head */
  const dots = document.createElementNS(SVG_NS, "g");
  dots.setAttribute("class", "pixel-alice__dots");
  [4, 7, 10].forEach((x) => {
    const dot = rect(x, -3, 1.4, 1.4, PALETTE.P, "pixel-alice__dot");
    dots.append(dot);
  });
  svg.append(dots);

  let current = "idle";
  let waveTimer = null;

  function setState(next) {
    if (next === current) return;
    if (waveTimer) {
      clearTimeout(waveTimer);
      waveTimer = null;
    }
    current = next;
    svg.setAttribute("data-state", next);
    if (next === "wave") {
      waveTimer = setTimeout(() => {
        if (current === "wave") {
          current = "idle";
          svg.setAttribute("data-state", "idle");
        }
      }, 1350);
    }
  }

  return { node: svg, setState, state: () => current };
}
