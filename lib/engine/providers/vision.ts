import { z } from "zod";
import { structured } from "./ai";
import type { VisionProvider } from "./types";

/** Reads a business card or storefront photo with Claude vision. What it returns is a suggestion. */

const schema = z.object({
  business_name: z.string().nullable(),
  website: z.string().nullable(),
  instagram: z.string().nullable(),
  facebook: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  address: z.string().nullable(),
  what_it_shows: z.string(),
});

const SYSTEM =
  "You read photos taken by a founder of a web studio: business cards, storefronts, market stalls, flyers, menus. " +
  "Copy only what is clearly printed or written in the photo. Use null for anything not visible or not legible. " +
  "Never guess or complete a website, handle, phone or email. Instagram: the handle without @. " +
  "what_it_shows: one short sentence in American English describing the photo (for example: \"Business card with a phone and an Instagram handle\").";

export const claudeVision: VisionProvider = {
  async readPhotos(images) {
    const content = [
      ...images.map((img) => ({
        type: "image" as const,
        source: { type: "base64" as const, media_type: img.mediaType, data: img.data.toString("base64") },
      })),
      { type: "text" as const, text: images.length > 1 ? "These photos show the same business. Read them together." : "Read this photo." },
    ];
    const { data, usage } = await structured(schema, { system: SYSTEM, content, maxTokens: 4000 });
    return { reading: data, usage };
  },
};
