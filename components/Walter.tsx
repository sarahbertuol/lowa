/**
 * Walter, the studio's Shih Tzu, sitting and facing forward (pose 02 of the Walter asset pack).
 * A transparent raster cut from the approved character sheet. The whole image is animated
 * from CSS (jump in the preloader, breathing in the hero), so it can appear more than once.
 */
export default function Walter({ className = "" }: { className?: string }) {
  return (
    <picture>
      <source srcSet="/walter/walter-sit.webp" type="image/webp" />
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative sprite, sized by CSS */}
      <img
        className={`walter ${className}`.trim()}
        src="/walter/walter-sit.png"
        width={252}
        height={315}
        alt=""
        aria-hidden="true"
        draggable={false}
        decoding="async"
      />
    </picture>
  );
}
