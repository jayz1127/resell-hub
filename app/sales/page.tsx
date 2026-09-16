import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SalesPage() {
  const sales = await prisma.sale.findMany({
    where: { deletedAt: null },
    include: { item: true },
    orderBy: { soldAt: "desc" },
  });

  return (
    <div>
      <h1>Sales</h1>
      <p style={{ color: "#666" }}>
        Unlike Flyp, you can actually delete a record here. Delete moves it
        to a 30-day trash (in case of a misclick); it disappears from every
        report immediately.
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th>Item</th>
            <th>Platform</th>
            <th>Sale price</th>
            <th>Sold</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td>{s.item.name}</td>
              <td>{s.platform}</td>
              <td>${s.salePrice.toFixed(2)}</td>
              <td>{s.soldAt.toDateString()}</td>
              <td>
                <form action={`/api/sales/${s.id}/delete`} method="post">
                  <button type="submit">Delete</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
