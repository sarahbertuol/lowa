import { money, type Service } from "./catalog";

/**
 * Price of a suggested service (OE-11). Computed only here, from the catalog row: the AI gives
 * the service id and, for services sold by page, how many extra pages. No dependencies.
 */

export type Quote = {
  /** Total in cents; null for a custom quote or a service without a price yet. */
  totalCents: number | null;
  /** What a proposal shows: "$920", "from $1,450", "$180/mo", "Custom quote". */
  label: string;
  /** How the total was reached, one line per part. Empty for a single price. */
  lines: string[];
  extraPages: number;
};

type Priced = Pick<Service, "price_type" | "price_cents" | "extra_page_cents" | "included_pages">;

export function quote(s: Priced, extraPages = 0): Quote {
  if (s.price_type === "custom") return { totalCents: null, label: "Custom quote", lines: [], extraPages: 0 };
  if (s.price_cents == null) return { totalCents: null, label: "No price yet", lines: [], extraPages: 0 };

  const extra = s.extra_page_cents != null ? Math.max(0, Math.min(20, Math.trunc(extraPages))) : 0;
  const total = s.price_cents + extra * (s.extra_page_cents ?? 0);
  const v = money(total);
  const label = s.price_type === "from" ? `from ${v}` : s.price_type === "monthly" ? `${v}/mo` : v;
  const lines = extra > 0
    ? [
      `${s.included_pages ? `${s.included_pages} pages` : "Base"}: ${money(s.price_cents)}`,
      `${extra} extra page${extra > 1 ? "s" : ""} at ${money(s.extra_page_cents!)}: ${money(extra * s.extra_page_cents!)}`,
    ]
    : [];
  return { totalCents: total, label, lines, extraPages: extra };
}
