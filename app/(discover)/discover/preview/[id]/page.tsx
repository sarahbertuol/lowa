import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createUserClient } from "@/lib/engine/supabase/server";
import { checkPublish } from "@/lib/engine/publish-check";
import ProposalView from "@/components/opportunity/ProposalView";
import "../../../../opportunity/opportunity.css";

/**
 * Proposal preview (OE-14): the page exactly as it would be published now, with the catalog price
 * of this moment. Only for the team (signed in, never indexed). ?v= shows an earlier version.
 */

export const metadata: Metadata = { title: "Proposal preview" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ v?: string }> };

export default async function ProposalPreview({ params, searchParams }: Props) {
  const { id } = await params;
  const { v } = await searchParams;
  if (!UUID.test(id)) notFound();
  const supabase = await createUserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/discover/login");
  const version = v && /^\d{1,4}$/.test(v) ? Number(v) : undefined;
  const check = await checkPublish(supabase, id, version);
  if (!check) notFound();

  return (
    <>
      <div className="dx-preview-bar" role="note">
        <a className="dx-back" href={`/discover/o/${id}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>
          Back
        </a>
        <span className="mono">Preview · v{check.proposal.version} · {check.blocked.length ? "can't publish yet" : "not published"}</span>
      </div>
      <ProposalView c={check.publicContent} preparedAt={new Date().toISOString()} validUntil={null} />
    </>
  );
}
