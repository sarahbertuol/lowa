import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { structured } from "@/lib/engine/providers/ai";
import type { ProposalContent } from "@/lib/engine/proposal";
import { LINK, type Kind } from "@/lib/engine/messages";

/**
 * Writes the three outreach messages with the draft (OE-15). Short, personal, American English.
 * The proposal link goes in as {link} and is filled in once the proposal is published.
 * A message the founder edited is never overwritten. Nothing is sent: the founder copies it.
 */

const dash = (s: string) => s.replace(/[ \t]*[—–][ \t]*/g, ", ").replace(/[ \t]+/g, " ").trim();

export async function writeMessages(db: SupabaseClient, oppId: string, content: ProposalContent) {
  const { data: o } = await db.from("opportunities")
    .select("name,city,category,found_via,found_at,contact_name,observation,created_by").eq("id", oppId).maybeSingle();
  if (!o) return null;

  // Signed by whoever captured it (team_members), or the studio.
  let sender = "";
  if (o.created_by) {
    const { data: u } = await db.auth.admin.getUserById(o.created_by);
    const email = u?.user?.email?.toLowerCase();
    if (email) sender = (await db.from("team_members").select("name").eq("email", email).maybeSingle()).data?.name ?? "";
  }
  // A team entry named after the studio itself is not a person: sign as the team.
  const first = /lowa/i.test(sender) ? "" : sender.split(/\s+/)[0] || "";
  const signature = first ? `${first}, LoWa Studio` : "The LoWa Studio team";
  const metInPerson = o.found_via === "in_person";

  const schema = z.object({
    personal: z.string(),
    instagram_dm: z.string(),
    email_subject: z.string(),
    email_body: z.string(),
  });

  const ex = await structured(schema, {
    maxTokens: 2500,
    system: [
      "You write three short outreach messages from a small US web studio (LoWa Studio) to one local business owner. The founder copies them by hand; nothing is sent automatically.",
      `Every message that shares the proposal must contain the exact text ${LINK} once, on its own line, where the link goes.`,
      "personal: a friendly follow-up after meeting the owner in person. 50 to 90 words. Mention where you met if given. Then one sentence on the idea, then the link, then a no-pressure close, then the signature." + (metInPerson ? "" : " (They were found online: still write it, it is only shown if they meet.)"),
      "instagram_dm: a first DM that asks permission before sending anything. 30 to 60 words. One specific, true detail about the business, one sentence on who we are, then ask if it is okay to send a short one-page idea. No link and no signature.",
      "email_subject: under 8 words, specific to them, no hype. email_body: 60 to 110 words: greeting (use the contact's first name if given, else \"Hi there\"), who we are in one line, one specific detail, the idea in one sentence, the link, a line saying they can just reply if it isn't useful and we won't follow up, then the signature.",
      `Signature, exactly: ${signature}`,
      "Rules: only facts from the proposal text below. No prices, no dollar amounts, no promised results, no guarantees, no flattery you can't back up. No long dashes (use commas, colons or parentheses), no emojis, no hype words. Warm, plain, short sentences. Never mention internal notes, research, confidence or how we found their details.",
    ].join("\n"),
    content: [
      `Business: ${o.name}, ${o.city}${o.category ? ` (${o.category})` : ""}.`,
      o.contact_name ? `Contact name: ${o.contact_name}.` : "No contact name.",
      metInPerson ? `Met in person${o.found_at ? ` at ${o.found_at}` : ""}.` : `Found online${o.found_at ? ` (${o.found_at})` : ""}.`,
      metInPerson && o.observation ? `What the founder remembers from the meeting (use at most one detail the owner would recognize): ${o.observation}` : "",
      "",
      `Proposal headline: ${content.hero.headline}`,
      `Proposal summary: ${content.hero.subline} ${content.opportunity.body.join(" ")}`,
      `Recommendation: ${content.recommendation.service}. ${content.recommendation.description}`,
    ].filter((l) => l !== "").join("\n"),
  });
  const m = ex.data;
  const withLink = (s: string) => (s.includes(LINK) ? s : `${s.trim()}\n\n${LINK}`);
  const bodies: Record<Kind, string> = {
    personal: withLink(dash(m.personal)),
    instagram_dm: dash(m.instagram_dm).split(LINK).join("").trim(),
    email: `Subject: ${dash(m.email_subject)}\n\n${withLink(dash(m.email_body))}`,
  };

  // Keep what the founder edited; replace the rest.
  const { data: existing } = await db.from("outreach_messages").select("kind,edited").eq("opportunity_id", oppId);
  const edited = new Set((existing ?? []).filter((r) => r.edited).map((r) => r.kind));
  const rows = (Object.keys(bodies) as Kind[]).filter((k) => !edited.has(k))
    .map((kind) => ({ opportunity_id: oppId, kind, body: bodies[kind], edited: false, copied_at: null }));
  if (rows.length) {
    const { error } = await db.from("outreach_messages").upsert(rows, { onConflict: "opportunity_id,kind" });
    if (error) throw new Error(`messages: ${error.message}`);
  }
  return { usage: ex.usage, kept: edited.size };
}
