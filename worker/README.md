# Ask about Alice — backend

The site works without this. With no backend the assistant still answers, but by
quoting the page instead of writing prose, and it tells the visitor so.

Deploying this Worker turns on the written answers. It exists so the Anthropic
API key stays on a server: the browser only ever talks to the Worker.

## Deploy

```bash
cd worker
npm install
npx wrangler secret put ANTHROPIC_API_KEY   # paste the key when prompted
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
| `ANTHROPIC_API_KEY` | secret | Required. Set with `wrangler secret put`, never in `wrangler.toml`. |
| `ALLOWED_ORIGINS` | var | Comma-separated origins allowed to call the Worker. Requests from anywhere else get a 403. Add `http://localhost:8000` while developing. |
| `MODEL` | var | Optional. Defaults to `claude-opus-5`. |

## How answers stay grounded

The browser builds a knowledge base from `content/content.js` — the same data
that renders the page — matches the question against it, and sends only the best
few passages. The Worker's system prompt allows Claude to use nothing else, tells
it to say when the site doesn't cover something, and forbids it from speaking as
Alice. Claude lists the passage titles it used, and the site turns those into
links to the relevant section.

That means the assistant can only ever repeat published content. Anything you
don't want it to say, don't put in `content/content.js`.

## Cost and abuse

The endpoint is public, so it is bounded on several axes:

- an `ALLOWED_ORIGINS` check,
- 12 requests per minute per IP (in-memory per isolate — enough for casual abuse,
  not exact; move to a Durable Object or KV if you ever need it to be),
- a 24 KB request cap, 500-character questions, at most 8 passages of 4 KB,
- 700 output tokens per answer, and `effort: "low"`,
- the system prompt is cached, so repeat questions pay a fraction for it.

One caveat worth knowing: because passages are sent by the browser, someone could
craft their own request with their own passages and use the Worker as a small,
heavily-restricted Claude proxy. The origin check and rate limit are what stand in
the way. If that ever matters, move `buildKnowledge()` into the Worker and have it
ignore client-supplied passages entirely.

## Privacy

The Worker stores nothing: no database, no logs of question text (only error
diagnostics go to `wrangler tail`). Questions and the matched passages are sent to
the Anthropic API to write the answer. That's stated in the panel's footer, where
visitors can see it before they type.
