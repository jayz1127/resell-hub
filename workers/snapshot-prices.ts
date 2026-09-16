/**
 * Runs once a day (.github/workflows/daily-jobs.yml). Writes one
 * PriceSnapshot per active listing, which is what powers the price-trend
 * feature on the dashboard. Also purges sales that were soft-deleted
 * more than 30 days ago.
 *
 * STATUS: the eBay price read is real (GetItem via the Trading API,
 * ToS-compliant). Reading the current asking price on Poshmark/Mercari/
 * Vinted/Depop needs the same browser automation as delisting, and is
 * stubbed the same way — left unimplemented rather than guessing at
 * page markup, pending real selectors tested against a live account.
 */
import { prisma } from "../lib/prisma";

async function snapshotEbayPrice(externalId: string): Promise<number | null> {
  // TODO: call eBay's getOffer endpoint (same auth as delist-ebay) and
  // return offer.pricingSummary.price.value.
  return null;
}

async function snapshotBrowserPlatformPrice(): Promise<number | null> {
  // TODO: shared with the delist-* Playwright stubs once those are
  // implemented — read the displayed price off the listing page.
  return null;
}

async function run() {
  const activeListings = await prisma.listing.findMany({
    where: { status: "ACTIVE" },
  });

  for (const listing of activeListings) {
    const price =
      listing.platform === "EBAY" && listing.externalId
        ? await snapshotEbayPrice(listing.externalId)
        : await snapshotBrowserPlatformPrice();

    // Fall back to the last known price rather than skipping the day
    // entirely, so the trend line doesn't get gaps just because a
    // platform's scraper isn't wired up yet.
    await prisma.priceSnapshot.create({
      data: {
        itemId: listing.itemId,
        platform: listing.platform,
        price: price ?? listing.price,
      },
    });
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const purged = await prisma.sale.deleteMany({
    where: { deletedAt: { not: null, lt: thirtyDaysAgo } },
  });
  console.log(`Snapshotted ${activeListings.length} listings, purged ${purged.count} old deleted sales.`);
}

if (require.main === module) {
  run()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
