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
few published passages. The Worker allows the model to use nothing but those
passages. The prompt also tells it to say when it doesn't have something, forbids
it from speaking as Alice, and lists the passage titles it used so the site can
turn them into links to the relevant section.

Keep anything private out of `content/content.js` and out of this repository.
The Worker has no private knowledge file and should not be used as a place to
store personal notes or credentials.
git repository, so no contact details beyond what's already on the site, no
credentials, no address, nothing about anyone else, and nothing you would not
want said out loud to a recruiter.

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

## When the quota runs out

The free tier is small, and a long testing session will empty it. When that
happens the visitor sees one of two messages, and the difference matters:

- **"The assistant is busy right now — try again shortly."** A short-term limit.
  It really does clear in seconds.
- **"The LLM's daily chat limit has been reached. It'll be back tomorrow!"** The
  day's allowance is gone. The panel drops its "try again in a moment" advice in
  this case and points at the page instead.

Telling the two apart is harder than it should be, because the readable part of
Google's 429 is actively misleading. It says:

    Quota exceeded for metric:
    generativelanguage.googleapis.com/generate_content_free_tier_requests,
    limit: 20 ... Please retry in 17.4s

which reads like twenty requests a minute. It isn't. The structured
`QuotaFailure` alongside it names the real quota —
`GenerateRequestsPerDayPerProjectPerModel-FreeTier` — so **the free tier is
twenty requests per day**, and that "retry in 17s" is worthless. Confirmed
against the live API on 29 Aug 2026.

So the Worker reads the `quotaId` first: "PerDay" in it is conclusive. Failing
that, it falls back to how long upstream has been refusing without a single
success — ten unbroken minutes is taken as the day being spent. That fallback is
in-memory per isolate, so a fresh isolate starts from zero; the only cost of
getting it wrong is showing the milder message.

Twenty a day is not much. A handful of curious visitors will exhaust it.

Every 429 logs `Gemini quota daily|short-term quotaId=… sustained=…` to
`wrangler tail`, which is the fastest way to see which limit you actually hit.

If you hit the ceiling often, enable billing on the key's project in
[AI Studio](https://aistudio.google.com/apikey) — the paid tier's limits are far
higher and Flash is cheap at this volume.

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
Google's Gemini API to write the answer.

The panel's footer says the assistant answers only from the page and can be
wrong. It no longer names Gemini — worth knowing if you ever want visitors told
where their questions go before they type.
