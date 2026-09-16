import { chromium } from "playwright";
import type { DelistResult } from "../platformDelist";

/**
 * Vinted does have a real API (Vinted Pro Integrations), but it's
 * allowlisted only to approved Pro/business accounts, not individual
 * casual sellers — so this falls back to the same browser-automation
 * approach as Poshmark/Mercari, against
 * https://www.vinted.com/items/{externalId}, with the same caveats.
 */
export async function delistVintedListing(externalId: string): Promise<DelistResult> {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      storageState: process.env.VINTED_SESSION_STATE_PATH,
    });
    const page = await context.newPage();
    await page.goto(`https://www.vinted.com/items/${externalId}`);

    // TODO: real delete-listing selectors.
    return { ok: false, detail: "Vinted automation not yet implemented — delist manually" };
  } catch (err) {
    return { ok: false, detail: String(err) };
  } finally {
    await browser.close();
  }
}
