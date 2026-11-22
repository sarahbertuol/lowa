import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Guards the Opportunity Engine only (see `config.matcher`): the public site, the agency
 * proposals and /opportunity/[token] never run this code.
 * - Refreshes the Supabase session cookie on every request.
 * - No session: pages go to /discover/login, the API answers 401.
 */
const PUBLIC_PATHS = ["/discover/login", "/discover/auth/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/discover");
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
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
  if (user && pathname === "/discover/login") {
    return NextResponse.redirect(new URL("/discover", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/discover", "/discover/:path*", "/api/discover/:path*"],
};
