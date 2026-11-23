/**
 * Service catalog (OE-10). Proposals take prices only from here (docs/ARQUITETURA.md, Preço).
 * No dependencies: the screens and the server both use it.
 */

export const PRICE_TYPES = ["fixed", "from", "monthly", "custom"] as const;
export type PriceType = (typeof PRICE_TYPES)[number];

export const PRICE_TYPE_LABEL: Record<PriceType, string> = {
  fixed: "Fixed",
  from: "Starting at",
  monthly: "Monthly",
  custom: "Custom quote",
};

export type Service = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price_type: PriceType;
  price_cents: number | null;
  extra_page_cents: number | null;
  included_pages: number | null;
  summary: string | null;
  payment_terms: string | null;
  inclusions: string[];
  exclusions: string[];
  delivery: string | null;
  notes: string | null;
  active: boolean;
  sort_order: number;
  updated_at: string;
};

export const SERVICE_COLUMNS =
  "id,slug,name,category,price_type,price_cents,extra_page_cents,included_pages,summary,payment_terms,inclusions,exclusions,delivery,notes,active,sort_order,updated_at";

/** US$ 92000 cents → "$920"; keeps cents only when there are any. */
export function money(cents: number) {
  const whole = cents % 100 === 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD",
    minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2,
  }).format(cents / 100);
}

/** The price as a proposal shows it: "$920", "from $1,200", "$180/mo", "Custom quote". */
export function priceLabel(s: Pick<Service, "price_type" | "price_cents">) {
  if (s.price_type === "custom") return "Custom quote";
  if (s.price_cents == null) return "No price yet";
  const v = money(s.price_cents);
  return s.price_type === "from" ? `from ${v}` : s.price_type === "monthly" ? `${v}/mo` : v;
}

/** "920", "$1,200", "1200.50" → cents. Null when empty; NaN when it isn't a price. */
export function centsFrom(input: string): number | null {
  const t = input.replace(/[$,\s]/g, "");
  if (!t) return null;
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(t)) return Number.NaN;
  return Math.round(Number(t) * 100);
}

/** Cents → what the price field shows ("920", "1200.50"). */
export const priceInput = (cents: number | null) =>
  cents == null ? "" : cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
