"use client";

import { useEffect, useState } from "react";
import { listQueued, removeQueued, type Queued } from "./queue";
import { useNetwork } from "./Network";

/** Captures still on this phone (Waiting for connection), shown above the synced list. */
export default function QueuedList() {
  const [items, setItems] = useState<Queued[]>([]);
  const net = useNetwork();

  useEffect(() => {
    const load = () => listQueued().then(setItems);
    load();
    window.addEventListener("dx:queue", load);
    return () => window.removeEventListener("dx:queue", load);
  }, []);

  if (!items.length) return null;
  return (
    <section className="dx-group" aria-labelledby="dx-waiting">
      <h2 id="dx-waiting" className="mono">On this phone · {items.length}</h2>
      <ul className="dx-list">
        {items.map((i) => (
          <li key={i.client_ref} className="dx-item">
            <span className="dx-thumb" aria-hidden="true">{i.data.name.trim().charAt(0).toUpperCase()}</span>
            <span className="dx-item-txt">
              <b>{i.data.name}</b>
              <span>
                {i.error
                  ? i.error
                  : `${i.data.city} · ${net === "syncing" ? "Sending now" : "Saved offline, will sync"}`}
              </span>
            </span>
            {i.error ? (
              <button className="dx-link" type="button" onClick={() => removeQueued(i.client_ref)}>Remove</button>
            ) : (
              <span className="dx-chip s-captured">Waiting</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
