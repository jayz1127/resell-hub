import { chromium } from "playwright";
import type { DelistResult } from "../platformDelist";

/**
 * Depop has a Selling API, but as of writing it's private/invite-only
 * and appears aimed at larger pro sellers — worth applying for
 * (partnerapi.depop.com), but don't assume approval. Until/unless that
 * comes through, this falls back to browser automation against
 * https://www.depop.com/products/{externalId}, with the same ban-risk
 * and maintenance caveats as the other stubs.
 */
export async function delistDepopListing(externalId: string): Promise<DelistResult> {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      storageState: process.env.DEPOP_SESSION_STATE_PATH,
    });
    const page = await context.newPage();
    await page.goto(`https://www.depop.com/products/${externalId}/`);

    // TODO: real delete-listing selectors.
    return { ok: false, detail: "Depop automation not yet implemented — delist manually" };
  } catch (err) {
    return { ok: false, detail: String(err) };
  } finally {
    await browser.close();
  }
}
