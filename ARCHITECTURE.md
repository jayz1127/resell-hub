# Resell Hub — architecture

This replaces Flyp. It is built to run on entirely free infrastructure, fixes
the five things Flyp can't do, and is honest about the one real tradeoff
involved in getting delisting to run without your computer on.

## The five problems, and how each is solved

1. **Auto-delist without your computer/browser open.** eBay has a real,
   official, free API for individual sellers, so eBay delisting is fully
   automatic and 100% compliant with eBay's terms, no browser involved.
   Poshmark, Mercari, Vinted, and Depop do not give individual sellers an
   API that can do this (confirmed by checking each platform's current
   developer docs — Mercari states outright it has no public developer
   API, Vinted's API is allowlisted only to approved Pro businesses, Depop's
   is private/invite-only). The only way to act on those four automatically
   is browser automation that logs in and clicks delist for you. That
   automation runs for free (details below), but it works by pretending to
   be you clicking around the site, which is against those platforms'
   terms of service. That risk exists no matter who hosts it or whether
   you pay for it — it is not a cost problem, it's a "you are automating
   a human account" problem. Vendoo (Flyp's biggest funded competitor)
   doesn't even attempt this for that reason — their own docs say sale
   detection requires your computer to be on. This build attempts it
   anyway, because you asked for it, with a fallback so nothing is silently
   lost if a platform blocks the automation (see "Fallback" below).

2. **Purchase tracking.** Every item has a `costBasis`, source (`purchased`
   vs `hand_me_down`), and acquisition date, not just a sale record.

3. **Deletable sales records.** Sales support a real delete. The UI delete
   button soft-deletes (moves to a 30-day trash so a misclick is
   recoverable) and immediately excludes the record from every report;
   there's also a "delete permanently now" action if you want it gone
   for good right away.

4. **Daily price trend per item, averaged across platforms.** A
   `PriceSnapshot` row is written once a day per item per platform
   (current asking price, not sale price), so you can see whether an
   item's cross-platform average price is trending up or down over time.

5. **Real profit margin vs blended margin.** Because purchases carry a
   cost basis (or `null` for hand-me-downs), the dashboard computes two
   numbers side by side: blended margin (all sales) and real margin
   (only sales where you can prove what you paid). This is the one Flyp
   structurally cannot do, because it never tracked purchases at all.

## Stack (all free tier)

- **App**: Next.js (TypeScript), hosted on Vercel's free Hobby tier.
- **Database**: Postgres via Supabase's free tier (500MB, plenty for a
  personal resale inventory), accessed through Prisma.
- **Sale detection**: a script polls the Gmail API (already connected in
  this session) every 5 minutes for new sale-confirmation emails from
  eBay/Poshmark/Mercari/Vinted/Depop. This is the fast, 100%-legitimate
  part — it's just reading your own inbox, no ToS issue at all, and it's
  what makes detection near-instant instead of Vendoo's 10-minute poll.
- **Automation runner**: GitHub Actions cron job, free and unlimited on a
  public repo (secrets stay encrypted even in a public repo). Every run:
  checks Gmail for new sales, calls the eBay API directly for eBay-side
  delisting, and drives a headless Playwright browser for the other four
  platforms.
- **Fallback / safety net**: a free Telegram bot sends you a push
  notification the moment a sale is detected. If the automated delist on
  a given platform succeeds, you get a confirmation. If it fails (site
  layout changed, login expired, bot-detection blocked it), you get an
  alert telling you exactly which platform still needs a manual delist,
  so a broken scraper degrades to "you get notified in under a minute"
  instead of silently doing nothing.

## Data flow

```
sale happens on any platform
        |
        v
platform emails a sale confirmation  --(Gmail API poll, every 5 min)-->
        |
        v
GitHub Actions worker parses: which item, which platform
        |
        +--> item cross-listed on eBay? --> call eBay API to end listing (always works)
        |
        +--> item cross-listed on Poshmark/Mercari/Vinted/Depop?
        |         --> Playwright logs in, deletes the listing
        |         --> on any failure: Telegram alert "delist X on Y yourself"
        |
        +--> always: Telegram notification of what happened
        |
        v
database updated: item marked sold, listings marked delisted/error,
sale record created with platform, price, fees
```

## What still needs you before this goes live

This scaffold is real, working code and schema, not a mockup, but it
can't run itself without a few things only you can provide:

- Free accounts: GitHub, Supabase, Vercel, a Telegram bot (via
  @BotFather, takes 2 minutes).
- An eBay developer app (free, tied to your eBay seller account) for the
  real API integration.
- Login credentials/session cookies for Poshmark, Mercari, Vinted, and
  Depop, stored only as encrypted GitHub Actions secrets, never in code.
- A decision, once you see it running, on whether the ToS risk on those
  four platforms is one you're comfortable carrying long-term, versus
  dropping to alert-only for some of them.

See `SETUP.md` for the exact steps once the code side is ready.
