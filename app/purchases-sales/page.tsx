import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function createItem(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const brand = String(formData.get("brand") || "").trim() || null;
  const category = String(formData.get("category") || "").trim() || null;
  const notes = String(formData.get("notes") || "").trim() || null;

  // No cost entered = hand-me-down (no cost basis). Any cost entered =
  // a real purchase, which is what makes the "real margin" number work.
  const costBasisRaw = String(formData.get("costBasis") || "").trim();
  const costBasis = costBasisRaw ? parseFloat(costBasisRaw) : null;
  const sourceType =
    costBasis != null && !Number.isNaN(costBasis) ? "PURCHASED" : "HAND_ME_DOWN";

  const acquiredAtRaw = String(formData.get("acquiredAt") || "").trim();
  const acquiredAt = acquiredAtRaw ? new Date(acquiredAtRaw) : new Date();

  const item = await prisma.item.create({
    data: {
      name,
      brand,
      category,
      notes,
      sourceType,
      costBasis: sourceType === "PURCHASED" ? costBasis : null,
      acquiredAt,
    },
  });

  // Optional: log it as listed on a platform right away, so it shows up
  // in Inventory too instead of just sitting here as an unlisted purchase.
  const platform = String(formData.get("platform") || "").trim();
  const priceRaw = String(formData.get("price") || "").trim();
  const price = priceRaw ? parseFloat(priceRaw) : null;
  if (platform && price != null && !Number.isNaN(price)) {
    await prisma.listing.create({
      data: { itemId: item.id, platform: platform as any, price },
    });
  }

  revalidatePath("/purchases-sales");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  revalidatePath("/data");
}

export default async function PurchasesSalesPage() {
  const items = await prisma.item.findMany({
    include: { sales: { where: { deletedAt: null }, orderBy: { soldAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });

  // One row per sale, plus one row for any item with zero sales so far.
  type Row = {
    key: string;
    itemName: string;
    sourceType: string;
    costBasis: number | null;
    acquiredAt: Date | null;
    sale: (typeof items)[number]["sales"][number] | null;
  };
  const rows: Row[] = [];
  for (const item of items) {
    if (item.sales.length === 0) {
      rows.push({
        key: item.id,
        itemName: item.name,
        sourceType: item.sourceType,
        costBasis: item.costBasis,
        acquiredAt: item.acquiredAt,
        sale: null,
      });
    } else {
      for (const sale of item.sales) {
        rows.push({
          key: sale.id,
          itemName: item.name,
          sourceType: item.sourceType,
          costBasis: item.costBasis,
          acquiredAt: item.acquiredAt,
          sale,
        });
      }
    }
  }

  return (
    <div>
      <h1>Purchases / Sales</h1>
      <p style={{ color: "#666" }}>
        Everything you&apos;ve bought (or been given), and — if it sold —
        what it sold for, back to back. Unsold items just show as purchased.
        Unlike Flyp, you can delete a sale record here: it moves to a 30-day
        trash and disappears from every report immediately.
      </p>

      <form
        action={createItem}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(200px, 1fr))",
          gap: "0.75rem",
          maxWidth: 700,
          margin: "1.5rem 0",
          padding: "1rem",
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          Item name*
          <input name="name" required style={{ padding: 6 }} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          Brand
          <input name="brand" style={{ padding: 6 }} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          Category
          <input name="category" style={{ padding: 6 }} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          What you paid (leave blank if hand-me-down)
          <input name="costBasis" type="number" step="0.01" min="0" style={{ padding: 6 }} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          Date acquired
          <input name="acquiredAt" type="date" style={{ padding: 6 }} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          Notes
          <input name="notes" style={{ padding: 6 }} />
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          Listed on (optional)
          <select name="platform" defaultValue="" style={{ padding: 6 }}>
            <option value="">Not listed yet</option>
            <option value="EBAY">eBay</option>
            <option value="POSHMARK">Poshmark</option>
            <option value="MERCARI">Mercari</option>
            <option value="VINTED">Vinted</option>
            <option value="DEPOP">Depop</option>
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          Listing price (if listed)
          <input name="price" type="number" step="0.01" min="0" style={{ padding: 6 }} />
        </label>
        <button
          type="submit"
          style={{
            gridColumn: "1 / -1",
            padding: "0.6rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Add item
        </button>
      </form>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.92rem" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th>Item</th>
            <th>Source</th>
            <th>Cost basis</th>
            <th>Acquired</th>
            <th>Sold on</th>
            <th>Sale price</th>
            <th>Sold date</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} style={{ borderBottom: "1px solid #f0f0f0" }}>
              <td>{r.itemName}</td>
              <td>{r.sourceType === "HAND_ME_DOWN" ? "Hand-me-down" : "Purchased"}</td>
              <td>{r.costBasis != null ? `$${r.costBasis.toFixed(2)}` : "—"}</td>
              <td>{r.acquiredAt ? r.acquiredAt.toDateString() : "—"}</td>
              {r.sale ? (
                <>
                  <td>{r.sale.platform}</td>
                  <td>${r.sale.salePrice.toFixed(2)}</td>
                  <td>{r.sale.soldAt.toDateString()}</td>
                  <td>
                    <form action={`/api/sales/${r.sale.id}/delete`} method="post">
                      <button type="submit">Delete</button>
                    </form>
                  </td>
                </>
              ) : (
                <>
                  <td style={{ color: "#999" }}>Purchased</td>
                  <td style={{ color: "#999" }}>—</td>
                  <td style={{ color: "#999" }}>—</td>
                  <td></td>
                </>
              )}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} style={{ color: "#999", padding: "1rem 0" }}>
                Nothing logged yet — add your first item above.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
