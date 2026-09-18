import { redirect } from "next/navigation";

// Purchases and Sales were merged into one page. This route stays around
// only so old links/bookmarks don't 404.
export default function PurchasesRedirect() {
  redirect("/purchases-sales");
}
