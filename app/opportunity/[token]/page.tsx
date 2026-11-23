import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";
import ProposalView from "@/components/opportunity/ProposalView";
import { createAdminClient } from "@/lib/engine/supabase/admin";
import { readSnapshot } from "@/lib/engine/publish";
import "../opportunity.css";

/**
 * Public proposal (OE-13, docs/referencia/Proposta.html). Reads only the published snapshot by
 * token, never the research. Revoked or expired links answer 410 in the middleware.
 * Always rendered on request, so unpublishing takes effect at once.
 */
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

const load = cache(async (token: string) => readSnapshot(createAdminClient(), token));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const s = await load(token);
  const noindex = { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } };
  if (s.state !== "ok") return { title: { absolute: "Proposal · LoWa Studio" }, robots: noindex };
  const h = await headers();
  const base = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const title = `A proposal for ${s.content.business.name} · LoWa Studio`;
  return {
    metadataBase: new URL(base),
    title: { absolute: title },
    description: s.content.hero.subline,
    robots: noindex,
    alternates: { canonical: null },
    referrer: "no-referrer",
    openGraph: { title, description: s.content.hero.subline, siteName: "LoWa Studio", type: "website", images: [{ url: "/opportunity/og", width: 1200, height: 630, alt: "LoWa Studio" }] },
    twitter: { card: "summary_large_image", title, images: ["/opportunity/og"] },
  };
}

export const viewport: Viewport = { themeColor: "#F7F0E6" };

export default async function PublicProposalPage({ params }: Props) {
  const { token } = await params;
  const s = await load(token);
  if (s.state !== "ok") notFound();
  return <ProposalView c={s.content} preparedAt={s.publishedAt} validUntil={s.expiresAt} />;
}
