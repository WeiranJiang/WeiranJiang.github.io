/**
 * Site configuration. Plain script (not a module) so it can be edited without a
 * build step and read by everything else on the page.
 *
 * assistantEndpoint — URL of the Cloudflare Worker that talks to the Claude API.
 *   The API key lives in the Worker, never here. See worker/README.md.
 *   Leave it empty and the assistant runs in local mode: it answers from the
 *   page's own content with source links, and says plainly that it is doing so.
 */
window.ALICE_CONFIG = {
  assistantEndpoint: "",
  assistantEnabled: true,
};
