import { NextResponse, type NextRequest } from "next/server";
import { createUserClient } from "@/lib/engine/supabase/server";

/** Possible duplicates: similar name in the same city (pg_trgm). Warning only, never blocks. */
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name")?.trim() ?? "";
  const city = request.nextUrl.searchParams.get("city")?.trim() ?? "";
  if (name.length < 2 || city.length < 2 || name.length > 160 || city.length > 120) {
    return NextResponse.json({ matches: [] });
  }
  const supabase = await createUserClient();
  const { data, error } = await supabase.rpc("similar_opportunities", { p_name: name, p_city: city });
  if (error) return NextResponse.json({ matches: [] });
  return NextResponse.json(
    { matches: (data ?? []).map((m: { name: string; city: string; captured_at: string }) => ({ name: m.name, city: m.city, captured_at: m.captured_at })) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
