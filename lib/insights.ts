import { prisma } from "./prisma";

export interface Insights {
  bestPlatform: { platform: string; profit: number } | null;
  worstPlatform: { platform: string; profit: number } | null;
  mostProfitableSale: {
    itemName: string;
    platform: string;
    profit: number;
    salePrice: number;
    soldAt: Date;
  } | null;
  sellThroughRate: number; // sold / (sold + active), as a percentage
  soldCount: number;
  activeCount: number;
  avgSalePrice: number;
  totalRevenue: number;
  handMeDownCount: number;
  purchasedCount: number;
  handMeDownProfitShare: number; // % of total profit that came from hand-me-downs
  categoryBreakdown: { keyword: string; count: number }[];
}

// A rough, free-form category guess based on words in the item name, since
// Flyp doesn't give us a real category field for most rows. Not exhaustive
// on purpose -- just enough to answer "what do I mostly sell".
const CATEGORY_KEYWORDS = [
  "jacket", "coat", "hoodie", "sweater", "shirt", "t-shirt", "pants",
  "jeans", "shorts", "dress", "suit", "shoes", "boots", "sneakers",
  "sandals", "belt", "hat", "bag", "purse", "carhartt", "nike", "adidas",
  "vintage", "denim", "flannel", "polo", "sweatshirt", "cargo",
];

type SaleWithItem = {
  platform: string;
  salePrice: number;
  platformFee: number;
  shippingCost: number;
  soldAt: Date;
  item: { name: string; costBasis: number | null; sourceType: string };
};

type ItemRow = { name: string; status: string; sourceType: string };

export async function getInsights(): Promise<Insights> {
  const [salesRaw, itemsRaw] = await Promise.all([
    prisma.sale.findMany({ where: { deletedAt: null }, include: { item: true } }),
    prisma.item.findMany(),
  ]);
  const sales = salesRaw as unknown as SaleWithItem[];
  const items = itemsRaw as unknown as ItemRow[];

  const byPlatform = new Map<string, number>();
  let totalProfit = 0;
  let totalRevenue = 0;
  let handMeDownProfit = 0;
  let best: Insights["mostProfitableSale"] = null;

  for (const s of sales) {
    const cost = s.item.costBasis ?? 0;
    const profit = s.salePrice - s.platformFee - s.shippingCost - cost;
    totalProfit += profit;
    totalRevenue += s.salePrice;
    if (s.item.sourceType === "HAND_ME_DOWN") handMeDownProfit += profit;

    byPlatform.set(s.platform, (byPlatform.get(s.platform) ?? 0) + profit);

    if (!best || profit > best.profit) {
      best = {
        itemName: s.item.name,
        platform: s.platform,
        profit: round(profit),
        salePrice: s.salePrice,
        soldAt: s.soldAt,
      };
    }
  }

  const platformEntries = Array.from(byPlatform.entries()).sort((a, b) => b[1] - a[1]);
  const bestPlatform = platformEntries.length
    ? { platform: platformEntries[0][0], profit: round(platformEntries[0][1]) }
    : null;
  const worstPlatform = platformEntries.length > 1
    ? {
        platform: platformEntries[platformEntries.length - 1][0],
        profit: round(platformEntries[platformEntries.length - 1][1]),
      }
    : null;

  const soldCount = items.filter((i) => i.status === "SOLD").length;
  const activeCount = items.filter((i) => i.status === "ACTIVE").length;
  const handMeDownCount = items.filter((i) => i.sourceType === "HAND_ME_DOWN").length;
  const purchasedCount = items.filter((i) => i.sourceType === "PURCHASED").length;

  const nameBlob = items.map((i) => i.name.toLowerCase());
  const categoryBreakdown = CATEGORY_KEYWORDS
    .map((keyword) => ({
      keyword,
      count: nameBlob.filter((n) => n.includes(keyword)).length,
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    bestPlatform,
    worstPlatform,
    mostProfitableSale: best,
    sellThroughRate: soldCount + activeCount > 0 ? round((soldCount / (soldCount + activeCount)) * 100) : 0,
    soldCount,
    activeCount,
    avgSalePrice: sales.length > 0 ? round(totalRevenue / sales.length) : 0,
    totalRevenue: round(totalRevenue),
    handMeDownCount,
    purchasedCount,
    handMeDownProfitShare: totalProfit !== 0 ? round((handMeDownProfit / totalProfit) * 100) : 0,
    categoryBreakdown,
  };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
