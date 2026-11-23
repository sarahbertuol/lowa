"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Refreshes the server data every few seconds while something is being researched. */
export default function AutoRefresh({ active, every = 4000 }: { active: boolean; every?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) router.refresh();
    }, every);
    return () => clearInterval(t);
  }, [active, every, router]);
  return null;
}
