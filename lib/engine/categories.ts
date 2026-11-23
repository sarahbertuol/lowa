/** Capture categories (no dependencies, safe for the phone bundle). */
export const CATEGORIES = ["Handmade", "Food & drink", "Boutique", "Services", "Agency", "Other"] as const;
export type Category = (typeof CATEGORIES)[number];
