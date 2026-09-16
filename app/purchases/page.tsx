import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PurchasesPage() {
  const items = await prisma.item.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1>Purchases</h1>
      <p style={{ color: "#666" }}>
        Flyp only tracks sales. Every item here logs what you paid (or that
        it was a hand-me-down with no cost), which is what makes the real
        margin number on the dashboard possible.
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th>Item</th>
            <th>Source</th>
            <th>Cost basis</th>
            <th>Acquired</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td>{i.name}</td>
              <td>{i.sourceType === "HAND_ME_DOWN" ? "Hand-me-down" : "Purchased"}</td>
              <td>{i.costBasis != null ? `$${i.costBasis.toFixed(2)}` : "—"}</td>
              <td>{i.acquiredAt ? i.acquiredAt.toDateString() : "—"}</td>
              <td>{i.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
