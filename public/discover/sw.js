/* LoWa Discover service worker. Scope: /discover only (the public site never registers it).
 * - Screens: network first; offline, the last copy of that screen, or the capture screen.
 * - Next.js static files and Google Fonts: cache first (they are versioned).
 * - API, sign-in, sign-out and anything outside /discover: never cached.
 * Bump VERSION when this file changes. */
const VERSION = "v2";
const PAGES = `dx-pages-${VERSION}`;
const ASSETS = `dx-assets-${VERSION}`;
const OFFLINE_URL = "/discover/new";
const NO_CACHE = ["/discover/login", "/discover/auth/"];

self.addEventListener("install", (event) => {
  event.waitUntil(precache());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith("dx-") && k !== PAGES && k !== ASSETS).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

/** Keeps the capture screen and the files it needs, so it opens without internet. */
async function precache() {
  try {
    const res = await fetch(OFFLINE_URL, { credentials: "same-origin", cache: "no-store" });
    if (!isPage(res)) return;
    const html = await res.clone().text();
    await (await caches.open(PAGES)).put(OFFLINE_URL, res);
    const files = [...new Set(html.match(/\/_next\/static\/[^"'\s)\\]+/g) || [])];
    const assets = await caches.open(ASSETS);
    await Promise.all(files.map((f) => assets.add(f).catch(() => {})));
  } catch {
    /* Signed out or offline: the copy is made on the next visit. */
  }
}

function isPage(res) {
  return res.ok && !res.redirected && (res.headers.get("content-type") || "").includes("text/html");
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (req.mode === "navigate" && url.origin === location.origin) {
    if (!url.pathname.startsWith("/discover") || NO_CACHE.some((p) => url.pathname.startsWith(p))) return;
    event.respondWith(screen(req));
    return;
  }

  const isStatic = url.origin === location.origin && url.pathname.startsWith("/_next/static/");
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (isStatic || isFont) event.respondWith(cacheFirst(req));
});

async function screen(req) {
  const pages = await caches.open(PAGES);
  try {
    const res = await fetch(req);
    if (isPage(res)) await pages.put(req.url, res.clone());
    return res;
  } catch {
    return (
      (await pages.match(req.url)) ||
      (await pages.match(OFFLINE_URL)) ||
      new Response("<!doctype html><meta name=viewport content='width=device-width'><title>Offline</title><p style='font:16px system-ui;padding:24px'>You're offline. Open Discover again when you're back online.</p>", {
        status: 503,
        headers: { "content-type": "text/html; charset=utf-8" },
      })
    );
  }
}

async function cacheFirst(req) {
  const assets = await caches.open(ASSETS);
  const hit = await assets.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") await assets.put(req, res.clone());
  return res;
}
