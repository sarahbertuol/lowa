const items = [
  "Website in a day",
  "Start at $920",
  "SEO-ready builds",
  "Free hosting forever*",
  "Fixed price",
  "No surprises",
  "Human-directed AI",
  "PageSpeed-first",
  "Your outside team",
];

// Each group repeats the list twice so one group is always wider than the widest screen.
const group = [...items, ...items];

export default function Ticker() {
  return (
    <div className="ticker" aria-label="Highlights">
      <div className="ticker-track">
        {[0, 1].map((g) => (
          <div key={g} className="ticker-group" aria-hidden={g === 1 || undefined}>
            {group.map((t, i) => (
              <span key={i} aria-hidden={(g === 0 && i >= items.length) || undefined}>
                {t}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
