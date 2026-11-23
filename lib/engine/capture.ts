import { z } from "zod";

/** Capture form (OE-04): shared by the phone (validation, offline queue) and the API. */

import { CATEGORIES } from "./categories";
export { CATEGORIES };

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : undefined));

export const captureSchema = z.object({
  client_ref: z.uuid(),
  captured_at: z.iso.datetime({ offset: true }).optional(),
  name: z.string().trim().min(1, "Add the business name").max(160),
  city: z.string().trim().min(1, "Add the city").max(120),
  found_via: z.enum(["in_person", "online"]).optional(),
  website: optionalText(300).transform((v) => (v ? normalizeWebsite(v) : undefined)),
  instagram: optionalText(80).transform((v) => (v ? normalizeInstagram(v) : undefined)),
  category: z.enum(CATEGORIES).optional(),
  contact_name: optionalText(120),
  found_at: optionalText(160),
  observation: optionalText(2000),
});

export type CaptureInput = z.input<typeof captureSchema>;
export type Capture = z.output<typeof captureSchema>;

/** "example.com" or "http://example.com/" become "https://example.com". */
export function normalizeWebsite(raw: string): string {
  const v = raw.trim().replace(/\s+/g, "");
  const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  return withProto.replace(/\/+$/, "");
}

/** "@handle", "instagram.com/handle/" or "handle" become "handle". */
export function normalizeInstagram(raw: string): string {
  const v = raw.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "");
  return v.split(/[/?#\s]/)[0];
}

/** Capture time sent by the phone is kept only if it's plausible (offline captures sync later). */
export function plausibleCaptureTime(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const t = Date.parse(iso);
  const now = Date.now();
  return t <= now + 5 * 60_000 && t >= now - 30 * 86_400_000 ? new Date(t).toISOString() : undefined;
}
