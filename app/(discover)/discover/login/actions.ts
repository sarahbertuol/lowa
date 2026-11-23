"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseConfigured } from "@/lib/engine/env";
import { createAdminClient } from "@/lib/engine/supabase/admin";
import { createUserClient } from "@/lib/engine/supabase/server";
import { normalizeEmail, requestOrigin, safeNext } from "@/lib/engine/auth";

export type LoginState =
  | { step: "email"; error?: string; email?: string }
  | { step: "code"; email: string; error?: string };

const emailSchema = z.email();

/** Step 1: send a sign-in email (6-digit code plus a link), only to team members. */
export async function requestCode(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = normalizeEmail(form.get("email"));
  const next = safeNext(String(form.get("next") ?? ""));
  if (!emailSchema.safeParse(email).success) return { step: "email", email, error: "Enter a valid email." };
  if (!supabaseConfigured()) return { step: "email", email, error: "Discover isn't connected to the database yet." };

  const admin = createAdminClient();
  const { data: member, error: memberError } = await admin
    .from("team_members").select("email").eq("email", email).maybeSingle();
  if (memberError) return { step: "email", email, error: "We couldn't check access. Try again in a moment." };
  if (!member) return { step: "email", email, error: "This email doesn't have access to Discover." };

  const supabase = await createUserClient();
  const redirectTo = `${await requestOrigin()}/discover/auth/confirm?next=${encodeURIComponent(next)}`;
  const send = () => supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: redirectTo } });

  let { error } = await send();
  if (error && /signups? not allowed|user not found/i.test(error.message)) {
    // First sign-in of a team member: create the account (public sign-up stays off), then send.
    const created = await admin.auth.admin.createUser({ email, email_confirm: true });
    if (created.error && !/already/i.test(created.error.message)) {
      return { step: "email", email, error: "We couldn't create your access. Try again in a moment." };
    }
    ({ error } = await send());
  }
  if (error) {
    const wait = /rate|seconds|too many/i.test(error.message);
    return { step: "email", email, error: wait ? "Too many emails. Wait a minute and try again." : `Email not sent: ${error.message}` };
  }
  return { step: "code", email };
}

/** Step 2: the code typed in the app (works inside the installed app, where links open elsewhere). */
export async function verifyCode(prev: LoginState, form: FormData): Promise<LoginState> {
  const email = normalizeEmail(form.get("email"));
  const token = String(form.get("code") ?? "").replace(/\D/g, "");
  const next = safeNext(String(form.get("next") ?? ""));
  if (token.length < 6) return { step: "code", email, error: "Enter the code from the email." };

  const supabase = await createUserClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { step: "code", email, error: "That code didn't work. Check it or send a new one." };
  redirect(next);
}
