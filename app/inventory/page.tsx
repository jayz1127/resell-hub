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
