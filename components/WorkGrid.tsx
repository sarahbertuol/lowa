"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";
import { cases, categories, type CategoryId } from "@/data/cases";

// Featured first; then the alphabetical order of the tag (Baby shower, Consulting, Event...), then the name.
const sorted = [...cases].sort(
  (x, y) =>
    Number(!!y.featured) - Number(!!x.featured) ||
    x.tag.localeCompare(y.tag, "en") ||
    x.name.localeCompare(y.name, "pt"),
);

const toneClass = { brown: "", sky: " b", butter: " c", sunset: " d" } as const;

/** "Built to convert": filter buttons by type of delivery, then the case cards. */
export default function WorkGrid() {
  const [active, setActive] = useState<CategoryId | "all">("all");
  const list = active === "all" ? sorted : sorted.filter((c) => c.category === active);
  const count = (id: CategoryId | "all") =>
    id === "all" ? cases.length : cases.filter((c) => c.category === id).length;
  const label = categories.find((c) => c.id === active)?.label ?? "All";
  const n = list.length;
  const lead = list.filter((c) => c.featured).length; // full-width cards on top
  const rest = n - lead;

  return (
    <>
      <div className="work-filters" role="group" aria-label="Filter work by type">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className="work-filter"
            aria-pressed={active === c.id}
            onClick={() => setActive(c.id)}
          >
            {c.label}
            <span className="work-count" aria-hidden="true">
              {count(c.id)}
            </span>
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {n === 1 ? "1 project" : `${n} projects`} in {label}
      </p>

      {n === 0 ? (
        <p className="work-empty">New {label.toLowerCase()} are on the way.</p>
      ) : (
        <div className="cases">
          {list.map((c, i) => {
            // Rows of three; a last row of two (or a single card) gets wider cards.
            const j = i - lead; // position among the regular cards
            const wide = !c.featured && (rest === 1 || (rest % 3 === 2 && j >= rest - 2));
            return (
              <Reveal
                key={c.site?.url ?? c.name}
                delay={((i % 3) + 1) as 1 | 2 | 3}
                as="article"
                className={`case${c.featured ? " featured" : wide ? " wide" : ""}`}
              >
                <div className={`shot${toneClass[c.tone ?? "brown"]}${c.site ? " has-site" : ""}`}>
                  <span className="mono">{c.tag}</span>
                  {c.site ? (
                    <figure className="mini-browser">
                      <div className="browser-bar" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                        <span className="browser-url">{c.site.host}</span>
                      </div>
                      {/* eslint-disable-next-line @next/next/no-img-element -- static screenshot, sized by CSS */}
                      <img
                        src={c.site.img}
                        alt={`Screenshot of ${c.site.host}`}
                        width={1120}
                        height={700}
                        loading="lazy"
                        decoding="async"
                      />
                    </figure>
                  ) : (
                    <strong>{c.name}</strong>
                  )}
                </div>
                <div className="body">
                  <span className="mono">{c.tag}</span>
                  <h3>{c.name}</h3>
                  <p>{c.text}</p>
                  {c.site && (
                    <a className="case-link" href={c.site.url} target="_blank" rel="noopener noreferrer">
                      Visit {c.site.host} <span aria-hidden="true">↗</span>
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </>
  );
}
