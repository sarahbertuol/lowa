"use client";

import { useEffect, useRef, useState } from "react";
import type { CaptureInput } from "@/lib/engine/capture";
import { CATEGORIES, type Category } from "@/lib/engine/categories";
import { putQueued, removeQueued, sendCapture, type Queued } from "@/components/discover/queue";
import { compressPhoto } from "@/components/discover/photo";

/** Capture form (docs/referencia/Nova.html). Name and city are enough; everything else is optional. */

type Match = { name: string; city: string; captured_at: string };

const RECENT_KEY = "dx-recent-cities";

function readRecent(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 3) : [];
  } catch {
    return [];
  }
}
function rememberCity(city: string) {
  try {
    const list = [city, ...readRecent().filter((c) => c.toLowerCase() !== city.toLowerCase())].slice(0, 3);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    /* private mode: no recent cities */
  }
}

const shortDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso));

export default function CaptureForm() {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [foundVia, setFoundVia] = useState<"in_person" | "online" | undefined>();
  const [more, setMore] = useState(false);
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [category, setCategory] = useState<Category | undefined>();
  const [contact, setContact] = useState("");
  const [foundAt, setFoundAt] = useState("");
  const [observation, setObservation] = useState("");
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [photoNote, setPhotoNote] = useState<string | null>(null);

  const [recent, setRecent] = useState<string[]>([]);
  const [locating, setLocating] = useState(false);
  const [locNote, setLocNote] = useState<string | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [errors, setErrors] = useState<{ name?: string; city?: string; form?: string }>({});
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  const nameRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const r = readRecent();
    setRecent(r);
    if (r[0]) setCity(r[0]);
    nameRef.current?.focus();
  }, []);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  // Possible duplicate: similar name in the same city. Online only, never blocks.
  useEffect(() => {
    const n = name.trim();
    const c = city.trim();
    if (n.length < 2 || c.length < 2 || !navigator.onLine) { setMatches([]); return; }
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/discover/similar?name=${encodeURIComponent(n)}&city=${encodeURIComponent(c)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : { matches: [] }))
        .then((j: { matches: Match[] }) => setMatches(j.matches ?? []))
        .catch(() => {});
    }, 450);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [name, city]);

  function useLocation() {
    setLocNote(null);
    if (!("geolocation" in navigator)) { setLocNote("Location isn't available here. Type the city."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await fetch(`/api/discover/geocode?lat=${coords.latitude}&lng=${coords.longitude}`);
          const j = await r.json();
          if (r.ok && j.city) { setCity(j.city); setErrors((e) => ({ ...e, city: undefined })); }
          else setLocNote(r.status === 503 ? "Location lookup isn't set up yet. Type the city." : "Couldn't find the city. Type it.");
        } catch {
          setLocNote("No connection for the location lookup. Type the city.");
        } finally {
          setLocating(false);
        }
      },
      () => { setLocating(false); setLocNote("Location permission was declined. Type the city."); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPhotoNote("Preparing photo…");
    try {
      const blob = await compressPhoto(file);
      setPhoto(blob);
      setPreview(URL.createObjectURL(blob));
      setPhotoNote(null);
    } catch {
      setPhotoNote("Couldn't read this photo. Try another one.");
    }
  }

  function clearPhoto() {
    setPhoto(null);
    setPreview(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state !== "idle") return;
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = "Add the business name";
    if (!city.trim()) errs.city = "Add the city";
    setErrors(errs);
    if (errs.name) { nameRef.current?.focus(); return; }
    if (errs.city) { cityRef.current?.focus(); return; }

    const data: CaptureInput = {
      client_ref: crypto.randomUUID(),
      captured_at: new Date().toISOString(),
      name: name.trim(),
      city: city.trim(),
      found_via: foundVia,
      website: website || undefined,
      instagram: instagram || undefined,
      category,
      contact_name: contact || undefined,
      found_at: foundAt || undefined,
      observation: observation || undefined,
    };
    const item: Queued = { client_ref: data.client_ref, data, photo: photo ?? undefined, queued_at: data.captured_at! };

    setState("saving");
    rememberCity(data.city);
    let queued = true;
    try {
      await putQueued(item);
    } catch {
      queued = false; // e.g. private browsing without IndexedDB: send directly
    }

    const result = navigator.onLine ? await sendCapture(item) : "offline";
    if (result === "saved") {
      if (queued) await removeQueued(item.client_ref).catch(() => {});
      done("saved");
    } else if (result === "rejected") {
      if (queued) await removeQueued(item.client_ref).catch(() => {});
      setState("idle");
      setErrors({ form: "Something in this form wasn't accepted. Check the fields and try again." });
    } else if (!queued) {
      setState("idle");
      setErrors({ form: "No connection, and this browser can't keep it offline. Try again when you're online." });
    } else {
      done(result === "signed_out" ? "signin" : "offline");
    }
  }

  function done(kind: "saved" | "offline" | "signin") {
    setState("saved");
    if ("vibrate" in navigator) navigator.vibrate?.(10);
    // Full navigation: also works offline (the service worker serves the last copy of Home).
    setTimeout(() => { window.location.href = `/discover?saved=${kind}`; }, 450);
  }

  const pressed = (on: boolean) => (on ? "true" : "false");

  return (
    <form className="dx-form" onSubmit={onSubmit} noValidate>
      {errors.form && <p className="dx-error" role="alert">{errors.form}</p>}

      <div className="dx-field">
        <label htmlFor="name">Business name <span className="dx-req">required</span></label>
        <input
          ref={nameRef} className="dx-input" id="name" name="name" autoComplete="off" autoCapitalize="words"
          enterKeyHint="next" placeholder="e.g. the name on the sign" maxLength={160}
          value={name} onChange={(e) => { setName(e.target.value); if (errors.name) setErrors({ ...errors, name: undefined }); }}
          aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "name-err" : undefined}
        />
        {errors.name && <span className="dx-field-err" id="name-err">{errors.name}</span>}
      </div>

      <div className="dx-field">
        <label htmlFor="city">City <span className="dx-req">required</span></label>
        <input
          ref={cityRef} className="dx-input" id="city" name="city" autoComplete="address-level2" autoCapitalize="words"
          enterKeyHint="done" placeholder="e.g. Asheville, NC" maxLength={120}
          value={city} onChange={(e) => { setCity(e.target.value); if (errors.city) setErrors({ ...errors, city: undefined }); }}
          aria-invalid={Boolean(errors.city)} aria-describedby={errors.city ? "city-err" : locNote ? "loc-note" : undefined}
        />
        {errors.city && <span className="dx-field-err" id="city-err">{errors.city}</span>}
        <div className="dx-pills">
          <button type="button" className="dx-pill" onClick={useLocation} disabled={locating}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="11" r="3" /><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z" /></svg>
            {locating ? "Finding…" : "Use my location"}
          </button>
          {recent.map((c) => (
            <button key={c} type="button" className="dx-pill" aria-pressed={pressed(city === c)} onClick={() => setCity(c)}>{c}</button>
          ))}
        </div>
        {locNote && <span className="dx-hint" id="loc-note" role="status">{locNote}</span>}
      </div>

      <div className="dx-field">
        <span className="dx-label" id="how">How did you find them?</span>
        <div className="dx-pills" role="group" aria-labelledby="how">
          <button type="button" className="dx-pill" aria-pressed={pressed(foundVia === "in_person")} onClick={() => setFoundVia(foundVia === "in_person" ? undefined : "in_person")}>Met in person</button>
          <button type="button" className="dx-pill" aria-pressed={pressed(foundVia === "online")} onClick={() => setFoundVia(foundVia === "online" ? undefined : "online")}>Found online</button>
        </div>
        <span className="dx-hint">Used only to choose the right outreach message.</span>
      </div>

      {matches.length > 0 && (
        <p className="dx-dup" role="status">
          Similar name in {matches[0].city}: <b>{matches[0].name}</b> (captured {shortDate(matches[0].captured_at)})
          {matches.length > 1 ? ` and ${matches.length - 1} more` : ""}. Saving anyway is fine.
        </p>
      )}

      <button type="button" className="dx-more" aria-expanded={more} aria-controls="extra" onClick={() => setMore(!more)}>
        Add details <span className="mono">optional</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
      </button>

      <div className="dx-extra" id="extra" hidden={!more}>
        {preview ? (
          <div className="dx-photo has">
            <img src={preview} alt="Photo you added for this business" />
            <div><b>Photo added</b><span>We&apos;ll read the name, website and handle from it.</span></div>
            <button type="button" className="dx-link" onClick={clearPhoto}>Remove</button>
          </div>
        ) : (
          <label className="dx-photo">
            <span className="ic" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg></span>
            <div><b>Photo of card, product or storefront</b><span>{photoNote ?? "We read the name, website and handle from it."}</span></div>
            <input type="file" accept="image/*" capture="environment" className="sr" onChange={onPhoto} />
          </label>
        )}
        <div className="dx-two">
          <div className="dx-field">
            <label htmlFor="ig">Instagram</label>
            <input className="dx-input" id="ig" inputMode="url" autoCapitalize="off" autoCorrect="off" placeholder="@handle" maxLength={80} value={instagram} onChange={(e) => setInstagram(e.target.value)} />
          </div>
          <div className="dx-field">
            <label htmlFor="web">Website</label>
            <input className="dx-input" id="web" type="url" inputMode="url" autoCapitalize="off" autoCorrect="off" placeholder="example.com" maxLength={300} value={website} onChange={(e) => setWebsite(e.target.value)} />
          </div>
        </div>
        <div className="dx-field">
          <span className="dx-label" id="cat">Category</span>
          <div className="dx-pills" role="group" aria-labelledby="cat">
            {CATEGORIES.map((c) => (
              <button key={c} type="button" className="dx-pill" aria-pressed={pressed(category === c)} onClick={() => setCategory(category === c ? undefined : c)}>{c}</button>
            ))}
          </div>
        </div>
        <div className="dx-two">
          <div className="dx-field">
            <label htmlFor="who">Contact person</label>
            <input className="dx-input" id="who" autoComplete="off" placeholder="First name is enough" maxLength={120} value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          <div className="dx-field">
            <label htmlFor="where">Where you found them</label>
            <input className="dx-input" id="where" placeholder="e.g. River Arts market" maxLength={160} value={foundAt} onChange={(e) => setFoundAt(e.target.value)} />
          </div>
        </div>
        <div className="dx-field">
          <label htmlFor="obs">Your observation</label>
          <textarea className="dx-input dx-textarea" id="obs" placeholder="What caught your eye? Voice dictation works here." maxLength={2000} value={observation} onChange={(e) => setObservation(e.target.value)} />
        </div>
      </div>

      <div className="dx-bar">
        <div className="dx-bar-in">
          <button className="dx-btn block" type="submit" disabled={state === "saving"} data-state={state}>
            {state === "saved" ? (
              <>
                <svg className="dx-check" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
                Saved
              </>
            ) : state === "saving" ? "Saving…" : <>Save <span aria-hidden="true">&rarr;</span></>}
          </button>
        </div>
      </div>
    </form>
  );
}
