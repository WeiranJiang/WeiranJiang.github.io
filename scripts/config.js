/**
 * Site configuration. Plain script (not a module) so it can be edited without a
 * build step and read by everything else on the page.
 *
 * assistantEndpoint — URL of the Cloudflare Worker that talks to the Gemini API.
 *   The API key lives in the Worker, never here. See worker/README.md.
 *   Leave it empty and the assistant runs in local mode: it answers from the
 *   page's own content with source links, and says plainly that it is doing so.
 *
 * protectContent — makes the page awkward to copy: no selecting, no right-click
 *   menu, no dragging pictures off, and printing gives a blank sheet. Contact
 *   details and anything you can type in are left alone, so a recruiter can
 *   still take your email. Set it to false to turn all of that off.
 *
 *   Be clear-eyed about what it is: a speed bump, not a lock. Anyone can read
 *   View Source, and no website can stop a screenshot. See scripts/protect.js.
 */
window.ALICE_CONFIG = {
  assistantEndpoint: "https://ask-about-alice.w-ajiang-a.workers.dev",
  assistantEnabled: true,
  protectContent: true,
};
