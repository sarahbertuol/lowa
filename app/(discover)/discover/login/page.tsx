import type { Metadata } from "next";
import { supabaseConfigured } from "@/lib/engine/env";
import { safeNext } from "@/lib/engine/auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in" };

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams;
  return (
    <main className="dx-login">
      <div className="dx-login-in">
        <p className="dx-mark" aria-hidden="true">Lo<em>Wa</em> Studio</p>
        <LoginForm
          next={safeNext(next)}
          configured={supabaseConfigured()}
          linkError={error === "link"}
          accessError={error === "access"}
        />
      </div>
    </main>
  );
}
