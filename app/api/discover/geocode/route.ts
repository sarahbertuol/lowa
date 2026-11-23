import { NextResponse, type NextRequest } from "next/server";

/**
 * "Use my location": turns the phone's coordinates into "City, ST" with Google Geocoding.
 * Coordinates are never stored. Answers 503 until GOOGLE_PLACES_API_KEY exists (with the
 * Geocoding API enabled on the same key), and the form then asks to type the city.
 */
export async function GET(request: NextRequest) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) return NextResponse.json({ error: "not_configured" }, { status: 503 });

  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("latlng", `${lat.toFixed(4)},${lng.toFixed(4)}`);
  url.searchParams.set("result_type", "locality");
  url.searchParams.set("language", "en");
  url.searchParams.set("key", key);

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000), cache: "no-store" });
    const json = (await res.json()) as { results?: { address_components: { long_name: string; short_name: string; types: string[] }[] }[] };
    const parts = json.results?.[0]?.address_components ?? [];
    const city = parts.find((p) => p.types.includes("locality"))?.long_name;
    const state = parts.find((p) => p.types.includes("administrative_area_level_1"))?.short_name;
    const country = parts.find((p) => p.types.includes("country"))?.short_name;
    if (!city) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const label = country === "US" && state ? `${city}, ${state}` : [city, country].filter(Boolean).join(", ");
    return NextResponse.json({ city: label }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "lookup_failed" }, { status: 502 });
  }
}
