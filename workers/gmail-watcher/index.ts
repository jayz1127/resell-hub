/**
 * Runs every 5 minutes via GitHub Actions (free, see
 * .github/workflows/sale-watcher.yml). This is the fast, 100%-legitimate
 * half of sale detection: it only reads your own Gmail via the official
 * API, no scraping, no ToS issue.
 *
 * Flow per run:
 *   1. Search Gmail for unprocessed sale-confirmation emails (see
 *      senderConfig.ts) across all 5 platforms.
 *   2. For each, figure out which Item it refers to and which platform
 *      it sold on.
 *   3. Record the Sale, mark that Listing SOLD.
 *   4. For every OTHER active Listing of that item: delist it — via the
 *      real eBay API if it's eBay, or via the matching Playwright script
 *      otherwise.
 *   5. Send one Telegram notification summarizing what happened,
 *      including anything that needs manual follow-up.
 *   6. Label the email processed so it's never handled twice.
 */
import { google } from "googleapis";
import { Platform } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { notify } from "../../lib/telegram";
import { delistEbayOffer } from "../delist-ebay";
import { SALE_EMAIL_PATTERNS, PROCESSED_LABEL } from "./senderConfig";
import { delistOnPlatform } from "../platformDelist";

async function getGmailClient() {
  const oAuth2Client = new google.auth.OAuth2(
    requireEnv("GMAIL_CLIENT_ID"),
    requireEnv("GMAIL_CLIENT_SECRET")
  );
  oAuth2Client.setCredentials({ refresh_token: requireEnv("GMAIL_REFRESH_TOKEN") });
  return google.gmail({ version: "v1", auth: oAuth2Client });
}

async function ensureProcessedLabel(gmail: Awaited<ReturnType<typeof getGmailClient>>) {
  const { data } = await gmail.users.labels.list({ userId: "me" });
  const existing = data.labels?.find((l) => l.name === PROCESSED_LABEL);
  if (existing?.id) return existing.id;

  const { data: created } = await gmail.users.labels.create({
    userId: "me",
    requestBody: { name: PROCESSED_LABEL, labelListVisibility: "labelHide" },
  });
  return created.id!;
}

export async function runGmailWatcher() {
  const gmail = await getGmailClient();
  const labelId = await ensureProcessedLabel(gmail);

  for (const [platform, pattern] of Object.entries(SALE_EMAIL_PATTERNS) as [
    Platform,
    (typeof SALE_EMAIL_PATTERNS)[Platform]
  ][]) {
    const query = `from:${pattern.from} -label:${PROCESSED_LABEL} newer_than:1d`;
    const { data } = await gmail.users.messages.list({ userId: "me", q: query });

    for (const msg of data.messages ?? []) {
      await handleMessage(gmail, msg.id!, platform, labelId);
    }
  }
}

async function handleMessage(
  gmail: Awaited<ReturnType<typeof getGmailClient>>,
  messageId: string,
  platform: Platform,
  processedLabelId: string
) {
  const { data: full } = await gmail.users.messages.get({ userId: "me", id: messageId });
  const subject =
    full.payload?.headers?.find((h) => h.name === "Subject")?.value ?? "";

  // TODO: this is the part that genuinely needs your real emails to get
  // right. Item name extraction from a sale email is platform-specific —
  // some put it in the subject, some only in the body/HTML. Wire up
  // per-platform parsing here once you can show me a couple of real
  // examples (redact the buyer's info, the item name/price is all that's
  // needed).
  const itemName = extractItemNameFallback(subject);

  const item = itemName
    ? await prisma.item.findFirst({
        where: { name: { contains: itemName, mode: "insensitive" } },
        include: { listings: true },
      })
    : null;

  if (!item) {
    await notify(
      `Sale email detected on ${platform} but couldn't match it to an item automatically. Subject: "${subject}". Check it manually.`
    );
    await labelProcessed(gmail, messageId, processedLabelId);
    return;
  }

  const soldListing = item.listings.find((l) => l.platform === platform);
  await prisma.$transaction([
    prisma.sale.create({
      data: {
        itemId: item.id,
        platform,
        salePrice: soldListing?.price ?? 0,
        soldAt: new Date(),
      },
    }),
    prisma.item.update({ where: { id: item.id }, data: { status: "SOLD" } }),
    ...(soldListing
      ? [
          prisma.listing.update({
            where: { id: soldListing.id },
            data: { status: "SOLD" },
          }),
        ]
      : []),
  ]);

  const otherListings = item.listings.filter(
    (l) => l.platform !== platform && l.status === "ACTIVE"
  );

  const results: string[] = [`${item.name} sold on ${platform}.`];

  for (const listing of otherListings) {
    if (listing.platform === "EBAY" && listing.externalId) {
      const result = await delistEbayOffer(listing.externalId);
      await recordDelistResult(listing.id, result);
      results.push(`eBay: ${result.ok ? "delisted automatically" : `FAILED (${result.detail}) — delist manually`}`);
    } else {
      const result = await delistOnPlatform(listing.platform, listing.externalId);
      await recordDelistResult(listing.id, result);
      results.push(
        `${listing.platform}: ${result.ok ? "delisted automatically" : `FAILED — delist manually (${result.detail})`}`
      );
    }
  }

  await notify(results.join("\n"));
  await labelProcessed(gmail, messageId, processedLabelId);
}

async function recordDelistResult(
  listingId: string,
  result: { ok: boolean; detail: string }
) {
  await prisma.listing.update({
    where: { id: listingId },
    data: result.ok
      ? { status: "DELISTED", delistedAt: new Date(), lastError: null }
      : { status: "ERROR", lastError: result.detail },
  });
}

async function labelProcessed(
  gmail: Awaited<ReturnType<typeof getGmailClient>>,
  messageId: string,
  labelId: string
) {
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: { addLabelIds: [labelId] },
  });
}

function extractItemNameFallback(subject: string): string | null {
  // Placeholder heuristic until real per-platform parsing is wired up.
  const match = subject.match(/(?:sold|You sold|Sold!)[:\-]?\s*(.+)/i);
  return match?.[1]?.trim() ?? null;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name}`);
  return v;
}

if (require.main === module) {
  runGmailWatcher()
    .then(() => console.log("Gmail watcher run complete"))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
