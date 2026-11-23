"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { syncQueue } from "./queue";

/** Sends offline captures when the app opens, comes back online or returns to the screen. */
export default function QueueSync() {
  const router = useRouter();
  useEffect(() => {
    const go = () => syncQueue();
    const onSync = (e: Event) => {
      if ((e as CustomEvent<boolean>).detail === false) router.refresh();
    };
    const visible = () => document.visibilityState === "visible" && syncQueue();
    syncQueue();
    window.addEventListener("online", go);
    window.addEventListener("dx:sync", onSync);
    document.addEventListener("visibilitychange", visible);
    return () => {
      window.removeEventListener("online", go);
      window.removeEventListener("dx:sync", onSync);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [router]);
  return null;
}
