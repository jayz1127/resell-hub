import { Platform } from "@prisma/client";

/**
 * TODO before going live: open your own inbox, find one real
 * sale-confirmation email from each platform, and confirm the sender
 * address and a reliable subject-line pattern. These are reasonable
 * starting guesses, not verified against your actual account, since I
 * can't see your inbox until Gmail access is wired up and you've had a
 * real sale to check against.
 */
export const SALE_EMAIL_PATTERNS: Record<
  Platform,
  { from: string; subjectContains: string[] }
> = {
  EBAY: {
    from: "ebay@ebay.com",
    subjectContains: ["Your item sold", "You sold"],
  },
  POSHMARK: {
    from: "noreply@poshmark.com",
    subjectContains: ["Sold!", "You sold"],
  },
  MERCARI: {
    from: "no-reply@mercari.com",
    subjectContains: ["sold", "Your item has sold"],
  },
  VINTED: {
    from: "no-reply@vinted.com",
    subjectContains: ["sold your item", "has sold"],
  },
  DEPOP: {
    from: "no-reply@depop.com",
    subjectContains: ["sold", "You made a sale"],
  },
};

export const PROCESSED_LABEL = "ResellHub/Processed";
