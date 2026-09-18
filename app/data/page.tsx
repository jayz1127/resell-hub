import { getInsights } from "@/lib/insights";

export const dynamic = "force-dynamic";

export default async function DataPage() {
  const i = await getInsights();

  return (
    <div>
      <h1>Data</h1>
      <p style={{ color: "#666" }}>
        Quick takeaways pulled from your purchases and sales. A couple of
        Flyp&apos;s Analytics numbers (real product categories, buyer
        locations) aren&apos;t here because that data isn&apos;t available
        anywhere we can read it back out — the category guess below is just
        keyword-matching item names.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1rem",
          marginTop: "1.5rem",
        }}
      >
        <Stat label="Best platform" value={i.bestPlatform ? i.bestPlatform.platform : "—"} sub={i.bestPlatform ? `$${i.bestPlatform.profit.toFixed(2)} profit` : undefined} />
        <Stat label="Weakest platform" value={i.worstPlatform ? i.worstPlatform.platform : "—"} sub={i.worstPlatform ? `$${i.worstPlatform.profit.toFixed(2)} profit` : undefined} />
        <Stat label="Sell-through rate" value={`${i.sellThroughRate.toFixed(1)}%`} sub={`${i.soldCount} sold / ${i.activeCount} still active`} />
        <Stat label="Average sale price" value={`$${i.avgSalePrice.toFixed(2)}`} sub={`across $${i.totalRevenue.toFixed(2)} total revenue`} />
        <Stat label="Hand-me-downs vs. purchased" value={`${i.handMeDownCount} / ${i.purchasedCount}`} sub="items, by source" />
        <Stat label="Profit from hand-me-downs" value={`${i.handMeDownProfitShare.toFixed(1)}%`} sub="of total blended profit" />
      </div>

      {i.mostProfitableSale && (
        <div style={{ marginTop: "1.5rem", border: "1px solid #e5e5e5", borderRadius: 8, padding: "1rem" }}>
          <h3 style={{ marginTop: 0 }}>Most profitable single sale</h3>
          <p style={{ margin: "0.25rem 0" }}>
            <strong>{i.mostProfitableSale.itemName}</strong> — sold on {i.mostProfitableSale.platform} for
            {" "}${i.mostProfitableSale.salePrice.toFixed(2)} ({i.mostProfitableSale.soldAt.toDateString()})
          </p>
          <p style={{ margin: "0.25rem 0", color: "#16a34a", fontWeight: 600 }}>
            ${i.mostProfitableSale.profit.toFixed(2)} profit
          </p>
        </div>
      )}

      <h2 style={{ marginTop: "2.5rem" }}>What you sell most (by keyword)</h2>
      {i.categoryBreakdown.length === 0 ? (
        <p style={{ color: "#999" }}>Not enough items with recognizable keywords yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, maxWidth: 500 }}>
          {i.categoryBreakdown.map((c) => (
            <div key={c.keyword} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 90, textTransform: "capitalize", fontSize: "0.85rem" }}>{c.keyword}</div>
              <div
                style={{
                  height: 14,
                  background: "#4f46e5",
                  borderRadius: 4,
                  width: `${Math.max(6, (c.count / i.categoryBreakdown[0].count) * 100)}%`,
                }}
              />
              <div style={{ fontSize: "0.8rem", color: "#666" }}>{c.count}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ border: "1px solid #e5e5e5", borderRadius: 8, padding: "1rem" }}>
      <div style={{ color: "#666", fontSize: "0.85rem" }}>{label}</div>
      <div style={{ fontSize: "1.6rem", fontWeight: 700, margin: "0.15rem 0" }}>{value}</div>
      {sub && <div style={{ color: "#999", fontSize: "0.8rem" }}>{sub}</div>}
    </div>
  );
}
