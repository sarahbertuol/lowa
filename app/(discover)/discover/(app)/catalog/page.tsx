import type { Metadata } from "next";
import { NetDot } from "@/components/discover/Network";

export const metadata: Metadata = { title: "Catalog" };

/** Service catalog. The editable list (docs/referencia/Catalogo.html) arrives in OE-10. */
export default function Catalog() {
  return (
    <main className="dx-app">
      <header className="dx-top">
        <a className="dx-brand" href="/discover">LoWa<small>Discover</small></a>
        <NetDot />
      </header>
      <h1 className="dx-title">Service <em>catalog</em></h1>
      <section className="dx-card dx-stack">
        <p className="mono">Coming in OE-10</p>
        <p>Prices, inclusions and delivery for each service, editable from the phone.</p>
      </section>
    </main>
  );
}
