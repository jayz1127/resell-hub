import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PLATFORM_COLORS: Record<string, string> = {
  EBAY: "#e53238",
  POSHMARK: "#8f0022",
  MERCARI: "#6a5acd",
  VINTED: "#09b1ba",
  DEPOP: "#ff2300",
};

type ItemWithListings = {
  id: string;
  name: string;
  images: string[];
  listings: { id: string; platform: string; status: string; price: number }[];
};

export default async function InventoryPage() {
  const items = (await prisma.item.findMany({
    where: { status: "ACTIVE" },
    include: { listings: true },
    orderBy: { createdAt: "desc" },
  })) as ItemWithListings[];

  return (
    <div>
      <h1>Active inventory</h1>
      <p style={{ color: "#666" }}>
        Everything currently listed somewhere and not yet sold. Add new
        items from the <a href="/purchases-sales">Purchases/Sales</a> page.
      </p>

      {items.length === 0 && (
        <p style={{ color: "#999" }}>Nothing active yet.</p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "1rem",
          marginTop: "1.5rem",
        }}
      >
        {items.map((item) => {
          const activeListings = item.listings.filter((l) => l.status === "ACTIVE");
          const image = item.images?.[0];
          return (
            <div
              key={item.id}
              style={{
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  aspectRatio: "1 / 1",
                  background: "#f5f5f5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={image}
                    alt={item.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ color: "#bbb", fontSize: "0.85rem" }}>No photo</span>
                )}
              </div>
              <div style={{ padding: "0.75rem", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 600, lineHeight: 1.3 }}>
                  {item.name}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {activeListings.length === 0 && (
                    <span style={{ color: "#999", fontSize: "0.8rem" }}>Not listed anywhere</span>
                  )}
                  {activeListings.map((l) => (
                    <span
                      key={l.id}
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "#fff",
                        background: PLATFORM_COLORS[l.platform] || "#888",
                        padding: "2px 7px",
                        borderRadius: 999,
                      }}
                    >
                      {l.platform}
                    </span>
                  ))}
                </div>
                <div style={{ marginTop: "auto", fontWeight: 600 }}>
                  {activeListings[0] ? `$${activeListings[0].price.toFixed(2)}` : "—"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const items = await prisma.item.findMany({
    where: { status: "ACTIVE" },
    include: { listings: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1>Active inventory</h1>
      <p style={{ color: "#666" }}>
        Add new items from the <a href="/purchases">Purchases</a> page, they show up here once you mark them as listed on a platform.
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th>Item</th>
            <th>Listed on</th>
            <th>Prices</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td>{i.name}</td>
              <td>
                {i.listings
                  .filter((l) => l.status === "ACTIVE")
                  .map((l) => l.platform)
                  .join(", ") || "—"}
              </td>
              <td>
                {i.listings
                  .filter((l) => l.status === "ACTIVE")
                  .map((l) => `${l.platform}: $${l.price.toFixed(2)}`)
                  .join(" · ") || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
