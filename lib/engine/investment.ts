import { money, type Service } from "@/lib/engine/catalog";
import { quote } from "@/lib/engine/pricing";
import type { ProposalContent } from "@/lib/engine/proposal";

/**
 * The Investment block of a proposal, built only from the catalog (OE-12, OE-14). Used when the
 * draft is written and again at publish time, so a published proposal shows the catalog price of
 * that moment (then frozen in the snapshot).
 */
export function buildInvestment(service: Service, extraPages: number, catalog: Service[]) {
  const q = quote(service, extraPages);
  const unit = service.price_type === "fixed" ? "one time" : service.price_type === "monthly" ? "a month" : "";
  const note = service.price_type === "custom"
    ? "We scope it with you first, then send a fixed quote before any work starts."
    : q.lines.length
      ? `${q.lines.join(", ")}.${service.price_type === "from" ? " Final scope agreed before we start." : ""}`
      : service.price_type === "from" ? "Final scope agreed before we start." : "";
  const care = catalog.find((s) => s.slug === "maintenance" && s.active);
  const investment: ProposalContent["investment"] = {
    label: q.label,
    unit,
    note,
    payment: service.payment_terms ?? "[payment terms]",
    delivery: service.delivery ?? "[delivery time]",
    notIncluded: service.exclusions,
    care: service.category === "website" && care?.price_cents != null
      ? `Optional care plan: ${money(care.price_cents)} a month${care.summary ? ` (${care.summary.replace(/\.$/, "").toLowerCase()})` : ""}.`
      : null,
  };
  return { investment, extraPages: q.extraPages };
}

/** Why a service can't be offered right now, or null. */
export function serviceProblem(service: Service | undefined) {
  if (!service) return "The service in this draft is no longer in the catalog. Change the service and regenerate the draft.";
  if (!service.active) return `${service.name} is turned off in the catalog. Change the service and regenerate the draft.`;
  if (service.price_type !== "custom" && service.price_cents == null) return `${service.name} has no price yet. Set it in the catalog.`;
  return null;
}
