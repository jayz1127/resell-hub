import { prisma } from "./prisma";

export type TrendDirection = "up" | "down" | "flat" | "insufficient_data";

export interface ItemPriceTrend {
  itemId: string;
  itemName: string;
  currentAveragePrice: number | null; // averaged across platforms it's active on today
  previousAveragePrice: number | null; // same, from `windowDays` ago
  changePct: number | null;
  direction: TrendDirection;
}

/**
 * For one item, averages its asking price across every platform it's
 * currently listed on, compares that to the same average `windowDays`
 * ago, and says whether the item is trending up or down in value.
 *
 * Relies on PriceSnapshot rows written daily by
 * workers/snapshot-prices.ts for every ACTIVE listing.
 */
export async function getItemPriceTrend(
  itemId: string,
  windowDays = 7
): Promise<ItemPriceTrend> {
  const item = await prisma.item.findUniqueOrThrow({ where: { id: itemId } });

  const now = new Date();
  const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

  const [recentSnapshots, olderSnapshots] = await Promise.all([
    prisma.priceSnapshot.findMany({
      where: { itemId, capturedAt: { gte: dayStart(now) } },
    }),
    prisma.priceSnapshot.findMany({
      where: {
        itemId,
        capturedAt: { gte: dayStart(windowStart), lt: dayEnd(windowStart) },
      },
    }),
  ]);

  const currentAveragePrice = average(recentSnapshots.map((s) => s.price));
  const previousAveragePrice = average(olderSnapshots.map((s) => s.price));

  if (currentAveragePrice == null || previousAveragePrice == null) {
    return {
      itemId,
      itemName: item.name,
      currentAveragePrice,
      previousAveragePrice,
      changePct: null,
      direction: "insufficient_data",
    };
  }

  const changePct =
    ((currentAveragePrice - previousAveragePrice) / previousAveragePrice) * 100;

  let direction: TrendDirection = "flat";
  if (changePct > 1) direction = "up";
  else if (changePct < -1) direction = "down";

  return {
    itemId,
    itemName: item.name,
    currentAveragePrice,
    previousAveragePrice,
    changePct,
    direction,
  };
}

export async function getAllActiveItemTrends(windowDays = 7) {
  const activeItems = await prisma.item.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  });
  return Promise.all(
    activeItems.map((i) => getItemPriceTrend(i.id, windowDays))
  );
}

function average(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function dayStart(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayEnd(d: Date): Date {
  const x = dayStart(d);
  x.setDate(x.getDate() + 1);
  return x;
}
