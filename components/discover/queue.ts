"use client";

import type { CaptureInput } from "@/lib/engine/capture";

/**
 * Offline capture queue (IndexedDB). Every capture is written here first, then sent.
 * The server is idempotent by client_ref, so a retry never duplicates a lead.
 * Events: "dx:sync" (detail true/false while sending), "dx:queue" (list changed).
 */
export type Queued = {
  client_ref: string;
  data: CaptureInput;
  photo?: Blob;
  queued_at: string;
  error?: string;
};

const DB = "dx-capture";
const STORE = "queue";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) return reject(new Error("no_indexeddb"));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "client_ref" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(req.result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}

const changed = () => window.dispatchEvent(new Event("dx:queue"));

export async function putQueued(item: Queued) {
  await run("readwrite", (s) => s.put(item));
  changed();
}
export async function removeQueued(ref: string) {
  await run("readwrite", (s) => s.delete(ref));
  changed();
}
export async function listQueued(): Promise<Queued[]> {
  try {
    const all = await run<Queued[]>("readonly", (s) => s.getAll() as IDBRequest<Queued[]>);
    return all.sort((a, b) => a.queued_at.localeCompare(b.queued_at));
  } catch {
    return [];
  }
}

export type SendResult = "saved" | "offline" | "signed_out" | "rejected";

/** Sends one capture. "offline" covers no network, timeouts and server errors (retry later). */
export async function sendCapture(item: Queued): Promise<SendResult> {
  const body = new FormData();
  body.set("data", JSON.stringify({ ...item.data, client_ref: item.client_ref }));
  if (item.photo) body.set("photo", item.photo, "photo.jpg");
  try {
    const res = await fetch("/api/discover/opportunities", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(20000),
    });
    if (res.ok) return "saved";
    if (res.status === 401) return "signed_out";
    if (res.status === 400) return "rejected";
    return "offline";
  } catch {
    return "offline";
  }
}

let running = false;

/** Sends everything waiting, oldest first. Stops at the first network failure. */
export async function syncQueue(): Promise<void> {
  if (running || !navigator.onLine) return;
  const items = (await listQueued()).filter((i) => !i.error);
  if (!items.length) return;
  running = true;
  window.dispatchEvent(new CustomEvent("dx:sync", { detail: true }));
  try {
    for (const item of items) {
      const result = await sendCapture(item);
      if (result === "saved") await removeQueued(item.client_ref);
      else if (result === "rejected") await putQueued({ ...item, error: "The server didn't accept this capture." });
      else break;
    }
  } finally {
    running = false;
    window.dispatchEvent(new CustomEvent("dx:sync", { detail: false }));
  }
}
