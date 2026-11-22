"use client";

import { useActionState, useEffect, useRef } from "react";
import { requestCode, verifyCode, type LoginState } from "./actions";

type Props = { next: string; configured: boolean; linkError: boolean };

export default function LoginForm({ next, configured, linkError }: Props) {
  const [emailState, sendAction, sending] = useActionState<LoginState, FormData>(requestCode, { step: "email" });
  const [codeState, verifyAction, verifying] = useActionState<LoginState, FormData>(verifyCode, { step: "email" });
  const codeRef = useRef<HTMLInputElement>(null);

  const onCode = emailState.step === "code";
  const email = emailState.email ?? "";

  useEffect(() => {
    if (onCode) codeRef.current?.focus();
  }, [onCode]);

  if (!onCode) {
    return (
      <form className="dx-sheet" action={sendAction} noValidate>
        <h1>LoWa <em>Discover</em></h1>
        <p>For Sarah and Marco. We&apos;ll email you a sign-in code.</p>
        {!configured && <p className="dx-note" role="status">Discover isn&apos;t connected to the database yet.</p>}
        {linkError && !emailState.error && (
          <p className="dx-error" role="alert">That sign-in link expired or was already used. Send a new code.</p>
        )}
        <div className="dx-field">
          <label htmlFor="email">Email</label>
          <input
            className="dx-input" id="email" name="email" type="email" inputMode="email"
            autoComplete="email" autoCapitalize="off" spellCheck={false} required
            defaultValue={email} aria-invalid={Boolean(emailState.error)}
            aria-describedby={emailState.error ? "email-error" : undefined}
          />
        </div>
        {emailState.error && <p className="dx-error" id="email-error" role="alert">{emailState.error}</p>}
        <input type="hidden" name="next" value={next} />
        <button className="dx-btn block" type="submit" disabled={sending || !configured}>
          {sending ? "Sending…" : "Send code"}
        </button>
      </form>
    );
  }

  return (
    <form className="dx-sheet" action={verifyAction} noValidate>
      <h1>Check your <em>inbox</em></h1>
      <p>We sent a code to <strong>{email}</strong>. Type it here, or tap the link in the email on this phone.</p>
      <div className="dx-field">
        <label htmlFor="code">Sign-in code</label>
        <input
          ref={codeRef} className="dx-input code" id="code" name="code" inputMode="numeric"
          autoComplete="one-time-code" pattern="[0-9]*" maxLength={10} required
          aria-invalid={Boolean(codeState.error)} aria-describedby={codeState.error ? "code-error" : undefined}
        />
      </div>
      {codeState.error && <p className="dx-error" id="code-error" role="alert">{codeState.error}</p>}
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="next" value={next} />
      <button className="dx-btn block" type="submit" disabled={verifying}>
        {verifying ? "Checking…" : "Sign in"}
      </button>
      <div className="dx-row">
        <button className="dx-link" type="submit" formAction={sendAction} formNoValidate>Send a new code</button>
        <a className="dx-link" href={`/discover/login?next=${encodeURIComponent(next)}`}>Use another email</a>
      </div>
    </form>
  );
}
