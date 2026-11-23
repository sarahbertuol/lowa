import { googleKey } from "@/lib/engine/env";
import type { Place, PlacesProvider } from "./types";

/**
 * Google Places API (New), Text Search. Official source for the Google profile: name, address,
 * phone, website, rating and Maps link. Up to 3 candidates.
 * The fields asked for (phone, website, rating) are in the Enterprise tier, which has a free
 * monthly allowance; the key has a daily limit in Google Cloud.
 */

const FIELDS = [
  "places.id", "places.displayName", "places.formattedAddress", "places.addressComponents",
  "places.nationalPhoneNumber", "places.websiteUri", "places.rating", "places.userRatingCount",
  "places.googleMapsUri", "places.businessStatus", "places.primaryTypeDisplayName",
].join(",");

type Raw = {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  addressComponents?: { longText?: string; shortText?: string; types?: string[] }[];
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  businessStatus?: string;
  primaryTypeDisplayName?: { text?: string };
};

export class PlacesNotConfigured extends Error {}

export const googlePlaces: PlacesProvider = {
  async search(query) {
    const key = googleKey();
    if (!key) throw new PlacesNotConfigured("GOOGLE_PLACES_API_KEY is not set.");

    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: { "content-type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELDS },
      body: JSON.stringify({ textQuery: query, pageSize: 3, regionCode: "us", languageCode: "en" }),
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: { status?: string } } | null;
      throw new Error(`Google Places ${res.status}${body?.error?.status ? ` ${body.error.status}` : ""}`);
    }
    const json = (await res.json()) as { places?: Raw[] };

    const places: Place[] = (json.places ?? []).slice(0, 3).map((p) => {
      const part = (t: string) => p.addressComponents?.find((c) => c.types?.includes(t));
      return {
        id: p.id,
        name: p.displayName?.text ?? "",
        address: p.formattedAddress ?? null,
        city: part("locality")?.longText ?? part("postal_town")?.longText ?? part("sublocality")?.longText ?? null,
        state: part("administrative_area_level_1")?.shortText ?? null,
        phone: p.nationalPhoneNumber ?? null,
        website: p.websiteUri ?? null,
        rating: p.rating ?? null,
        reviews: p.userRatingCount ?? null,
        mapsUrl: p.googleMapsUri ?? null,
        status: p.businessStatus ?? null,
        type: p.primaryTypeDisplayName?.text ?? null,
      };
    });
    return { places, usage: { placesCalls: 1 } };
  },
};
