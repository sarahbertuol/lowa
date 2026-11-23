import { ImageResponse } from "next/og";

/**
 * Link preview image for public proposals (OE-13): LoWa only, the same for every proposal.
 * The business name goes in the preview title, never in the image.
 */
export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#EDB08A", padding: "72px 80px", color: "#3A1E12" }}>
        <div style={{ fontSize: 44, fontFamily: "serif", display: "flex" }}>LoWa Studio</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 88, lineHeight: 1.02, letterSpacing: -2, maxWidth: 900 }}>A proposal for your business</div>
          <div style={{ fontSize: 28, marginTop: 28, color: "#4A2415" }}>Prepared by a small US web studio</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
