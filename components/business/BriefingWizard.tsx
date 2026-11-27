"use client";

import { useRef, useState, type ReactNode } from "react";
import { sendForm, honeypotProps, type Pairs } from "@/lib/send-form";

/**
 * /business (SITE-01): "Fill in the 3-minute briefing" button and the briefing pop-up.
 * One question per screen, mostly taps. Prototype: docs/referencia/Briefing.html.
 * The logo-style step only shows when the client has no logo yet, or it needs love.
 * Sends to /api/contato (kind "briefing"); if email fails, opens WhatsApp with the answers.
 */

type Opt = { v: string; label: string; icon?: string; note?: string };

const KINDS: Opt[] = [
  { v: "Food and drinks", label: "Food and drinks", icon: "🍰" },
  { v: "Beauty and wellness", label: "Beauty and wellness", icon: "💅" },
  { v: "Health", label: "Health", icon: "🩺" },
  { v: "Shop or handmade", label: "Shop or handmade", icon: "🛍️" },
  { v: "Home services", label: "Home services", icon: "🔧" },
  { v: "Professional services", label: "Professional services", icon: "💼" },
  { v: "Events and creative", label: "Events and creative", icon: "🎉" },
  { v: "Other", label: "Other", icon: "✨" },
];
const GOALS: Opt[] = [
  { v: "Get calls and messages", label: "Get calls and messages", icon: "📞" },
  { v: "Take bookings", label: "Take bookings", icon: "📅" },
  { v: "Show services, menu or prices", label: "Show services, menu or prices", icon: "📋" },
  { v: "Look more professional", label: "Look more professional", icon: "⭐" },
  { v: "Be found on Google", label: "Be found on Google", icon: "🔎" },
  { v: "Sell online", label: "Sell online", icon: "🛒", note: "Quoted separately" },
];
const LOOKS: Opt[] = [
  { v: "Clean and minimal", label: "Clean and minimal", icon: "m1" },
  { v: "Warm and cozy", label: "Warm and cozy", icon: "m2" },
  { v: "Bold and colorful", label: "Bold and colorful", icon: "m3" },
  { v: "Elegant and premium", label: "Elegant and premium", icon: "m4" },
  { v: "Playful and fun", label: "Playful and fun", icon: "m5" },
  { v: "Natural and organic", label: "Natural and organic", icon: "m6" },
];
const PALETTES: { v: string; label: string; colors: string[] }[] = [
  { v: "My logo colors", label: "Use my logo colors", colors: [] },
  { v: "Warm earth", label: "Warm earth", colors: ["#8A4B2D", "#D08B5B", "#F3E3D3"] },
  { v: "Ocean blues", label: "Ocean blues", colors: ["#1F4F61", "#4F9DB5", "#DCEFF4"] },
  { v: "Fresh greens", label: "Fresh greens", colors: ["#3F5A36", "#8DB36B", "#EEF4E4"] },
  { v: "Soft pastels", label: "Soft pastels", colors: ["#F7C6D9", "#C9D8F5", "#FFF1C9"] },
  { v: "Black and white", label: "Black and white", colors: ["#151515", "#8A8A8A", "#FAFAFA"] },
];
const LOGO_HAVE: Opt[] = [
  { v: "Yes", label: "Yes" },
  { v: "Sort of, it needs love", label: "Sort of, it needs love" },
  { v: "Not yet", label: "Not yet" },
];
const LOGO_STYLES: Opt[] = [
  { v: "Just the name", label: "Just the name", note: "Clean type, no symbol", icon: "lg1" },
  { v: "Initials", label: "Initials", note: "A monogram in a shape", icon: "lg2" },
  { v: "Symbol and name", label: "Symbol and name", note: "A small icon next to it", icon: "lg3" },
  { v: "Badge", label: "Badge", note: "Classic, like a seal", icon: "lg4" },
  { v: "Handwritten", label: "Handwritten", note: "Personal and warm", icon: "lg5" },
  { v: "Playful", label: "Playful", note: "Bold, round and fun", icon: "lg6" },
];
const PHOTOS: Opt[] = [
  { v: "Yes, good ones", label: "Yes, good ones", icon: "📸" },
  { v: "Phone photos", label: "Phone photos", icon: "📱" },
  { v: "Not really", label: "Not really" },
];
const LIKES = ["Colors", "Photos", "Layout", "Fonts", "How simple it is"];
const EXTRAS = [
  "Services or menu",
  "Prices",
  "Photo gallery",
  "Reviews",
  "FAQ",
  "Booking",
  "Map and hours",
  "WhatsApp button",
];
const WHEN = ["As soon as possible", "In 2 weeks", "This month", "No rush"];
const DOMAIN = ["Yes, I have one", "No, help me buy one", "Not sure"];
const LINKS = [
  { n: "instagram", label: "Instagram", ph: "@yourbusiness" },
  { n: "facebook", label: "Facebook", ph: "Page name or link" },
  { n: "google", label: "Google Maps", ph: "Business name or link" },
  { n: "cursite", label: "Current site", ph: "yourbusiness.com" },
  { n: "otherlink", label: "Other", ph: "TikTok, Etsy, Yelp…" },
];

type StepId = "you" | "kind" | "goals" | "look" | "colors" | "logostyle" | "find" | "refs" | "pages" | "last";
const ALL: StepId[] = ["you", "kind", "goals", "look", "colors", "logostyle", "find", "refs", "pages", "last"];
type Errs = Partial<Record<"b-name" | "b-biz" | "b-email" | "b-phone", string>>;

function Chip({ type, name, o, defaultChecked }: { type: "radio" | "checkbox"; name: string; o: Opt; defaultChecked?: boolean }) {
  return (
    <label className="bzb-chip">
      <input type={type} name={name} value={o.v} defaultChecked={defaultChecked} />
      <span>
        {o.icon && <span aria-hidden="true">{o.icon}</span>}
        {o.label}
      </span>
    </label>
  );
}

function Card({ type, name, v, children }: { type: "radio" | "checkbox"; name: string; v: string; children: ReactNode }) {
  return (
    <label className="bzb-card">
      <input type={type} name={name} value={v} />
      <span className="bzb-inner">{children}</span>
    </label>
  );
}

function Mock({ kind }: { kind: string }) {
  return (
    <span className={`bzb-mock ${kind}`} aria-hidden="true">
      <i className="t" />
      <i className="l" />
      <span className="r">
        <i />
        <i />
        <i />
      </span>
    </span>
  );
}

function LogoSample({ kind, biz }: { kind: string; biz: string }) {
  const initials = biz
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span className={`bzb-lg ${kind}`} aria-hidden="true">
      {kind === "lg2" ? (
        <span className="ini">{initials}</span>
      ) : kind === "lg3" ? (
        <>
          <svg viewBox="0 0 24 24">
            <path d="M12 2c3 4 7 6 7 11a7 7 0 0 1-14 0c0-5 4-7 7-11z" />
          </svg>
          <span className="nm">{biz}</span>
        </>
      ) : kind === "lg4" ? (
        <span className="badge">
          <small>EST. 2026</small>
          <span className="nm">{biz}</span>
        </span>
      ) : (
        <span className="nm">{biz}</span>
      )}
    </span>
  );
}

/** Keeps at most two boxes ticked in a group. */
function maxTwo(e: React.FormEvent<HTMLDivElement>) {
  const t = e.target as HTMLInputElement;
  if (t.type !== "checkbox" || !t.checked) return;
  if (e.currentTarget.querySelectorAll("input:checked").length > 2) t.checked = false;
}

export default function BriefingWizard({ source }: { source: string }) {
  const dlg = useRef<HTMLDialogElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<StepId>("you");
  const [hasLogo, setHasLogo] = useState(false);
  const [biz, setBiz] = useState("");
  const [errs, setErrs] = useState<Errs>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<false | "email" | "whatsapp">(false);
  const [first, setFirst] = useState("");

  const steps = ALL.filter((s) => !(hasLogo && s === "logostyle"));
  const pos = steps.indexOf(step);
  const last = pos === steps.length - 1;
  const bizName = biz.trim() || "Your Business";

  function go(s: StepId) {
    setStep(s);
    requestAnimationFrame(() => {
      body.current?.scrollTo({ top: 0 });
      body.current?.querySelector<HTMLElement>(`[data-step="${s}"] h3`)?.focus({ preventScroll: true });
    });
  }

  function validate(): boolean {
    const f = new FormData(form.current!);
    const v = (k: string) => String(f.get(k) ?? "").trim();
    const e: Errs = {};
    if (!v("b-name")) e["b-name"] = "Please add your name.";
    if (!v("b-biz")) e["b-biz"] = "Please add the business name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v("b-email"))) e["b-email"] = "Please add a valid email.";
    if (v("reach") === "WhatsApp" && !v("b-phone")) e["b-phone"] = "Add your WhatsApp so we can reach you there.";
    setErrs(e);
    const firstBad = (["b-name", "b-biz", "b-email", "b-phone"] as const).find((k) => e[k]);
    if (firstBad) document.getElementById(firstBad)?.focus();
    return !firstBad;
  }

  async function submit() {
    const el = form.current!;
    const f = new FormData(el);
    const v = (k: string) => String(f.get(k) ?? "");
    const all = (k: string) => f.getAll(k).map(String).join(", ");
    const pairs: Pairs = [
      ["Name", v("b-name")],
      ["Business", v("b-biz")],
      ["Email", v("b-email")],
      ["WhatsApp", v("b-phone")],
      ["Best way to reach", v("reach")],
      ["Kind of business", v("kind")],
      ["What they do", v("oneline")],
      ["The site should", all("goal")],
      ["Look", all("look")],
      ["Colors", v("colors")],
      ["Has a logo", v("logo")],
      ["Logo style", hasLogo ? "" : all("logostyle")],
      ...LINKS.map((l) => [l.label, v(l.n)] as [string, string]),
      ["Photos", v("photos")],
      ["Reference 1", v("ref1")],
      ["Reference 2", v("ref2")],
      ["Reference 3", v("ref3")],
      ["Likes in the references", all("likes")],
      ["Would like to show", all("extras")],
      ["When", v("when")],
      ["Domain", v("domain")],
      ["Anything else", v("more")],
      ["Sent from", source],
    ];
    setBusy(true);
    const via = await sendForm("briefing", el, pairs);
    setBusy(false);
    setFirst(v("b-name").trim().split(/\s+/)[0] ?? "");
    setDone(via);
    requestAnimationFrame(() => body.current?.querySelector<HTMLElement>(".bzb-done h3")?.focus());
  }

  function next() {
    if (step === "you" && !validate()) return;
    if (last) return void submit();
    go(steps[pos + 1]);
  }

  function open() {
    dlg.current?.showModal();
    if (!done) go(step);
  }

  const S = (id: StepId, children: ReactNode) => (
    <section className="bzb-step" data-step={id} hidden={done !== false || step !== id}>
      {children}
    </section>
  );
  const field = (id: keyof Errs, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className={`bzb-f${errs[id] ? " bad" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        name={id}
        aria-invalid={errs[id] ? "true" : undefined}
        aria-describedby={errs[id] ? `${id}-err` : undefined}
        {...props}
      />
      {errs[id] && (
        <span className="err" id={`${id}-err`}>
          {errs[id]}
        </span>
      )}
    </div>
  );

  return (
    <>
      <button className="btn bzb-cta" type="button" onClick={open}>
        Fill in the 3-minute briefing <span className="arr">→</span>
      </button>

      <dialog
        ref={dlg}
        className="bzb"
        aria-labelledby="bzb-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) dlg.current?.close();
        }}
      >
        <div className="bzb-head">
          <div className="bzb-top">
            <span className="mono" id="bzb-title">
              {done ? "Briefing sent" : `Website briefing · Step ${pos + 1} of ${steps.length}`}
            </span>
            <button className="bzb-x" type="button" aria-label="Close the briefing" onClick={() => dlg.current?.close()}>
              ×
            </button>
          </div>
          <div className="bzb-bar" aria-hidden="true">
            <i style={{ transform: `scaleX(${done ? 1 : (pos + 1) / steps.length})` }} />
          </div>
        </div>

        <div className="bzb-body" ref={body}>
          <form
            ref={form}
            noValidate
            onSubmit={(e) => e.preventDefault()}
            onInput={(e) => {
              const id = (e.target as HTMLElement).id as keyof Errs;
              if (errs[id]) setErrs((p) => ({ ...p, [id]: undefined }));
            }}
          >
            {S(
              "you",
              <>
                <h3 tabIndex={-1}>
                  First, <em>who are we talking to?</em>
                </h3>
                <div className="bzb-fields">
                  <div className="bzb-two">
                    {field("b-name", "Your name", { autoComplete: "name" })}
                    {field("b-biz", "Business name", { autoComplete: "organization", onChange: (e) => setBiz(e.target.value) })}
                  </div>
                  <div className="bzb-two">
                    {field("b-email", "Email", { type: "email", autoComplete: "email" })}
                    {field("b-phone", "WhatsApp (optional)", { type: "tel", autoComplete: "tel" })}
                  </div>
                </div>
                <fieldset className="bzb-q">
                  <legend>Best way to reach you?</legend>
                  <div className="bzb-chips">
                    <Chip type="radio" name="reach" o={{ v: "WhatsApp", label: "WhatsApp", icon: "💬" }} />
                    <Chip type="radio" name="reach" o={{ v: "Email", label: "Email", icon: "✉️" }} defaultChecked />
                  </div>
                </fieldset>
              </>,
            )}

            {S(
              "kind",
              <>
                <h3 tabIndex={-1}>
                  What kind of <em>business is it?</em>
                </h3>
                <fieldset className="bzb-q">
                  <legend className="sr-only">Kind of business</legend>
                  <div className="bzb-chips">
                    {KINDS.map((o) => (
                      <Chip key={o.v} type="radio" name="kind" o={o} />
                    ))}
                  </div>
                </fieldset>
                <div className="bzb-fields">
                  <div className="bzb-f">
                    <label htmlFor="b-oneline">In one line, what do you do? (optional)</label>
                    <input id="b-oneline" name="oneline" placeholder="Custom cakes for birthdays in St. Pete" />
                  </div>
                </div>
              </>,
            )}

            {S(
              "goals",
              <>
                <h3 tabIndex={-1}>
                  What should the website <em>do for you?</em>
                </h3>
                <p className="bzb-hint">Pick all that apply.</p>
                <fieldset className="bzb-q">
                  <legend className="sr-only">What the website should do</legend>
                  <div className="bzb-cards three">
                    {GOALS.map((o) => (
                      <Card key={o.v} type="checkbox" name="goal" v={o.v}>
                        <span className="ico" aria-hidden="true">
                          {o.icon}
                        </span>
                        <b>{o.label}</b>
                        {o.note && <small>{o.note}</small>}
                      </Card>
                    ))}
                  </div>
                </fieldset>
              </>,
            )}

            {S(
              "look",
              <>
                <h3 tabIndex={-1}>
                  Which look <em>feels like you?</em>
                </h3>
                <p className="bzb-hint">Pick up to two.</p>
                <fieldset className="bzb-q">
                  <legend className="sr-only">Look of the website, up to two</legend>
                  <div className="bzb-cards three" onChange={maxTwo}>
                    {LOOKS.map((o) => (
                      <Card key={o.v} type="checkbox" name="look" v={o.v}>
                        <Mock kind={o.icon!} />
                        <b>{o.label}</b>
                      </Card>
                    ))}
                  </div>
                </fieldset>
              </>,
            )}

            {S(
              "colors",
              <>
                <h3 tabIndex={-1}>
                  Colors and <em>your logo</em>
                </h3>
                <fieldset className="bzb-q">
                  <legend>Which colors do you like?</legend>
                  <div className="bzb-cards three">
                    {PALETTES.map((p) => (
                      <Card key={p.v} type="radio" name="colors" v={p.v}>
                        <span className={`bzb-pal${p.colors.length ? "" : " mine"}`} aria-hidden="true">
                          {p.colors.map((c) => (
                            <i key={c} style={{ background: c }} />
                          ))}
                        </span>
                        <b>{p.label}</b>
                      </Card>
                    ))}
                  </div>
                </fieldset>
                <fieldset className="bzb-q" onChange={(e) => setHasLogo((e.target as HTMLInputElement).value === "Yes")}>
                  <legend>Do you have a logo?</legend>
                  <div className="bzb-chips">
                    {LOGO_HAVE.map((o) => (
                      <Chip key={o.v} type="radio" name="logo" o={o} />
                    ))}
                  </div>
                </fieldset>
              </>,
            )}

            {S(
              "logostyle",
              <>
                <h3 tabIndex={-1}>
                  Which logo style <em>do you like?</em>
                </h3>
                <p className="bzb-hint">Pick up to two. We used your business name so you can picture it.</p>
                <fieldset className="bzb-q">
                  <legend className="sr-only">Logo style, up to two</legend>
                  <div className="bzb-cards three" onChange={maxTwo}>
                    {LOGO_STYLES.map((o) => (
                      <Card key={o.v} type="checkbox" name="logostyle" v={o.v}>
                        <LogoSample kind={o.icon!} biz={bizName} />
                        <b>{o.label}</b>
                        <small>{o.note}</small>
                      </Card>
                    ))}
                  </div>
                </fieldset>
              </>,
            )}

            {S(
              "find",
              <>
                <h3 tabIndex={-1}>
                  Where can we <em>see your business?</em>
                </h3>
                <p className="bzb-hint">We take your texts and photos from here, so you write less. All optional.</p>
                <div className="bzb-fields">
                  {LINKS.map((l) => (
                    <div className="bzb-pre" key={l.n}>
                      <label htmlFor={`b-${l.n}`}>{l.label}</label>
                      <input id={`b-${l.n}`} name={l.n} placeholder={l.ph} />
                    </div>
                  ))}
                </div>
                <fieldset className="bzb-q">
                  <legend>Do you have photos we can use?</legend>
                  <div className="bzb-chips">
                    {PHOTOS.map((o) => (
                      <Chip key={o.v} type="radio" name="photos" o={o} />
                    ))}
                  </div>
                </fieldset>
              </>,
            )}

            {S(
              "refs",
              <>
                <h3 tabIndex={-1}>
                  Any websites <em>you love?</em>
                </h3>
                <p className="bzb-hint">Any business, any country. Optional, but it helps a lot.</p>
                <div className="bzb-fields">
                  {[1, 2, 3].map((n) => (
                    <div className="bzb-f" key={n}>
                      <label htmlFor={`b-ref${n}`}>Link {n}</label>
                      <input id={`b-ref${n}`} name={`ref${n}`} type="url" inputMode="url" placeholder="https://" />
                    </div>
                  ))}
                </div>
                <fieldset className="bzb-q">
                  <legend>What do you like in them?</legend>
                  <div className="bzb-chips">
                    {LIKES.map((l) => (
                      <Chip key={l} type="checkbox" name="likes" o={{ v: l, label: l }} />
                    ))}
                  </div>
                </fieldset>
              </>,
            )}

            {S(
              "pages",
              <>
                <h3 tabIndex={-1}>
                  What goes <em>on the site?</em>
                </h3>
                <div className="bzb-q">
                  <p className="bzb-label">Already in your price</p>
                  <ul className="bzb-included">
                    {["Home", "About", "Contact", "Editing panel"].map((x) => (
                      <li key={x}>
                        <span aria-hidden="true">✓</span> {x}
                      </li>
                    ))}
                  </ul>
                </div>
                <fieldset className="bzb-q">
                  <legend>Anything you&apos;d like to show? Pick all that apply.</legend>
                  <div className="bzb-chips">
                    {EXTRAS.map((x) => (
                      <Chip key={x} type="checkbox" name="extras" o={{ v: x, label: x }} />
                    ))}
                  </div>
                </fieldset>
                <p className="bzb-note">
                  We tell you what fits in your price before we start. Extra pages are $250 each, only if you want them.
                </p>
              </>,
            )}

            {S(
              "last",
              <>
                <h3 tabIndex={-1}>
                  Last bits, <em>almost there!</em>
                </h3>
                <fieldset className="bzb-q">
                  <legend>When would you like it live?</legend>
                  <div className="bzb-chips">
                    {WHEN.map((x) => (
                      <Chip key={x} type="radio" name="when" o={{ v: x, label: x }} />
                    ))}
                  </div>
                </fieldset>
                <fieldset className="bzb-q">
                  <legend>Do you have a domain (yourbusiness.com)?</legend>
                  <div className="bzb-chips">
                    {DOMAIN.map((x) => (
                      <Chip key={x} type="radio" name="domain" o={{ v: x, label: x }} />
                    ))}
                  </div>
                </fieldset>
                <div className="bzb-fields">
                  <div className="bzb-f">
                    <label htmlFor="b-more">Anything else? (optional)</label>
                    <textarea id="b-more" name="more" placeholder="Ideas, must-haves, things you don't like…" />
                  </div>
                </div>
              </>,
            )}

            <input {...honeypotProps} />
          </form>

          {done && (
            <div className="bzb-done" role="status">
              <div className="ok" aria-hidden="true">
                ✓
              </div>
              {done === "email" ? (
                <>
                  <h3 tabIndex={-1}>
                    Got it{first ? ", " : ""}
                    <em>{first ? `${first}!` : "thank you!"}</em>
                  </h3>
                  <p>Sarah will look at everything and send you an idea for your site, with the fixed price, within 48 hours.</p>
                </>
              ) : (
                <>
                  <h3 tabIndex={-1}>
                    Almost there: <em>send it on WhatsApp.</em>
                  </h3>
                  <p>Our email did not answer, so we opened WhatsApp with your answers ready. Just press send.</p>
                </>
              )}
              <button className="btn" type="button" onClick={() => dlg.current?.close()}>
                Back to the page
              </button>
            </div>
          )}
        </div>

        {!done && (
          <div className="bzb-foot">
            <button className="btn-ghost" type="button" onClick={() => go(steps[pos - 1])} style={{ visibility: pos === 0 ? "hidden" : "visible" }}>
              Back
            </button>
            <button className="btn" type="button" onClick={next} disabled={busy}>
              {busy ? "Sending..." : last ? "Send briefing" : "Next"} {!busy && <span className="arr">→</span>}
            </button>
          </div>
        )}
      </dialog>
    </>
  );
}
