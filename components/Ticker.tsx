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

export default function Ticker() {
  const row = [...items, ...items];
  return (
    <div className="ticker" aria-label="Highlights">
      <div className="ticker-track">
        {row.map((t, i) => (
          <span key={i} aria-hidden={i >= items.length || undefined}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
