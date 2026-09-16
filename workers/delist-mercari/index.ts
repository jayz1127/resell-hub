import { chromium } from "playwright";
import type { DelistResult } from "../platformDelist";

/**
 * Same approach and same caveats as delist-poshmark/index.ts — Mercari
 * explicitly does not offer a public developer API, so this is browser
 * automation against https://www.mercari.com/us/item/{externalId}, with
 * the same ban-risk and maintenance tradeoffs. Stubbed pending real
 * selectors tested against a live account.
 */
export async function delistMercariListing(externalId: string): Promise<DelistResult> {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({
      storageState: process.env.MERCARI_SESSION_STATE_PATH,
    });
    const page = await context.newPage();
    await page.goto(`https://www.mercari.com/us/item/${externalId}/`);

    // TODO: real "stop selling" / delete flow selectors.
    return { ok: false, detail: "Mercari automation not yet implemented — delist manually" };
  } catch (err) {
    return { ok: false, detail: String(err) };
  } finally {
    await browser.close();
  }
}
