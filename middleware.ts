import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { goneHtml } from "@/lib/engine/gone";

/**
 * Guards the Opportunity Engine only (see `config.matcher`): the public site and the agency
 * proposals never run this code. /opportunity/[token] only gets the revoked/expired check (410).
 * - Refreshes the Supabase session cookie on every request.
 * - No session: pages go to /discover/login, the API answers 401.
 * - Signed in but not on the team: the API answers 403, pages sign out and go to the login.
 */
const PUBLIC_PATHS = ["/discover/login", "/discover/auth/"];
// App install files: no private data, needed before sign-in (manifest, icons, service worker).
const INSTALL_FILES = ["/discover/manifest.webmanifest", "/discover/sw.js", "/discover/app-icon/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/opportunity/")) return proposalGate(pathname.slice("/opportunity/".length));
  if (INSTALL_FILES.some((p) => pathname === p || pathname.startsWith(p))) return NextResponse.next();
  const isApi = pathname.startsWith("/api/discover");
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !/^https?:\/\//.test(url)) {
    // Not configured yet: never expose the app, show the login page with a setup notice.
    if (isApi) return NextResponse.json({ error: "not_configured" }, { status: 503 });
    if (isPublic) return NextResponse.next();
    return NextResponse.redirect(new URL("/discover/login", request.url));
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });

  // getUser() validates the token with Supabase (getSession() alone would trust the cookie).
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !isPublic) {
    if (isApi) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const login = new URL("/discover/login", request.url);
    if (pathname !== "/discover") login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }
  // On the team, not just signed in (OE-16): someone taken off team_members is signed out.
  if (user && !isPublic) {
    const { data: team, error: teamError } = await supabase.rpc("is_team");
    if (!teamError && team === false) {
      if (isApi) return NextResponse.json({ error: "forbidden" }, { status: 403 });
      await supabase.auth.signOut();
      const out = NextResponse.redirect(new URL("/discover/login?error=access", request.url));
      for (const c of response.cookies.getAll()) out.cookies.set(c);
      return out;
    }
  }
  if (user && pathname === "/discover/login") {
    return NextResponse.redirect(new URL("/discover", request.url));
  }
  return response;
}

/**
 * A revoked or expired proposal answers 410 with a short page (OE-13). Valid and unknown tokens go
 * on to the page, which reads the snapshot again and shows it or a 404.
 */
async function proposalGate(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!/^[A-Za-z0-9_-]{22}$/.test(token) || !url || !key) return NextResponse.next();
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data } = await db.from("proposal_snapshots").select("expires_at,revoked_at").eq("token", token).maybeSingle();
  const why = !data ? null : data.revoked_at ? "revoked" : new Date(data.expires_at).getTime() <= Date.now() ? "expired" : null;
  if (!why) return NextResponse.next();
  return new NextResponse(goneHtml(why, "hello@lowa-studio.com"), {
    status: 410,
    headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", "referrer-policy": "no-referrer" },
  });
}

export const config = {
  matcher: ["/discover", "/discover/:path*", "/api/discover/:path*", "/opportunity/:token"],
};
