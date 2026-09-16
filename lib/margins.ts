import { prisma } from "./prisma";

export interface MarginBreakdown {
  saleCount: number;
  totalRevenue: number;
  totalFees: number;
  totalShipping: number;
  totalCostBasis: number;
  totalProfit: number;
  marginPct: number; // profit / revenue, as a percentage
}

const EMPTY: MarginBreakdown = {
  saleCount: 0,
  totalRevenue: 0,
  totalFees: 0,
  totalShipping: 0,
  totalCostBasis: 0,
  totalProfit: 0,
  marginPct: 0,
};

/**
 * Computes two numbers side by side, which is the whole point of this file:
 *
 * - "blended": every non-deleted sale, treating hand-me-downs as zero cost.
 *   This is the number Flyp shows you, and it overstates your margin
 *   because free inventory has no cost to subtract.
 *
 * - "real": only sales of items that have a known cost basis (sourceType
 *   PURCHASED, costBasis not null). This is what your margin actually is
 *   on the clothes you paid money for.
 *
 * date range is optional; pass none for all-time.
 */
export async function getMarginBreakdown(range?: { from: Date; to: Date }) {
  const sales = await prisma.sale.findMany({
    where: {
      deletedAt: null,
      ...(range ? { soldAt: { gte: range.from, lte: range.to } } : {}),
    },
    include: { item: true },
  });

  const blended = fold(
    sales.map((s) => ({
      revenue: s.salePrice,
      fees: s.platformFee,
      shipping: s.shippingCost,
      // hand-me-downs contribute 0 cost basis to "blended" on purpose —
      // that's exactly the inflation this feature exists to expose.
      cost: s.item.costBasis ?? 0,
    }))
  );

  const realSales = sales.filter(
    (s) => s.item.sourceType === "PURCHASED" && s.item.costBasis != null
  );
  const real = fold(
    realSales.map((s) => ({
      revenue: s.salePrice,
      fees: s.platformFee,
      shipping: s.shippingCost,
      cost: s.item.costBasis as number,
    }))
  );

  return {
    blended,
    real,
    excludedSaleCount: sales.length - realSales.length,
  };
}

function fold(
  rows: { revenue: number; fees: number; shipping: number; cost: number }[]
): MarginBreakdown {
  if (rows.length === 0) return EMPTY;

  const totalRevenue = sum(rows.map((r) => r.revenue));
  const totalFees = sum(rows.map((r) => r.fees));
  const totalShipping = sum(rows.map((r) => r.shipping));
  const totalCostBasis = sum(rows.map((r) => r.cost));
  const totalProfit = totalRevenue - totalFees - totalShipping - totalCostBasis;

  return {
    saleCount: rows.length,
    totalRevenue,
    totalFees,
    totalShipping,
    totalCostBasis,
    totalProfit,
    marginPct: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
  };
}

function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}
