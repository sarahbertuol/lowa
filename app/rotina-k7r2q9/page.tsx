import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import Tracker from "@/components/rotina/Tracker";
import { ROTINA_BASE, ROTINA_COOKIE, isValidSession } from "@/lib/rotina-auth";
import "./rotina.css";

/** Private panel: never indexed, never cached, no social cards. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Rotina" },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nocache: true,
    googleBot: { index: false, follow: false, noarchive: true },
  },
  alternates: { canonical: null },
  openGraph: null,
  twitter: null,
};

export const viewport: Viewport = { themeColor: "#FBF7F5" };

const ERROS: Record<string, string> = {
  senha: "Senha incorreta.",
  limite: "Muitas tentativas. Tente de novo em 15 minutos.",
  config: "A senha do painel ainda não foi configurada no servidor.",
};

type Props = { searchParams: Promise<{ erro?: string }> };

export default async function RotinaPage({ searchParams }: Props) {
  const jar = await cookies();
  const ok = await isValidSession(jar.get(ROTINA_COOKIE)?.value);
  const { erro } = await searchParams;

  return (
    <>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Manrope:wght@400;500;600;700&display=swap"
        precedence="default"
      />
      <div className="rt" lang="pt-BR">
        {ok ? <Tracker logoutAction={`${ROTINA_BASE}/sair`} /> : <Login erro={erro ? ERROS[erro] : undefined} />}
      </div>
    </>
  );
}

function Login({ erro }: { erro?: string }) {
  return (
    <main className="rt-login">
      <form className="rt-card rt-login-card" method="post" action={`${ROTINA_BASE}/entrar`}>
        <h1 className="rt-serif rt-login-title">Rotina</h1>
        <p className="rt-login-sub">Painel privado. Digite a senha para entrar.</p>
        <label className="rt-field">
          <span>SENHA</span>
          <input
            type="password"
            name="senha"
            autoComplete="current-password"
            required
            autoFocus
            aria-invalid={erro ? true : undefined}
            aria-describedby={erro ? "rt-login-erro" : undefined}
          />
        </label>
        {erro && (
          <p id="rt-login-erro" className="rt-err" role="alert">
            {erro}
          </p>
        )}
        <button type="submit" className="rt-btn-primary rt-login-btn">
          Entrar
        </button>
      </form>
    </main>
  );
}
