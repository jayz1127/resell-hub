# Going live — exact steps

Everything below is free. Do these in order.

## 1. Database — Supabase (free)

1. Create an account at supabase.com, create a new project.
2. Settings → Database → copy the connection string. That's your
   `DATABASE_URL`.
3. Locally: `npm install`, put `DATABASE_URL` in `.env`, run
   `npx prisma migrate dev --name init`. This creates every table.

## 2. Hosting — Vercel (free)

1. Push this repo to GitHub.
2. Import it at vercel.com (free Hobby plan is enough).
3. Add `DATABASE_URL` as a Vercel environment variable.
4. Deploy. This gives you the web app at a URL you can open from your
   phone.

## 3. Gmail access (free, already partly done)

1. In Google Cloud Console, create a project, enable the Gmail API.
2. Create OAuth 2.0 credentials (type: Desktop app) → gives you
   `GMAIL_CLIENT_ID` / `GMAIL_CLIENT_SECRET`.
3. Run the OAuth consent flow once (any of the many "get a Gmail
   refresh token" walkthroughs works, or ask me to walk you through it
   interactively) to get a `GMAIL_REFRESH_TOKEN`. This only needs to
   happen once — the refresh token doesn't expire under normal use.

## 4. eBay developer account (free)

1. Sign up at developer.ebay.com with your eBay seller account.
2. Create a Production keyset → `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET`.
3. Complete eBay's one-time OAuth user consent flow for the
   `sell.inventory` scope to get `EBAY_REFRESH_TOKEN`.
4. When you first cross-list an item to eBay, save the `offerId` eBay
   gives you into that item's Listing row (`externalId`) — that's how
   the auto-delist knows what to withdraw.

## 5. Push alerts — no signup at all

1. Pick a hard-to-guess topic name, like `joshresell-8f2a1c`. That's your
   `NTFY_TOPIC` — no account needed anywhere.
2. Open `https://ntfy.sh/joshresell-8f2a1c` (with your real topic name)
   in your phone's browser and tap "Subscribe," or install the free ntfy
   app and subscribe there. That's it — that's the whole setup for
   alerts.

## 6. GitHub Actions secrets

Repo → Settings → Secrets and variables → Actions, add every value from
`.env.example` that you now have. The two workflows
(`.github/workflows/sale-watcher.yml` and `daily-jobs.yml`) pick them
up automatically. `sale-watcher.yml` needs a public repo to run for
free with no minute limits (secrets stay encrypted regardless of the
repo being public).

## 7. The part that's still unfinished on purpose

The Poshmark, Mercari, Vinted, and Depop automation files in
`workers/delist-*/` are real, working Playwright scaffolding, but the
actual "click delist" steps are stubbed with TODOs. That's not
laziness — those selectors need to be built and tested against your
actual logged-in accounts, which means I need either direct access to
try it live or real HTML from those pages once you're logged in. This
is also the moment to decide, platform by platform, whether the ToS
risk described in ARCHITECTURE.md is one you want to carry for that
platform, or whether you'd rather leave it on "push alert, you
tap delist" for that one specifically. Tell me which platforms you
want to push forward on and I'll build out the real automation for
those next.

## 8. Item name matching in the Gmail watcher

`workers/gmail-watcher/index.ts` currently guesses the sold item's name
from the email subject line with a rough regex. Once this is live and
you get a couple of real sale emails, send me the subject lines (redact
buyer info) so I can replace the guess with a real, reliable parser per
platform.
