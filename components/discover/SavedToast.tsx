"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Toast from "./Toast";

const MESSAGES: Record<string, string> = {
  saved: "Saved.",
  offline: "Saved on this phone. It will sync when you're online.",
  signin: "Saved on this phone. Sign in again to sync it.",
};

/** Confirmation after a capture (?saved=...), then cleans the address bar. */
export default function SavedToast() {
  const kind = useSearchParams().get("saved");
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    if (!kind || !MESSAGES[kind]) return;
    setMsg(MESSAGES[kind]);
    const url = new URL(window.location.href);
    url.searchParams.delete("saved");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, [kind]);
  return <Toast message={msg} />;
}
