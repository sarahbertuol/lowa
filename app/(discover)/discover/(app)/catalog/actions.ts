"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createUserClient } from "@/lib/engine/supabase/server";
import { PRICE_TYPES, centsFrom } from "@/lib/engine/catalog";

/**
 * Catalog edits (OE-10). Run as the signed-in user (row level security: team only).
 * The slug never changes: analyses and proposals point to it. A service is never deleted,
 * only made inactive, so published proposals keep their frozen price (proposal_snapshots).
 */

export type SaveResult = { ok: true; updatedAt: string } | { ok: false; error: string; field?: string };

const DASH = /[\u2014\u2013]/;
const text = (max: number) => z.string().trim().max(max);
const items = z.array(text(160)).max(20);

const schema = z.object({
  id: z.uuid(),
  name: text(80).min(1, "Add a name."),
  priceType: z.enum(PRICE_TYPES),
  price: z.string().max(20),
  extraPage: z.string().max(20),
  includedPages: z.string().max(3),
  summary: text(240),
  payment: text(240),
  delivery: text(160),
  notes: text(600),
  inclusions: items,
  exclusions: items,
  active: z.boolean(),
  /** updated_at the form was opened with: a newer save in between wins, and the form says so. */
  updatedAt: z.string(),
});

export type ServiceInput = z.infer<typeof schema>;

async function client() {
  const supabase = await createUserClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user ? supabase : null;
}

export async function saveService(input: ServiceInput): Promise<SaveResult> {
  const p = schema.safeParse(input);
  if (!p.success) {
    const i = p.error.issues[0];
    return { ok: false, error: i?.message && !i.message.startsWith("Invalid") ? i.message : "Check the fields and try again.", field: String(i?.path[0] ?? "") };
  }
  const v = p.data;

  const words = [v.name, v.summary, v.payment, v.delivery, v.notes, ...v.inclusions, ...v.exclusions];
  if (words.some((w) => DASH.test(w))) return { ok: false, error: "Use a comma or a colon instead of a long dash." };

  const price = centsFrom(v.price);
  if (Number.isNaN(price)) return { ok: false, error: "Write the price as a number, like 920 or 1200.", field: "price" };
  const extra = centsFrom(v.extraPage);
  if (Number.isNaN(extra)) return { ok: false, error: "Write the extra page price as a number, like 250.", field: "extraPage" };
  const pages = v.includedPages.trim() ? Number(v.includedPages) : null;
  if (pages != null && (!Number.isInteger(pages) || pages < 1 || pages > 99)) return { ok: false, error: "Pages included: a whole number from 1 to 99.", field: "includedPages" };
  if (v.priceType !== "custom" && v.active && price == null) {
    return { ok: false, error: "Add a price, or turn the service off until it has one.", field: "price" };
  }

  const db = await client();
  if (!db) return { ok: false, error: "Sign in again to save." };

  const { data, error } = await db.from("services").update({
    name: v.name,
    price_type: v.priceType,
    price_cents: v.priceType === "custom" ? null : price,
    extra_page_cents: v.priceType === "custom" ? null : extra,
    included_pages: pages,
    summary: v.summary || null,
    payment_terms: v.payment || null,
    delivery: v.delivery || null,
    notes: v.notes || null,
    inclusions: v.inclusions.filter(Boolean),
    exclusions: v.exclusions.filter(Boolean),
    active: v.active,
  }).eq("id", v.id).eq("updated_at", v.updatedAt).select("updated_at").maybeSingle();

  if (error) return { ok: false, error: "Couldn't save. Try again." };
  if (!data) return { ok: false, error: "Someone saved this service in the meantime. Reload to see the latest, then edit again." };
  revalidatePath("/discover/catalog");
  return { ok: true, updatedAt: data.updated_at };
}

/** "Add service": a new inactive service, custom quote, ready to edit. Returns its slug. */
export async function addService(): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const db = await client();
  if (!db) return { ok: false, error: "Sign in again to add a service." };
  const { data: last } = await db.from("services").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const slug = `service-${Date.now().toString(36)}`;
  const { error } = await db.from("services").insert({
    slug, name: "New service", category: "other", price_type: "custom", active: false,
    sort_order: Math.min(32000, (last?.sort_order ?? 0) + 10),
  });
  if (error) return { ok: false, error: "Couldn't add a service. Try again." };
  revalidatePath("/discover/catalog");
  return { ok: true, slug };
}
