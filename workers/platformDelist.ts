import { Platform } from "@prisma/client";
import { delistPoshmarkListing } from "./delist-poshmark";
import { delistMercariListing } from "./delist-mercari";
import { delistVintedListing } from "./delist-vinted";
import { delistDepopListing } from "./delist-depop";

export interface DelistResult {
  ok: boolean;
  detail: string;
}

/**
 * Single entry point the Gmail watcher calls for the four platforms with
 * no safe API. Each of these drives a real logged-in browser session
 * (Playwright) to click delist — see the ToS note in ARCHITECTURE.md
 * before relying on this for anything you can't afford to lose an
 * account over.
 */
export async function delistOnPlatform(
  platform: Platform,
  externalId: string | null
): Promise<DelistResult> {
  if (!externalId) {
    return { ok: false, detail: "no externalId stored for this listing" };
  }

  switch (platform) {
    case "POSHMARK":
      return delistPoshmarkListing(externalId);
    case "MERCARI":
      return delistMercariListing(externalId);
    case "VINTED":
      return delistVintedListing(externalId);
    case "DEPOP":
      return delistDepopListing(externalId);
    default:
      return { ok: false, detail: `no automation implemented for ${platform}` };
  }
}
