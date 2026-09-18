import { getMarginBreakdown } from "@/lib/margins";
import { getAllActiveItemTrends } from "@/lib/priceTrend";
import { getMarketplaceBreakdown, getRevenueProfitOverTime } from "@/lib/analytics";
import {
  RevenueProfitChart,
  MarketplacePieChart,
  MarketplaceBarChart,
} from "@/components/AnalyticsCharts";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { blended, real, excludedSaleCount } = await getMarginBreakdown();
  const trends = await getAllActiveItemTrends();
  const marketplaceRows = await getMarketplaceBreakdown();
  const monthlyRows = await getRevenueProfitOverTime();

  return (
    <div>
      <h1>Profit margin</h1>
      <p style={{ color: "#666" }}>
        Blended counts every sale. Real only counts sales of items you have
        a cost basis for — it excludes {excludedSaleCount} hand-me-down
        sale{excludedSaleCount === 1 ? "" : "s"} with no purchase price.
        Click a card to see exactly which sales make it up.
      </p>

      <div style={{ display: "flex", gap: "2rem", marginTop: "1rem" }}>
        <MarginCard title="Blended margin" data={blended} href="/dashboard/margin/blended" />
        <MarginCard title="Real margin" data={real} href="/dashboard/margin/real" />
      </div>

      <h2 style={{ marginTop: "2.5rem" }}>Analytics</h2>
      <p style={{ color: "#666", marginTop: "-0.5rem" }}>
        The same breakdown Flyp shows under Analytics. (Top category and the
        buyer-location map aren&apos;t here — Flyp doesn&apos;t expose real
        category or buyer-location data anywhere we can read it back out.)
      </p>

      <div style={{ display: "grid", gap: "1.25rem", marginTop: "1rem" }}>
        <RevenueProfitChart data={monthlyRows} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
          <MarketplacePieChart data={marketplaceRows} metric="revenue" title="Marketplace revenue" />
          <MarketplacePieChart data={marketplaceRows} metric="profit" title="Marketplace profit" />
          <MarketplaceBarChart data={marketplaceRows} metric="soldCount" title="Items sold by marketplace" format="count" />
          <MarketplaceBarChart data={marketplaceRows} metric="avgSalePrice" title="Avg sale price by marketplace" format="money" />
        </div>
      </div>

      <h2 style={{ marginTop: "2.5rem" }}>Price trends (7-day)</h2>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th>Item</th>
            <th>Avg price today</th>
            <th>7 days ago</th>
            <th>Change</th>
          </tr>
        </thead>
        <tbody>
          {trends.map((t) => (
            <tr key={t.itemId} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td>{t.itemName}</td>
              <td>{fmt(t.currentAveragePrice)}</td>
              <td>{fmt(t.previousAveragePrice)}</td>
              <td>
                {t.direction === "insufficient_data"
                  ? "collecting data"
                  : `${t.direction === "up" ? "▲" : t.direction === "down" ? "▼" : "–"} ${
                      t.changePct?.toFixed(1)
                    }%`}
              </td>
            </tr>
          ))}
          {trends.length === 0 && (
            <tr>
              <td colSpan={4} style={{ color: "#999", padding: "1rem 0" }}>
                No active items yet, or not enough daily snapshots collected
                yet (needs the snapshot-prices worker running for at least
                {" "}
                {7} days).
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function MarginCard({
  title,
  data,
  href,
}: {
  title: string;
  data: Awaited<ReturnType<typeof getMarginBreakdown>>["blended"];
  href: string;
}) {
  return (
    <a
      href={href}
      style={{
        border: "1px solid #e5e5e5",
        borderRadius: 8,
        padding: "1rem",
        flex: 1,
        textDecoration: "none",
        color: "inherit",
        display: "block",
        cursor: "pointer",
        transition: "box-shadow 0.15s, border-color 0.15s",
      }}
    >
      <h3 style={{ marginTop: 0 }}>{title} →</h3>
      <p style={{ fontSize: "2rem", margin: "0.25rem 0" }}>
        {data.marginPct.toFixed(1)}%
      </p>
      <p style={{ color: "#666", margin: 0 }}>
        {data.saleCount} sale{data.saleCount === 1 ? "" : "s"} · ${data.totalProfit.toFixed(2)} profit
      </p>
    </a>
  );
}

function fmt(n: number | null): string {
  return n == null ? "–" : `$${n.toFixed(2)}`;
}
