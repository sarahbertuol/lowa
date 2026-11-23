"use client";

import { useEffect } from "react";

/** Registers the Discover service worker. Only mounted inside /discover, never on the public site. */
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/discover/sw.js", { scope: "/discover" }).catch(() => {});
  }, []);
  return null;
}

/** Removes the app's offline copies (called on sign out, so no private screen stays on the phone). */
export async function clearOfflineData() {
  if (!("caches" in window)) return;
  const keys = await caches.keys();
  await Promise.all(keys.filter((k) => k.startsWith("dx-")).map((k) => caches.delete(k)));
}
