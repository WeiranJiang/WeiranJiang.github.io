# Ask about Alice backend

The public assistant calls a Cloudflare Worker that uses Gemini to answer from
the site's published content. The Worker selects its own passages from
`content/content.js`. It accepts older chat requests during rollout and ignores
the passages those requests include. Conversation history helps resolve
follow-ups and is treated as visitor input.

## Deploy

From the repository root:

    cd worker
    npm ci
    npm test
    npx wrangler deploy

On first setup, use `npx wrangler secret put GEMINI_API_KEY` to store the key.
The browser configuration in
`scripts/config.js` contains the public Worker URL. The Worker bundles the
public site content at deploy time, so redeploy it when that content changes
to refresh the assistant's answers. An empty `assistantEndpoint` enables
local excerpts from the site.

| Setting | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Required Worker secret. |
| `ALLOWED_ORIGINS` | Comma-separated browser origins, set in `wrangler.toml`. |
| `ASK_RATE_LIMITER` | Required Cloudflare rate-limiting binding, set to 12 requests per minute per IP. Use a distinct namespace ID if deploying another assistant in the same account. |
| `MODEL` | Optional Gemini model override. Defaults to `gemini-3.6-flash`. |
| `THINKING_LEVEL` | Optional Gemini thinking level. Defaults to `minimal`. |

The endpoint is public. CORS limits which other sites can read responses in a
browser. Cloudflare applies the rate limit per location. The Worker limits
request size, model runtime, and response tokens, and Gemini project quotas
provide another limit on usage.

## Privacy

Questions, up to eight recent chat messages, and selected public site passages
go to Gemini. The chat discloses this before submission. The Worker stores no
conversation history, sends responses with `Cache-Control: no-store`, and logs
status codes for upstream failures. Keep private notes, credentials, and
unpublished material outside this public repository.
