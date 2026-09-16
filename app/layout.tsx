import type { ReactNode } from "react";

export const metadata = {
  title: "Resell Hub",
  description: "Purchases, sales, real margins, and price trends across every platform.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <nav
          style={{
            display: "flex",
            gap: "1.5rem",
            padding: "1rem 1.5rem",
            borderBottom: "1px solid #e5e5e5",
          }}
        >
          <a href="/dashboard">Dashboard</a>
          <a href="/inventory">Inventory</a>
          <a href="/purchases">Purchases</a>
          <a href="/sales">Sales</a>
        </nav>
        <main style={{ padding: "1.5rem", maxWidth: 960, margin: "0 auto" }}>
          {children}
        </main>
      </body>
    </html>
  );
}
