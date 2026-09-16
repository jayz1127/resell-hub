/**
 * Real, ToS-compliant eBay auto-delist using eBay's official Sell/
 * Inventory API. No browser, no login automation, no risk — this is the
 * one platform where "automatic" means what it should mean.
 *
 * Setup (see SETUP.md):
 *   1. Create a free eBay developer account at developer.ebay.com
 *   2. Create a "Production" keyset for your own eBay seller account
 *   3. Complete the OAuth user-consent flow once to get a refresh token
 *      (long-lived, ~18 months) — eBay's docs call this "User Access Token"
 *   4. Store EBAY_CLIENT_ID, EBAY_CLIENT_SECRET, EBAY_REFRESH_TOKEN as
 *      GitHub Actions secrets.
 *
 * This module exposes one function: delistEbayOffer(offerId). Call it
 * from the Gmail watcher whenever an item sells elsewhere and is also
 * live on eBay.
 */

const EBAY_ENV = process.env.EBAY_ENV === "sandbox"
  ? "https://api.sandbox.ebay.com"
  : "https://api.ebay.com";

async function getAccessToken(): Promise<string> {
  const clientId = requireEnv("EBAY_CLIENT_ID");
  const clientSecret = requireEnv("EBAY_CLIENT_SECRET");
  const refreshToken = requireEnv("EBAY_REFRESH_TOKEN");

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(`${EBAY_ENV}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      scope: "https://api.ebay.com/oauth/api_scope/sell.inventory",
    }),
  });

  if (!res.ok) {
    throw new Error(`eBay token refresh failed: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as { access_token: string };
  return json.access_token;
}

/**
 * Ends an active eBay offer (listing) by its offerId — the field stored
 * on Listing.externalId when the listing was first cross-listed.
 * Idempotent: eBay returns 404 if it's already gone, which we treat as
 * success rather than an error worth alerting on.
 */
export async function delistEbayOffer(offerId: string): Promise<{ ok: boolean; detail: string }> {
  const token = await getAccessToken();

  const res = await fetch(`${EBAY_ENV}/sell/inventory/v1/offer/${offerId}/withdraw`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 404) {
    return { ok: true, detail: "already delisted" };
  }
  if (!res.ok) {
    return { ok: false, detail: `${res.status} ${await res.text()}` };
  }
  return { ok: true, detail: "withdrawn" };
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var ${name}`);
  return v;
}
