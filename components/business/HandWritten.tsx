import type { CSSProperties } from "react";
import { HAND_STROKES, HAND_VIEWBOX } from "./hand-strokes";

/**
 * /business hero: "done for you." drawn as if by pen, stroke after stroke (CSS only, no JS).
 * Screen readers and search read the real text; the drawing is decorative.
 * Exception to "transform and opacity only", approved by Sarah on 26/11/2026: the pen needs
 * stroke-dashoffset on this one small SVG (paint only, no layout).
 */
export default function HandWritten() {
  return (
    <em className="bz-hand">
      <span className="sr-only">done for you.</span>
      <svg viewBox={HAND_VIEWBOX} aria-hidden="true" focusable="false">
        {HAND_STROKES.map((s, i) => (
          <path key={i} d={s.d} style={{ "--l": s.l, "--t": `${s.t}s`, "--at": `${s.at}s` } as CSSProperties} />
        ))}
      </svg>
    </em>
  );
}
