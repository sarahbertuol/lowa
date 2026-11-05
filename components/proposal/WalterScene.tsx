/**
 * Walter plays ball in the proposal hero. CSS-only loop (app/proposal/proposal.css, "Walter scene"):
 * the ball comes, he heads it away; it stops far off, he runs (eyes closed), picks it up
 * with his mouth, trots back and tosses it again. Poses are swapped by opacity:
 * watch = pack pose 03 (eyes open, tongue out), run = eyes closed, mouth = ball in mouth.
 * With reduced motion he just stands watching the ball at his feet.
 */
const POSES = ["watch", "run", "mouth"] as const;

export default function WalterScene() {
  return (
    <div className="ws" aria-hidden="true">
      <div className="ws-ball-x">
        <span className="ws-shadow" />
        <span className="ws-ball-y">
          <svg viewBox="0 0 40 40" focusable="false">
            <circle cx="20" cy="20" r="19" fill="#D7372A" stroke="#3A1E12" strokeWidth="1.6" />
            <path d="M5.5 10.5C13 15 14.5 25 9 34M34.5 29.5C27 25 25.5 15 31 6" fill="none" stroke="#FFF4EA" strokeWidth="2.4" strokeLinecap="round" />
            <ellipse cx="13" cy="12" rx="5" ry="3" fill="#FFFFFF" opacity=".25" transform="rotate(-30 13 12)" />
          </svg>
        </span>
      </div>
      <div className="ws-dog-x">
        <div className="ws-dog-body">
          <div className="ws-dog-face">
            {POSES.map((p) => (
              // eslint-disable-next-line @next/next/no-img-element -- decorative sprite frames, sized by CSS
              <img key={p} className={`ws-pose ws-${p}`} src={`/walter/scene/${p}.webp`} width={352} height={320} alt="" decoding="async" draggable={false} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
