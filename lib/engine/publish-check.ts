import type { SupabaseClient } from "@supabase/supabase-js";
import { SERVICE_COLUMNS, type Service } from "@/lib/engine/catalog";
import { buildInvestment, serviceProblem } from "@/lib/engine/investment";
import { copyCheck, pendingItems, type ProposalContent } from "@/lib/engine/proposal";
import { loadAssessment } from "@/lib/engine/research/confidence";
import { TEMPLATE_LABEL, type Template } from "@/lib/engine/research/insights";
import { toPublic, type PublicProposal } from "@/lib/engine/publish";

/**
 * What would be published (OE-14), and why it can't be yet. One function for the preview, the
 * Publish button and the server action, so the three always agree. The price is taken from the
 * catalog at this moment; the snapshot then freezes it.
 */

export type PublishCheck = {
  proposal: { id: string; version: number; template: Template; serviceSlug: string };
  publicContent: PublicProposal;
  /** Reasons publishing is blocked. Empty means it can be published. */
  blocked: string[];
  /** Text still in [brackets]: published as pending, shown in the confirmation. */
  pending: string[];
};

export async function checkPublish(db: SupabaseClient, oppId: string, version?: number): Promise<PublishCheck | null> {
  const [{ data: o }, { data: rows }, { data: a }, { data: services }] = await Promise.all([
    db.from("opportunities").select("id,name,city,status,identity_confirmed").eq("id", oppId).maybeSingle(),
    (version ? db.from("proposals").select("id,version,template,service_slug,extra_pages,content").eq("opportunity_id", oppId).eq("version", version)
      : db.from("proposals").select("id,version,template,service_slug,extra_pages,content").eq("opportunity_id", oppId).order("version", { ascending: false })).limit(1),
    db.from("analyses").select("service_slug,template").eq("opportunity_id", oppId).order("version", { ascending: false }).limit(1).maybeSingle(),
    db.from("services").select(SERVICE_COLUMNS),
  ]);
  const p = rows?.[0];
  if (!o || !p) return null;
  const catalog = (services ?? []) as Service[];
  const service = catalog.find((s) => s.slug === p.service_slug);
  const stored = p.content as ProposalContent;
  const blocked: string[] = [];

  const level = (await loadAssessment(db, oppId, o.identity_confirmed)).level;
  if (level === "low" || o.status === "needs_verification") blocked.push("Confirm which business this is before publishing.");

  const sp = serviceProblem(service);
  if (sp) blocked.push(sp);
  const content: ProposalContent = service && !sp
    ? { ...stored, recommendation: { ...stored.recommendation, service: service.name }, investment: buildInvestment(service, p.extra_pages, catalog).investment }
    : stored;

  if (a && a.service_slug !== p.service_slug) {
    const now = catalog.find((s) => s.slug === a.service_slug)?.name ?? "another service";
    blocked.push(`The draft offers ${service?.name ?? "an old service"}, but the recommendation is now ${now}. Regenerate the draft.`);
  }
  if (a && a.template !== p.template) {
    blocked.push(`The draft was written for ${TEMPLATE_LABEL[p.template as Template]}, but the template is now ${TEMPLATE_LABEL[a.template as Template]}. Regenerate the draft.`);
  }
  const issues = copyCheck(content);
  if (issues.length) blocked.push(`Fix the ${issues.length} copy issue${issues.length > 1 ? "s" : ""} in the draft first.`);

  return {
    proposal: { id: p.id, version: p.version, template: p.template as Template, serviceSlug: p.service_slug },
    publicContent: toPublic(content, { name: o.name, city: o.city }, p.template as Template),
    blocked,
    pending: pendingItems(content),
  };
}
