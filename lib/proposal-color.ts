/**
 * Derives AA-safe colours from a client's primary colour, so any brand colour
 * can be dropped into a proposal without breaking contrast.
 */

type RGB = [number, number, number];

function parse(hex: string): RGB {
  const h = hex.replace("#", "").trim();
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [242, 106, 27];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: RGB): string {
  return "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
}

function luminance([r, g, b]: RGB): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(a: string, b: string): number {
  const la = luminance(parse(a));
  const lb = luminance(parse(b));
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

/** Moves `color` towards `toward` until it reaches `min` contrast against `bg`. */
function adjust(color: string, toward: string, bg: string, min: number): string {
  const c = parse(color);
  const t = parse(toward);
  for (let i = 0; i <= 20; i++) {
    const out = toHex(mix(c, t, i / 20));
    if (contrast(out, bg) >= min) return out;
  }
  return toward;
}

export const INK = "#3A1E12";
export const LIGHT = "#FFFBF5";
export const CREAM = "#F7F0E6";
export const NIGHT = "#1B120D";

export function accentPalette(primary: string) {
  const accent = toHex(parse(primary));
  // Text placed on the accent fill: whichever of ink or light reads better.
  const onAccent = contrast(INK, accent) >= contrast(LIGHT, accent) ? INK : LIGHT;
  return {
    accent,
    onAccent,
    // Accent used as text or as a 3:1 outline on the light and dark grounds.
    textLight: adjust(accent, INK, CREAM, 4.5),
    textDark: adjust(accent, "#FFFFFF", NIGHT, 4.5),
    lineLight: adjust(accent, INK, CREAM, 3),
  };
}
