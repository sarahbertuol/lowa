import { ImageResponse } from "next/og";

/**
 * Provisional LoWa Discover app icon: "LoWa" in Instrument Serif (butter) on sunset.
 * Text stays inside the central 60% so the same image works as a maskable icon.
 * Replace when Sarah sends the final icon (docs/PENDENCIAS.md).
 */
async function loadSerif(): Promise<{ regular: ArrayBuffer; italic: ArrayBuffer } | null> {
  try {
    // Without a browser user agent Google Fonts answers with TrueType files, which ImageResponse reads.
    const css = await (await fetch("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1")).text();
    const faces = [...css.matchAll(/font-style:\s*(normal|italic);[\s\S]*?src:\s*url\(([^)]+)\)/g)];
    const url = (style: string) => faces.find((f) => f[1] === style)?.[2];
    const [r, i] = [url("normal"), url("italic")];
    if (!r || !i) return null;
    const [regular, italic] = await Promise.all([r, i].map(async (u) => (await fetch(u)).arrayBuffer()));
    return { regular, italic };
  } catch {
    return null;
  }
}

export async function appIcon(size: number) {
  const fonts = await loadSerif();
  const fontSize = Math.round(size * 0.3);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#EDB08A",
          color: "#F4DFA4",
          fontFamily: fonts ? "Instrument Serif" : "serif",
          fontSize,
          letterSpacing: "-0.02em",
          paddingBottom: Math.round(size * 0.03),
        }}
      >
        <span>Lo</span>
        <span style={{ fontStyle: "italic" }}>Wa</span>
      </div>
    ),
    {
      width: size,
      height: size,
      fonts: fonts
        ? [
            { name: "Instrument Serif", data: fonts.regular, style: "normal", weight: 400 },
            { name: "Instrument Serif", data: fonts.italic, style: "italic", weight: 400 },
          ]
        : undefined,
    },
  );
}
