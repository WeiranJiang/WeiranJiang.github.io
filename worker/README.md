# Ask about Alice — backend

The site works without this. With no backend the assistant still answers, but by
quoting the page instead of writing prose, and it tells the visitor so.

Deploying this Worker turns on the written answers. It exists so the Gemini API
key stays on a server: the browser only ever talks to the Worker.

## Deploy

```bash
cd worker
npm install
npx wrangler secret put GEMINI_API_KEY   # paste the key when prompted
npx wrangler deploy
```

Wrangler prints a URL like `https://ask-about-alice.<subdomain>.workers.dev`.
Put it in `scripts/config.js`:

```js
window.ALICE_CONFIG = {
  assistantEndpoint: "https://ask-about-alice.<subdomain>.workers.dev",
  assistantEnabled: true,
};
```

Commit that and the assistant is live. To turn it back off, blank the endpoint —
the site falls back to local mode on its own.

## Configuration

| Name | Kind | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | secret | Required. Set with `wrangler secret put`, never in `wrangler.toml`. Get one from [Google AI Studio](https://aistudio.google.com/apikey). |
| `ALLOWED_ORIGINS` | var | Comma-separated origins allowed to call the Worker. Requests from anywhere else get a 403. Add `http://localhost:8000` while developing. |
| `MODEL` | var | Optional. Defaults to `gemini-3.6-flash`, which is the cheap one. Set it to any model your key can reach. |
| `THINKING_LEVEL` | var | Optional. `minimal`, `low`, `medium`, or `high`. Defaults to `minimal`. See "Why it answers quickly" below. |

## How answers stay grounded

The browser builds a knowledge base from `content/content.js` — the same data
that renders the page — matches the question against it, and sends only the best
few passages. The Worker's system prompt allows the model to use nothing else,
tells it to say when the site doesn't cover something, and forbids it from
speaking as Alice. It lists the passage titles it used, and the site turns those
into links to the relevant section.

That means the assistant can only ever repeat published content. Anything you
don't want it to say, don't put in `content/content.js`.

## Why it answers quickly

Gemini 3 Flash thinks before it answers, and on its default setting it spent
four to seven times as many tokens thinking as it did on the answer itself —
several seconds of the visitor watching "Looking through the page…" for two
sentences quoted off a page they are already on.

Reading a handful of short passages and quoting them back is not a reasoning
problem, so `THINKING_LEVEL` is set to `minimal`. That took the median answer
from about 5.5 seconds to about 1.2. Grounding, refusals, exact figures, and the
never-speak-as-Alice rule were all re-checked against the live API afterwards and
were unaffected. Raise it if you ever ask the assistant to do something that
genuinely needs reasoning.

## Cost and abuse

The endpoint is public, so it is bounded on several axes:

- an `ALLOWED_ORIGINS` check,
- 12 requests per minute per IP (in-memory per isolate — enough for casual abuse,
  not exact; move to a Durable Object or KV if you ever need it to be),
- a 24 KB request cap, 500-character questions, at most 8 passages of 4 KB,
- a 2,048-token ceiling per answer — a ceiling, not a target, since the system
  prompt asks for two to four sentences.

One caveat worth knowing: because passages are sent by the browser, someone could
craft their own request with their own passages and use the Worker as a small,
heavily-restricted proxy to the model. The origin check and rate limit are what
stand in the way. If that ever matters, move `buildKnowledge()` into the Worker and have it
ignore client-supplied passages entirely.

## Privacy

The Worker stores nothing: no database, no logs of question text (only error
diagnostics go to `wrangler tail`). Questions and the matched passages are sent to
Google's Gemini API to write the answer. That's stated in the panel's footer, where
visitors can see it before they type.
