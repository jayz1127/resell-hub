import { prisma } from "./prisma";

export interface MarketplaceRow {
  platform: string;
  revenue: number;
  profit: number;
  soldCount: number;
  avgSalePrice: number;
}

export interface MonthlyRow {
  month: string; // "2026-07"
  label: string; // "Jul 2026"
  revenue: number;
  profit: number;
}

/**
 * Per-marketplace totals for the Analytics charts: revenue, profit
 * (blended — same convention as the blended margin number), number of
 * items sold, and average sale price. One row per platform that has at
 * least one non-deleted sale.
 */
type SaleWithItem = {
  platform: string;
  salePrice: number;
  platformFee: number;
  shippingCost: number;
  soldAt: Date;
  item: { costBasis: number | null };
};

export async function getMarketplaceBreakdown(): Promise<MarketplaceRow[]> {
  const sales = (await prisma.sale.findMany({
    where: { deletedAt: null },
    include: { item: true },
  })) as unknown as SaleWithItem[];

  const byPlatform = new Map<string, { revenue: number; profit: number; count: number }>();

  for (const s of sales) {
    const cost = s.item.costBasis ?? 0;
    const profit = s.salePrice - s.platformFee - s.shippingCost - cost;
    const bucket = byPlatform.get(s.platform) ?? { revenue: 0, profit: 0, count: 0 };
    bucket.revenue += s.salePrice;
    bucket.profit += profit;
    bucket.count += 1;
    byPlatform.set(s.platform, bucket);
  }

  return Array.from(byPlatform.entries())
    .map(([platform, v]) => ({
      platform,
      revenue: round(v.revenue),
      profit: round(v.profit),
      soldCount: v.count,
      avgSalePrice: round(v.revenue / v.count),
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

/**
 * Revenue and profit grouped by calendar month, oldest first — the data
 * behind the "Revenue & Profit over time" area chart.
 */
export async function getRevenueProfitOverTime(): Promise<MonthlyRow[]> {
  const sales = (await prisma.sale.findMany({
    where: { deletedAt: null },
    include: { item: true },
    orderBy: { soldAt: "asc" },
  })) as unknown as SaleWithItem[];

  const byMonth = new Map<string, { revenue: number; profit: number }>();

  for (const s of sales) {
    const cost = s.item.costBasis ?? 0;
    const profit = s.salePrice - s.platformFee - s.shippingCost - cost;
    const key = `${s.soldAt.getFullYear()}-${String(s.soldAt.getMonth() + 1).padStart(2, "0")}`;
    const bucket = byMonth.get(key) ?? { revenue: 0, profit: 0 };
    bucket.revenue += s.salePrice;
    bucket.profit += profit;
    byMonth.set(key, bucket);
  }

  const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, v]) => {
      const [y, m] = month.split("-");
      return {
        month,
        label: `${MONTH_NAMES[parseInt(m, 10) - 1]} ${y}`,
        revenue: round(v.revenue),
        profit: round(v.profit),
      };
    });
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
