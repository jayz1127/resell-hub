import { redirect } from "next/navigation";

// Purchases and Sales were merged into one page. This route stays around
// only so old links/bookmarks don't 404.
export default function PurchasesRedirect() {
  redirect("/purchases-sales");
}
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
  // in Inventory too instead of just sitting in Purchases.
  const platform = String(formData.get("platform") || "").trim();
  const priceRaw = String(formData.get("price") || "").trim();
  const price = priceRaw ? parseFloat(priceRaw) : null;
  if (platform && price != null && !Number.isNaN(price)) {
    await prisma.listing.create({
      data: { itemId: item.id, platform: platform as any, price },
    });
  }

  revalidatePath("/purchases");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
}

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
