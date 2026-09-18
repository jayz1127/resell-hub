import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MarginDrilldownPage({
  params,
}: {
  params: { type: string };
}) {
  const type = params.type;
  if (type !== "blended" && type !== "real") notFound();

  const sales = await prisma.sale.findMany({
    where: {
      deletedAt: null,
      ...(type === "real"
        ? { item: { sourceType: "PURCHASED", costBasis: { not: null } } }
        : {}),
    },
    include: { item: true },
    orderBy: { soldAt: "desc" },
  });

  type SaleWithItem = {
    id: string;
    platform: string;
    soldAt: Date;
    salePrice: number;
    platformFee: number;
    shippingCost: number;
    item: { name: string; costBasis: number | null; sourceType: string };
  };

  const rows = (sales as SaleWithItem[]).map((s) => {
    const cost = type === "real" ? (s.item.costBasis as number) : s.item.costBasis ?? 0;
    const profit = s.salePrice - s.platformFee - s.shippingCost - cost;
    return {
      id: s.id,
      itemName: s.item.name,
      platform: s.platform,
      soldAt: s.soldAt,
      salePrice: s.salePrice,
      fees: s.platformFee,
      shipping: s.shippingCost,
      cost,
      profit,
      marginPct: s.salePrice > 0 ? (profit / s.salePrice) * 100 : 0,
      isHandMeDown: s.item.sourceType === "HAND_ME_DOWN",
    };
  });

  const totalRevenue = rows.reduce((a, r) => a + r.salePrice, 0);
  const totalProfit = rows.reduce((a, r) => a + r.profit, 0);

  return (
    <div>
      <p><a href="/dashboard">← Back to dashboard</a></p>
      <h1>{type === "blended" ? "Blended margin" : "Real margin"} — itemized</h1>
      <p style={{ color: "#666" }}>
        {type === "blended"
          ? "Every non-deleted sale, hand-me-downs counted as $0 cost."
          : "Only sales of items with a real, known cost basis (purchased, not a hand-me-down)."}
        {" "}{rows.length} sale{rows.length === 1 ? "" : "s"} · ${totalRevenue.toFixed(2)} revenue · ${totalProfit.toFixed(2)} profit.
      </p>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th>Item</th>
            <th>Platform</th>
            <th>Sold</th>
            <th style={{ textAlign: "right" }}>Sale price</th>
            <th style={{ textAlign: "right" }}>Fees</th>
            <th style={{ textAlign: "right" }}>Shipping</th>
            <th style={{ textAlign: "right" }}>Cost</th>
            <th style={{ textAlign: "right" }}>Profit</th>
            <th style={{ textAlign: "right" }}>Margin</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td>
                {r.itemName}
                {type === "blended" && r.isHandMeDown && (
                  <span style={{ color: "#999", fontSize: "0.78rem" }}> (hand-me-down)</span>
                )}
              </td>
              <td>{r.platform}</td>
              <td>{r.soldAt.toDateString()}</td>
              <td style={{ textAlign: "right" }}>${r.salePrice.toFixed(2)}</td>
              <td style={{ textAlign: "right" }}>${r.fees.toFixed(2)}</td>
              <td style={{ textAlign: "right" }}>${r.shipping.toFixed(2)}</td>
              <td style={{ textAlign: "right" }}>${r.cost.toFixed(2)}</td>
              <td style={{ textAlign: "right", fontWeight: 600, color: r.profit >= 0 ? "#16a34a" : "#dc2626" }}>
                ${r.profit.toFixed(2)}
              </td>
              <td style={{ textAlign: "right" }}>{r.marginPct.toFixed(1)}%</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={9} style={{ color: "#999", padding: "1rem 0" }}>
                No sales in this bucket yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
