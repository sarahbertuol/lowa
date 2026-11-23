import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NetDot } from "@/components/discover/Network";
import { createUserClient } from "@/lib/engine/supabase/server";
import { SERVICE_COLUMNS, type Service } from "@/lib/engine/catalog";
import ServiceCard from "./ServiceCard";
import AddService from "./AddService";

export const metadata: Metadata = { title: "Catalog" };

type Props = { searchParams: Promise<{ open?: string }> };

/** Service catalog (docs/referencia/Catalogo.html, OE-10): prices and scope, editable from the phone. */
export default async function Catalog({ searchParams }: Props) {
  const { open } = await searchParams;
  const supabase = await createUserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/discover/login");

  const { data, error } = await supabase.from("services").select(SERVICE_COLUMNS).order("sort_order");
  const services = (data ?? []) as Service[];

  return (
    <main className="dx-app">
      <header className="dx-top">
        <a className="dx-back" href="/discover">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>
          Home
        </a>
        <NetDot />
      </header>
      <div className="dx-sec-row">
        <h1 className="dx-title">Service <em>catalog</em></h1>
        <AddService />
      </div>
      <p className="dx-lead">Proposals take prices only from here. Changes apply to new proposals, never to ones already published.</p>

      {error && <p className="dx-field-err" role="alert">Couldn&apos;t load the catalog. Reload to try again.</p>}
      <div className="dx-stack">
        {services.map((s) => (
          <div key={s.id} id={s.slug}>
            <ServiceCard service={s} open={s.slug === open} />
          </div>
        ))}
      </div>
    </main>
  );
}
