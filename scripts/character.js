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
  /* Hair reads off a CSS variable so it can lift away from a dark background;
     the fallback is what it looks like on white. See --pa-hair in styles.css. */
  H: "var(--pa-hair, #17161c)",
  S: "#f2d6c0", // skin
  E: "#17161c", // eye
  M: "#c07f76", // mouth
  B: "#f0b7a8", // blush
  P: "#6d4aa8", // shirt
};

/* 16 wide x 15 tall. "." is transparent; every other character is a key in
   PALETTE. Kept deliberately plain — one line of hair over the face, plain
   shirt, bare feet. Detail at this size just reads as noise. */
const PIXELS = [
  "..HHHHHHHHHHHH..",
  "..HHSSSSSSSSHH..",
  "..HHSSSSSSSSHH..",
  "..HHSSSSSSSSHH..",
  "..HHSSSSSSSSHH..",
  "..HHBSSMMSSBHH..",
  "..HHSSSSSSSSHH..",
  "..HHHHSSSSHHHH..",
  ".HHHPPPPPPPPHHH.",
  ".HHHPPPPPPPPHHH.",
  ".HHHPPPPPPPPHHH.",
  "..HHPPPPPPPPHH..",
  "....PPPPPPPP....",
  "................",
  "................",
];

/* Eyes are drawn separately so they can look around and blink. */
const EYES = [
  { x: 5, y: 3, w: 2, h: 2 },
  { x: 9, y: 3, w: 2, h: 2 },
];

/* Legs are drawn separately too, in two frames: together, then mid-stride.
   Alternating them is the whole walk cycle. */
const LEGS = [
  [
    { x: 5, y: 13, w: 2, h: 2 },
    { x: 9, y: 13, w: 2, h: 2 },
  ],
  [
    { x: 4, y: 13, w: 2, h: 2 },
    { x: 10, y: 13, w: 2, h: 2 },
  ],
];

/* The waving arm, in the same grid. Only shown while waving — the rest of the
   time her arms stay at her sides. */
const ARM = [
  { x: 15, y: 10, w: 1, h: 1, key: "P" },
  { x: 15, y: 9, w: 1, h: 1, key: "P" },
  { x: 15, y: 8, w: 1, h: 1, key: "S" },
];

/* x, y, size, height of the drawing area including the thinking dots. */
const VIEWBOX = { x: 0, y: -3, w: 16, h: 18 };

const STYLE_ID = "pixel-alice-style";

const CSS = `
.pixel-alice {
  display: block;
  flex: none;
  image-rendering: pixelated;
  overflow: visible;
}
/* Two animations, on two elements, so they don't fight over one transform: the
   pair slides left and right, each eye squashes on its own to blink. */
.pixel-alice__eye {
  transform-box: fill-box;
  transform-origin: center;
}
.pixel-alice[data-state="idle"] .pixel-alice__eye,
.pixel-alice[data-state="wave"] .pixel-alice__eye {
  animation: pixel-alice-blink 5.6s infinite;
}
.pixel-alice[data-state="idle"] .pixel-alice__eyes,
.pixel-alice[data-state="wave"] .pixel-alice__eyes {
  /* steps() keeps her looking around a pixel at a time rather than gliding. */
  animation: pixel-alice-look 7.4s steps(1, end) infinite;
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
  0%, 88%, 100% { transform: scaleY(1); }
  93%, 96%      { transform: scaleY(0.22); }
}
@keyframes pixel-alice-look {
  0%, 34%   { transform: translateX(0); }
  36%, 50%  { transform: translateX(1px); }
  52%, 66%  { transform: translateX(0); }
  68%, 82%  { transform: translateX(-1px); }
  84%, 100% { transform: translateX(0); }
}
@keyframes pixel-alice-wave {
  0%, 100% { transform: rotate(-6deg); }
  50%      { transform: rotate(-32deg); }
}
@keyframes pixel-alice-dot {
  0%, 100% { opacity: 0.25; }
  40%      { opacity: 1; }
}

/* Legs: frame 1 is showing unless she's walking, when the two alternate. */
.pixel-alice__legs--b { opacity: 0; }
.pixel-alice[data-walking="true"] .pixel-alice__legs--a { animation: pixel-alice-step-a 0.62s steps(1, end) infinite; }
.pixel-alice[data-walking="true"] .pixel-alice__legs--b { animation: pixel-alice-step-b 0.62s steps(1, end) infinite; }

@keyframes pixel-alice-step-a { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
@keyframes pixel-alice-step-b { 0%, 49% { opacity: 0; } 50%, 100% { opacity: 1; } }

/* --- the strolling avatar --- */

.pixel-walk {
  display: block;
  width: 100%;
  padding: 0;
  background: none;
  border: 0;
  border-bottom: 1px solid var(--line, #e6e6e6);
  cursor: pointer;
  overflow: hidden;
}

.pixel-walk__runner {
  display: block;
  width: max-content;
  transform-origin: center bottom;
  animation: pixel-alice-stroll 26s linear infinite;
}

/* Stop her wandering off while someone is trying to click her. */
.pixel-walk:hover .pixel-walk__runner,
.pixel-walk:focus-visible .pixel-walk__runner {
  animation-play-state: paused;
}

.pixel-walk:hover .pixel-alice,
.pixel-walk:focus-visible .pixel-alice {
  --walk-state: paused;
}

@keyframes pixel-alice-stroll {
  0%   { transform: translateX(0) scaleX(1); }
  44%  { transform: translateX(var(--walk-span, 120px)) scaleX(1); }
  48%  { transform: translateX(var(--walk-span, 120px)) scaleX(1); }
  50%  { transform: translateX(var(--walk-span, 120px)) scaleX(-1); }
  94%  { transform: translateX(0) scaleX(-1); }
  98%  { transform: translateX(0) scaleX(-1); }
  100% { transform: translateX(0) scaleX(1); }
}

@media (prefers-reduced-motion: reduce) {
  .pixel-alice * { animation: none !important; }
  .pixel-alice__dots { opacity: 1; }
  .pixel-alice__legs--b { opacity: 0 !important; }
  .pixel-walk__runner { animation: none !important; transform: none !important; }
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
  svg.setAttribute("viewBox", `${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`);
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(Math.round((size * VIEWBOX.h) / VIEWBOX.w)));
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

  /* Legs, two frames stacked — the walk cycle swaps which one is visible */
  LEGS.forEach((frame, index) => {
    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("class", `pixel-alice__legs pixel-alice__legs--${index === 0 ? "a" : "b"}`);
    frame.forEach((leg) => group.append(rect(leg.x, leg.y, leg.w, leg.h, PALETTE.S)));
    svg.append(group);
  });

  /* Eyes, grouped so they can look around together */
  const eyes = document.createElementNS(SVG_NS, "g");
  eyes.setAttribute("class", "pixel-alice__eyes");
  EYES.forEach((eye) => {
    eyes.append(rect(eye.x, eye.y, eye.w, eye.h, PALETTE.E, "pixel-alice__eye"));
  });
  svg.append(eyes);

  /* Thinking dots, floating just above her head */
  const dots = document.createElementNS(SVG_NS, "g");
  dots.setAttribute("class", "pixel-alice__dots");
  [4, 7, 10].forEach((x) => {
    dots.append(rect(x, -2.7, 1.3, 1.3, PALETTE.P, "pixel-alice__dot"));
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

  function setWalking(on) {
    svg.setAttribute("data-walking", on ? "true" : "false");
  }

  return { node: svg, setState, setWalking, state: () => current };
}

/**
 * The strolling version, for the sidebar. She paces the width of whatever
 * you put her in, turns around at each end, and pauses when you point at her
 * so she can be clicked.
 *
 * The button carries data-ask-alice, which is the only thing the assistant
 * listens for — the artwork here knows nothing about the chat.
 *
 * @returns {{node: HTMLElement, character: object, destroy: () => void}}
 */
export function createWalker(options = {}) {
  const size = options.size || 30;
  const character = createCharacter({ size, label: "" });
  character.setWalking(true);

  const runner = document.createElement("span");
  runner.className = "pixel-walk__runner";
  runner.append(character.node);

  const stage = document.createElement("button");
  stage.type = "button";
  stage.className = "pixel-walk";
  stage.setAttribute("data-ask-alice", "");
  stage.setAttribute("aria-label", options.label || "Ask about Alice — opens the assistant");
  stage.title = options.label || "Ask about Alice";
  stage.append(runner);

  /* How far she can pace: the stage, less her own width. Measured rather than
     guessed so the sidebar can be any width. */
  function measure() {
    const span = Math.max(0, stage.clientWidth - character.node.getBoundingClientRect().width);
    stage.style.setProperty("--walk-span", `${Math.round(span)}px`);
  }

  let observer = null;
  if ("ResizeObserver" in window) {
    observer = new ResizeObserver(measure);
    observer.observe(stage);
  } else {
    window.addEventListener("resize", measure);
  }
  measure();

  return {
    node: stage,
    character,
    destroy() {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      stage.remove();
    },
  };
}
