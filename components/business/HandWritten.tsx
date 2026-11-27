import type { CSSProperties } from "react";
import { HAND_BOX, HAND_GLYPHS, HAND_UPM } from "./hand-strokes";

/**
 * /business hero: "done for you." in the same Instrument Serif Italic as before, drawn by pen:
 * a pen line traces each letter's outline, then the letter fills in and the line fades.
 * The real text stays in place (transparent) so layout, search and screen readers are unchanged;
 * the drawing sits on its baseline. CSS only, no JS.
 * Exception to "transform and opacity only", approved by Sarah on 26/11/2026: the pen needs
 * stroke-dashoffset on this one small SVG (paint only, no layout).
 */
const em = (n: number) => `${n / HAND_UPM}em`;

export default function HandWritten() {
  const { x, y, w, h } = HAND_BOX;
  return (
    <em className="bz-hand">
      <span className="bz-hand-anchor" aria-hidden="true">
        <svg
          viewBox={`${x} ${y} ${w} ${h}`}
          focusable="false"
          style={{ left: em(x), bottom: em(-(y + h)), width: em(w), height: em(h) }}
        >
          {HAND_GLYPHS.map((g, i) => {
            const v = { "--l": g.l, "--t": `${g.t}s`, "--at": `${g.at}s` } as CSSProperties;
            return (
              <g key={i} style={v}>
                <path className="f" d={g.d} />
                <path className="o" d={g.d} />
              </g>
            );
          })}
        </svg>
      </span>
      <span className="bz-hand-text">done for you.</span>
    </em>
  );
}
