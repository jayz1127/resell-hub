import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type FlypRow = {
  title: string;
  sku: string | null;
  platform: "EBAY" | "POSHMARK" | "MERCARI" | "VINTED" | "DEPOP";
  soldAt: string; // ISO date
  soldPrice: number;
  costOfGoods: number;
  marketplaceFee: number;
  shippingPaidBySeller: number;
  shippingPaidByBuyer: number;
};

// One-time snapshot pulled from the Flyp dashboard (Analytics -> Export
// data), covering every sale on record as of Sep 18 2026. Safe to re-run:
// rows already imported (matched by item name + platform + sold date) are
// skipped automatically.
const FLYP_SALES: FlypRow[] = [
  { title: "Like new J130 Dark Brown in size L made in", sku: null, platform: "DEPOP", soldAt: "2026-07-26", soldPrice: 61, costOfGoods: 59.19, marketplaceFee: 2.83, shippingPaidBySeller: 0, shippingPaidByBuyer: 0 },
  { title: "Carhartt Rain Defender Full Zip Loose Fit Hoodie w/ Pockets", sku: null, platform: "EBAY", soldAt: "2026-07-28", soldPrice: 43, costOfGoods: 25.59, marketplaceFee: 7.51, shippingPaidBySeller: 0, shippingPaidByBuyer: 9.28 },
  { title: "Carhartt brown jacket, Size M, #workwear #utility", sku: null, platform: "DEPOP", soldAt: "2026-07-30", soldPrice: 80, costOfGoods: 74.94, marketplaceFee: 3.52, shippingPaidBySeller: 0, shippingPaidByBuyer: 0 },
  { title: "Brooklyn Cloth Beige Stretch Cargo Shorts Men's Regular Solid Drawstring", sku: null, platform: "EBAY", soldAt: "2026-08-01", soldPrice: 10, costOfGoods: 0, marketplaceFee: 2.75, shippingPaidBySeller: 0, shippingPaidByBuyer: 6.36 },
  { title: "Nike Pro Hyperwarm Men's Long Sleeve Compression Crew Pullover Polyester", sku: null, platform: "EBAY", soldAt: "2026-08-02", soldPrice: 12, costOfGoods: 0, marketplaceFee: 2.97, shippingPaidBySeller: 0, shippingPaidByBuyer: 6.16 },
  { title: "Unicorno Uomo Men's Grey Hoodie", sku: null, platform: "VINTED", soldAt: "2026-08-06", soldPrice: 12, costOfGoods: 0, marketplaceFee: 0, shippingPaidBySeller: 0, shippingPaidByBuyer: 0 },
  { title: 'Gray Carhartt jacket men\'s size M Special Edition "100 Years"', sku: null, platform: "VINTED", soldAt: "2026-08-06", soldPrice: 45, costOfGoods: 17.19, marketplaceFee: 0, shippingPaidBySeller: 0, shippingPaidByBuyer: 0 },
  { title: "Goodfellow & Co Men's XL Regular Standard Fit Blue/Gray Plaid", sku: null, platform: "EBAY", soldAt: "2026-08-07", soldPrice: 8.5, costOfGoods: 0, marketplaceFee: 2.41, shippingPaidBySeller: 6.27, shippingPaidByBuyer: 6.27 },
  { title: "NWT Carhartt x Every Man Jack Detroit Jacket Men's Medium", sku: null, platform: "VINTED", soldAt: "2026-08-08", soldPrice: 93.5, costOfGoods: 54, marketplaceFee: 0, shippingPaidBySeller: 0, shippingPaidByBuyer: 0 },
  { title: "Hey there! Thanks for stopping by to check out these", sku: "034563", platform: "DEPOP", soldAt: "2026-08-12", soldPrice: 40, costOfGoods: 0, marketplaceFee: 1.57, shippingPaidBySeller: 0, shippingPaidByBuyer: 0 },
  { title: "Vintage GAP Genuine Leather Trench Coat Car Coat Quilted Lining", sku: null, platform: "EBAY", soldAt: "2026-08-12", soldPrice: 80, costOfGoods: 0, marketplaceFee: 12.07, shippingPaidBySeller: 0, shippingPaidByBuyer: 5.8 },
  { title: "Brooks Brothers Vintage Hand Tailored Tuxedo Suit Black 42R 36x34", sku: null, platform: "EBAY", soldAt: "2026-08-18", soldPrice: 300, costOfGoods: 0, marketplaceFee: 46.31, shippingPaidBySeller: 11.71, shippingPaidByBuyer: 11.71 },
  { title: "Calvin Klein Men Black Slim Fit Dress Pants 34W Stretch", sku: null, platform: "DEPOP", soldAt: "2026-08-26", soldPrice: 15, costOfGoods: 0, marketplaceFee: 0.98, shippingPaidBySeller: 0, shippingPaidByBuyer: 0 },
  { title: "Carhartt Rain Defender Jacket in navy blue, size L. Brand", sku: null, platform: "DEPOP", soldAt: "2026-08-27", soldPrice: 42, costOfGoods: 28.74, marketplaceFee: 2.03, shippingPaidBySeller: 0, shippingPaidByBuyer: 0 },
  { title: "Air Jordan Proto-Max 720 Men's Size 13 Wolf Grey Volt", sku: "BQ6623-007", platform: "EBAY", soldAt: "2026-09-04", soldPrice: 40, costOfGoods: 0, marketplaceFee: 7.17, shippingPaidBySeller: 0, shippingPaidByBuyer: 6.99 },
  { title: "2 Men's Van Heusen White Button down shirts (read description)", sku: null, platform: "EBAY", soldAt: "2026-09-05", soldPrice: 15, costOfGoods: 0, marketplaceFee: 3.82, shippingPaidBySeller: 0, shippingPaidByBuyer: 8.07 },
  { title: "Carhartt Men's Green/Black Camo Loose Fit Quarter-Zip Pullover Jacket M", sku: null, platform: "EBAY", soldAt: "2026-09-06", soldPrice: 30, costOfGoods: 20.34, marketplaceFee: 6.51, shippingPaidBySeller: 0, shippingPaidByBuyer: 10.05 },
  { title: "adidas Men's Gray Fleece Athletic Shorts M Elastic Waist Drawstring", sku: null, platform: "VINTED", soldAt: "2026-09-07", soldPrice: 8.55, costOfGoods: 0, marketplaceFee: 0, shippingPaidBySeller: 0, shippingPaidByBuyer: 0 },
  { title: "Calvin Klein Men Black Slim Fit Dress Pants 33W", sku: null, platform: "VINTED", soldAt: "2026-09-07", soldPrice: 20, costOfGoods: 0, marketplaceFee: 0, shippingPaidBySeller: 0, shippingPaidByBuyer: 0 },
  { title: "Carhartt J131 Duck Active Jacket Brown Thermal Lined Made in", sku: "J131-BRN-XL", platform: "VINTED", soldAt: "2026-09-11", soldPrice: 90, costOfGoods: 43.54, marketplaceFee: 0, shippingPaidBySeller: 0, shippingPaidByBuyer: 0 },
  { title: "Pair of NFL New York Giants Men's Large blue long", sku: null, platform: "EBAY", soldAt: "2026-09-14", soldPrice: 21, costOfGoods: 0, marketplaceFee: 4.43, shippingPaidBySeller: 0, shippingPaidByBuyer: 6.35 },
];

async function importFlypSales() {
  "use server";

  let imported = 0;
  let skipped = 0;

  for (const row of FLYP_SALES) {
    const soldAt = new Date(row.soldAt);

    // Idempotency guard: matches this exact sale if the import is run
    // more than once, so clicking the button twice never double-counts.
    const existing = await prisma.sale.findFirst({
      where: {
        platform: row.platform,
        soldAt,
        item: { name: row.title },
      },
    });
    if (existing) {
      skipped++;
      continue;
    }

    // Flyp's "Cost of Goods" is 0 when nothing was entered there, which we
    // treat the same way the Purchases form does: no cost = hand-me-down,
    // excluded from the "real" margin.
    const hasCost = row.costOfGoods > 0;

    const item = await prisma.item.create({
      data: {
        name: row.title,
        sku: row.sku,
        sourceType: hasCost ? "PURCHASED" : "HAND_ME_DOWN",
        costBasis: hasCost ? row.costOfGoods : null,
        status: "SOLD",
        notes: "Imported from Flyp",
      },
    });

    await prisma.sale.create({
      data: {
        itemId: item.id,
        platform: row.platform,
        salePrice: row.soldPrice,
        platformFee: row.marketplaceFee,
        // Net shipping cost: what you paid out minus what the buyer paid
        // you toward it, matching how Flyp itself rolls shipping into
        // profit (this can come out negative, which is correct).
        shippingCost: row.shippingPaidBySeller - row.shippingPaidByBuyer,
        soldAt,
      },
    });

    imported++;
  }

  revalidatePath("/purchases-sales");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
  revalidatePath("/data");

  redirect(`/admin/import-flyp?imported=${imported}&skipped=${skipped}`);
}

export default function ImportFlypPage({
  searchParams,
}: {
  searchParams?: { imported?: string; skipped?: string };
}) {
  const done = searchParams?.imported != null;

  return (
    <div>
      <h1>Import Flyp sales history</h1>
      <p style={{ color: "#666", maxWidth: 600 }}>
        One-time import of your full Flyp sales history, pulled from the
        Flyp dashboard&apos;s Export data button. Safe to run more than
        once — rows already imported (matched by item name, platform, and
        sold date) are skipped automatically.
      </p>

      {done && (
        <p
          style={{
            padding: "0.75rem 1rem",
            background: "#eefbea",
            border: "1px solid #b7e6ac",
            borderRadius: 6,
            maxWidth: 600,
          }}
        >
          Imported {searchParams?.imported}, skipped {searchParams?.skipped} (already present).
        </p>
      )}

      <form action={importFlypSales}>
        <button
          type="submit"
          style={{ padding: "0.6rem 1.2rem", fontWeight: 600, cursor: "pointer" }}
        >
          Import {FLYP_SALES.length} sales from Flyp
        </button>
      </form>
    </div>
  );
}
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type FlypRow = {
  title: string;
  sku: string | null;
  platform: "EBAY" | "POSHMARK" | "MERCARI" | "VINTED" | "DEPOP";
  soldAt: string; // ISO date
  soldPrice: number;
  costOfGoods: number;
  marketplaceFee: number;
  shippingPaidBySeller: number;
  shippingPaidByBuyer: number;
};

// One-time snapshot pulled from the Flyp dashboard (Analytics -> Export
// data), covering every sale on record as of Sep 18 2026. Safe to re-run:
// rows already imported (matched by item name + platform + sold date) are
// skipped automatically.
const FLYP_SALES: FlypRow[] = [
  { title: "Like new J130 Dark Brown in size L made in", sku: null, platform: "DEPOP", soldAt: "2026-07-26", soldPrice: 61, costOfGoods: 59.19, marketplaceFee: 2.83, shippingPaidBySeller: 0, shippingPaidByBuyer: 0 },
  { title: "Carhartt Rain Defender Full Zip Loose Fit Hoodie w/ Pockets", sku: null, platform: "EBAY", soldAt: "2026-07-28", soldPrice: 43, costOfGoods: 25.59, marketplaceFee: 7.51, shippingPaidBySeller: 0, shippingPaidByBuyer: 9.28 },
  { title: "Carhartt brown jacket, Size M, #workwear #utility", sku: null, platform: "DEPOP", soldAt: "2026-07-30", soldPrice: 80, costOfGoods: 74.94, marketplaceFee: 3.52, shippingPaidBySeller: 0, shippingPaidByBuyer: 0 },
  { title: "Brooklyn Cloth Beige Stretch Cargo Shorts Men's Regular Solid Drawstring", sku: null, platform: "EBAY", soldAt: "2026-08-01", soldPrice: 10, costOfGoods: 0, marketplaceFee: 2.75, shippingPaidBySeller: 0, shippingPaidByBuyer: 6.36 },
  { title: "Nike Pro Hyperwarm Men's Long Sleeve Compression Crew Pullover Polyester", sku: null, platform: "EBAY", soldAt: "2026-08-02", soldPrice: 12, costOfGoods: 0, marketplaceFee: 2.97, shippingPaidBySeller: 0, shippingPaidByBuyer: 6.16 },
  { title: "Unicorno Uomo Men's Grey Hoodie", sku: null, platform: "VINTED", soldAt: "2026-08-06", soldPrice: 12, costOfGoods: 0, marketplaceFee: 0, shippingPaidBySeller: 0, shippingPaidByBuyer: 0 },
  { title: 'Gray Carhartt jacket men\'s size M Special Edition "100 Years"', sku: null, platform: "VINTED", soldAt: "2026-08-06", soldPrice: 45, costOfGoods: 17.19, marketplaceFee: 0, shippingPaidBySeller: 0, shippingPaidByBuyer: 0 },
  { title: "Goodfellow & Co Men's XL Regular Standard Fit Blue/Gray Plaid", sku: null, platform: "EBAY", soldAt: "2026-08-07", soldPrice: 8.5, costOfGoods: 0, marketplaceFee: 2.41, shippingPaidBySeller: 6.27, shippingPaidByBuyer: 6.27 },
  { title: "NWT Carhartt x Every Man Jack Detroit Jacket Men's Medium", sku: null, platform: "VINTED", soldAt: "2026-08-08", soldPrice: 93.5, costOfGoods: 54, marketplaceFee: 0, shippingPaidBySeller: 0, shippingPaidByBuyer: 0 },
  { title: "Hey there! Thanks for stopping by to check out these", sku: "034563", platform: "DEPOP", soldAt: "2026-08-12", soldPrice: 40, costOfGoods: 0, marketplaceFee: 1.57, shippingPaidBySeller: 0, shippingPaidByBuyer: 0 },
  { title: "Vintage GAP Genuine Leather Trench Coat Car Coat Quilted Lining", sku: null, platform: "EBAY", soldAt: "2026-08-12", soldPrice: 80, costOfGoods: 0, marketplaceFee: 12.07, shippingPaidBySeller: 0, shippingPaidByBuyer: 5.8 },
  { title: "Brooks Brothers Vintage Hand Tailored Tuxedo Suit Black 42R 36x34", sku: null, platform: "EBAY", soldAt: "2026-08-18", soldPrice: 300, costOfGoods: 0, marketplaceFee: 46.31, shippingPaidBySeller: 11.71, shippingPaidByBuyer: 11.71 },
  { title: "Calvin Klein Men Black Slim Fit Dress Pants 34W Stretch", sku: null, platform: "DEPOP", soldAt: "2026-08-26", soldPrice: 15, costOfGoods: 0, marketplaceFee: 0.98, shippingPaidBySeller: 0, shippingPaidByBuyer: 0 },
  { title: "Carhartt Rain Defender Jacket in navy blue, size L. Brand", sku: null, platform: "DEPOP", soldAt: "2026-08-27", soldPrice: 42, costOfGoods: 28.74, marketplaceFee: 2.03, shippingPaidBySeller: 0, shippingPaidByBuyer: 0 },
  { title: "Air Jordan Proto-Max 720 Men's Size 13 Wolf Grey Volt", sku: "BQ6623-007", platform: "EBAY", soldAt: "2026-09-04", soldPrice: 40, costOfGoods: 0, marketplaceFee: 7.17, shippingPaidBySeller: 0, shippingPaidByBuyer: 6.99 },
  { title: "2 Men's Van Heusen White Button down shirts (read description)", sku: null, platform: "EBAY", soldAt: "2026-09-05", soldPrice: 15, costOfGoods: 0, marketplaceFee: 3.82, shippingPaidBySeller: 0, shippingPaidByBuyer: 8.07 },
  { title: "Carhartt Men's Green/Black Camo Loose Fit Quarter-Zip Pullover Jacket M", sku: null, platform: "EBAY", soldAt: "2026-09-06", soldPrice: 30, costOfGoods: 20.34, marketplaceFee: 6.51, shippingPaidBySeller: 0, shippingPaidByBuyer: 10.05 },
  { title: "adidas Men's Gray Fleece Athletic Shorts M Elastic Waist Drawstring", sku: null, platform: "VINTED", soldAt: "2026-09-07", soldPrice: 8.55, costOfGoods: 0, marketplaceFee: 0, shippingPaidBySeller: 0, shippingPaidByBuyer: 0 },
  { title: "Calvin Klein Men Black Slim Fit Dress Pants 33W", sku: null, platform: "VINTED", soldAt: "2026-09-07", soldPrice: 20, costOfGoods: 0, marketplaceFee: 0, shippingPaidBySeller: 0, shippingPaidByBuyer: 0 },
  { title: "Carhartt J131 Duck Active Jacket Brown Thermal Lined Made in", sku: "J131-BRN-XL", platform: "VINTED", soldAt: "2026-09-11", soldPrice: 90, costOfGoods: 43.54, marketplaceFee: 0, shippingPaidBySeller: 0, shippingPaidByBuyer: 0 },
  { title: "Pair of NFL New York Giants Men's Large blue long", sku: null, platform: "EBAY", soldAt: "2026-09-14", soldPrice: 21, costOfGoods: 0, marketplaceFee: 4.43, shippingPaidBySeller: 0, shippingPaidByBuyer: 6.35 },
];

async function importFlypSales() {
  "use server";

  let imported = 0;
  let skipped = 0;

  for (const row of FLYP_SALES) {
    const soldAt = new Date(row.soldAt);

    // Idempotency guard: matches this exact sale if the import is run
    // more than once, so clicking the button twice never double-counts.
    const existing = await prisma.sale.findFirst({
      where: {
        platform: row.platform,
        soldAt,
        item: { name: row.title },
      },
    });
    if (existing) {
      skipped++;
      continue;
    }

    // Flyp's "Cost of Goods" is 0 when nothing was entered there, which we
    // treat the same way the Purchases form does: no cost = hand-me-down,
    // excluded from the "real" margin.
    const hasCost = row.costOfGoods > 0;

    const item = await prisma.item.create({
      data: {
        name: row.title,
        sku: row.sku,
        sourceType: hasCost ? "PURCHASED" : "HAND_ME_DOWN",
        costBasis: hasCost ? row.costOfGoods : null,
        status: "SOLD",
        notes: "Imported from Flyp",
      },
    });

    await prisma.sale.create({
      data: {
        itemId: item.id,
        platform: row.platform,
        salePrice: row.soldPrice,
        platformFee: row.marketplaceFee,
        // Net shipping cost: what you paid out minus what the buyer paid
        // you toward it, matching how Flyp itself rolls shipping into
        // profit (this can come out negative, which is correct).
        shippingCost: row.shippingPaidBySeller - row.shippingPaidByBuyer,
        soldAt,
      },
    });

    imported++;
  }

  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/inventory");
  revalidatePath("/purchases");

  redirect(`/admin/import-flyp?imported=${imported}&skipped=${skipped}`);
}

export default function ImportFlypPage({
  searchParams,
}: {
  searchParams?: { imported?: string; skipped?: string };
}) {
  const done = searchParams?.imported != null;

  return (
    <div>
      <h1>Import Flyp sales history</h1>
      <p style={{ color: "#666", maxWidth: 600 }}>
        One-time import of your full Flyp sales history, pulled from the
        Flyp dashboard&apos;s Export data button. Safe to run more than
        once — rows already imported (matched by item name, platform, and
        sold date) are skipped automatically.
      </p>

      {done && (
        <p
          style={{
            padding: "0.75rem 1rem",
            background: "#eefbea",
            border: "1px solid #b7e6ac",
            borderRadius: 6,
            maxWidth: 600,
          }}
        >
          Imported {searchParams?.imported}, skipped {searchParams?.skipped} (already present).
        </p>
      )}

      <form action={importFlypSales}>
        <button
          type="submit"
          style={{ padding: "0.6rem 1.2rem", fontWeight: 600, cursor: "pointer" }}
        >
          Import {FLYP_SALES.length} sales from Flyp
        </button>
      </form>
    </div>
  );
}
