"use client";

import { useEffect, useState } from "react";

/** One-line confirmation above the bottom bar; disappears after 2.4s (docs/INTERACOES.md). */
export default function Toast({ message }: { message: string | null }) {
  const [shown, setShown] = useState<string | null>(message);
  useEffect(() => {
    setShown(message);
    if (!message) return;
    const t = setTimeout(() => setShown(null), 2400);
    return () => clearTimeout(t);
  }, [message]);
  return (
    <div className="dx-toast" data-on={Boolean(shown)} role="status" aria-live="polite">
      {shown}
    </div>
  );
}
