"use client";

import { useEffect, useState } from "react";

/**
 * Network state for LoWa Discover: online, offline or syncing.
 * "Syncing" comes from the capture queue (OE-04), which fires
 * `window.dispatchEvent(new CustomEvent("dx:sync", { detail: true | false }))`.
 */
export type NetState = "online" | "offline" | "syncing";

export function useNetwork(): NetState {
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    const sync = (e: Event) => setSyncing(Boolean((e as CustomEvent<boolean>).detail));
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    window.addEventListener("dx:sync", sync);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      window.removeEventListener("dx:sync", sync);
    };
  }, []);

  if (!online) return "offline";
  return syncing ? "syncing" : "online";
}

const LABEL: Record<NetState, string> = { online: "Online", offline: "Offline", syncing: "Syncing" };

/** Small dot and label for the top of each screen. */
export function NetDot() {
  const state = useNetwork();
  return (
    <span className={`dx-net ${state}`}>
      <i aria-hidden="true" />
      {LABEL[state]}
    </span>
  );
}

/** Thin band at the top of the app, only while offline. */
export function NetBanner() {
  const state = useNetwork();
  return (
    <div className="dx-netbar" data-on={state === "offline"} role="status">
      {state === "offline" ? "You're offline. Screens you opened before still work." : ""}
    </div>
  );
}
