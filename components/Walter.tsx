/**
 * Walter, the studio's Shih Tzu, sitting and facing forward.
 * Drawn from photos: white fluffy body, silver head with a white blaze, long dark grey ears,
 * a shaggy caramel beard, black nose, happy open mouth showing little teeth, lilac bow.
 * Flat fills only (no ids), so several copies can live on one page.
 * Animated parts carry class names: w-body, w-head, w-tail, w-paws, w-eyes, w-shadow.
 */
export default function Walter({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`walter ${className}`.trim()}
      viewBox="14 14 116 150"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse className="w-shadow" cx="72" cy="158" rx="42" ry="4.5" fill="rgba(74,36,21,.18)" />

      <g className="w-body">
        {/* Plumed tail curling up behind the right side */}
        <g className="w-tail">
          <path d="M100 118 C 104 104, 110 94, 120 86 C 126 82, 130 86, 127 92 C 131 94, 129 100, 124 101 C 127 106, 122 110, 117 108 C 116 114, 110 118, 104 120 Z" fill="#ECE6DE" />
          <path d="M106 112 C 110 102, 116 94, 122 90 C 125 93, 122 98, 118 100 C 120 104, 115 106, 112 105" fill="#F8F5F0" />
        </g>

        {/* Fluffy sitting body */}
        <path d="M36 154 C 30 142, 30 130, 35 120 C 32 112, 38 101, 49 96 C 60 91, 84 91, 95 96 C 106 101, 112 112, 109 120 C 114 130, 114 142, 108 154 Z" fill="#FBF8F3" />
        {/* Front legs */}
        <path d="M48 118 C 46 132, 46 142, 47 150 L 66 150 C 66 140, 65 128, 63 118 Z" fill="#F4EFE8" />
        <path d="M96 118 C 98 132, 98 142, 97 150 L 78 150 C 78 140, 79 128, 81 118 Z" fill="#F4EFE8" />
        <path d="M58 102 q3 8 0 15 M72 100 q2 9 0 16 M86 102 q-3 8 0 15" stroke="#E6DED3" strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* Front paws */}
        <g className="w-paws">
          <ellipse cx="57" cy="152" rx="13.5" ry="8.5" fill="#FFFDF9" stroke="#E3DACE" strokeWidth="1.2" />
          <ellipse cx="87" cy="152" rx="13.5" ry="8.5" fill="#FFFDF9" stroke="#E3DACE" strokeWidth="1.2" />
          <path d="M52 155 v-3 M57 156 v-3 M62 155 v-3 M82 155 v-3 M87 156 v-3 M92 155 v-3" stroke="#D9CFC2" strokeWidth="1.2" strokeLinecap="round" />
        </g>

        {/* Lilac bow on the collar */}
        <g className="w-bow">
          <path d="M72 96 L 62 90 C 58 92, 58 100, 62 102 Z" fill="#A390D8" />
          <path d="M72 96 L 82 90 C 86 92, 86 100, 82 102 Z" fill="#A390D8" />
          <circle cx="72" cy="96" r="3.2" fill="#8571BF" />
        </g>

        <g className="w-head">
          {/* Long dark grey ears with wavy edges */}
          <path d="M45 42 C 31 45, 24 60, 26 74 C 23 82, 28 88, 26 95 C 28 104, 37 109, 43 104 C 49 108, 55 99, 52 91 C 55 77, 53 58, 49 46 Z" fill="#55565C" />
          <path d="M99 42 C 113 45, 120 60, 118 74 C 121 82, 116 88, 118 95 C 116 104, 107 109, 101 104 C 95 108, 89 99, 92 91 C 89 77, 91 58, 95 46 Z" fill="#55565C" />
          <path d="M33 62 q-2 14 1 30 M40 66 q-1 14 2 30 M111 62 q2 14 -1 30 M104 66 q1 14 -2 30" stroke="#74767D" strokeWidth="1.4" fill="none" strokeLinecap="round" />

          {/* Head: white base, silver sides, white blaze down the middle */}
          <path d="M40 60 C 38 40, 52 28, 72 28 C 92 28, 106 40, 104 60 C 104 78, 92 90, 72 90 C 52 90, 40 78, 40 60 Z" fill="#F7F4EF" />
          <path d="M41 60 C 39 42, 51 30, 66 28 C 65 37, 64 46, 63 52 C 59 60, 51 65, 45 65 Z" fill="#A1A3A9" />
          <path d="M103 60 C 105 42, 93 30, 78 28 C 79 37, 80 46, 81 52 C 85 60, 93 65, 99 65 Z" fill="#A1A3A9" />
          <path d="M47 47 C 51 44, 59 45, 62 50 C 60 57, 52 60, 47 57 Z M97 47 C 93 44, 85 45, 82 50 C 84 57, 92 60, 97 57 Z" fill="#7F8188" />
          {/* Fluffy top-knot */}
          <path d="M55 32 C 56 24, 62 22, 65 27 C 67 20, 77 20, 79 27 C 82 22, 88 24, 89 32 C 82 30, 62 30, 55 32 Z" fill="#F7F4EF" />

          {/* Round dark eyes */}
          <g className="w-eyes">
            <circle cx="55" cy="53" r="5.8" fill="#1E1410" />
            <circle cx="89" cy="53" r="5.8" fill="#1E1410" />
            <circle cx="57" cy="51" r="1.9" fill="#FFFFFF" />
            <circle cx="91" cy="51" r="1.9" fill="#FFFFFF" />
          </g>

          {/* Shaggy caramel beard and moustache */}
          <path d="M49 63 C 54 56, 90 56, 95 63 L 97 70 L 92 72 L 96 78 L 89 80 L 91 87 L 84 86 L 84 93 L 77 89 L 72 95 L 67 89 L 60 93 L 60 86 L 53 87 L 55 80 L 48 78 L 52 72 L 47 70 Z" fill="#C49C70" />
          <ellipse cx="72" cy="70" rx="14" ry="9" fill="#E2CCAE" />
          <path d="M62 64 l-12 -2 M62 67 l-13 3 M63 70 l-11 7 M82 64 l12 -2 M82 67 l13 3 M81 70 l11 7 M67 82 l-3 9 M77 82 l3 9" stroke="#9C7148" strokeWidth="1.1" strokeLinecap="round" />

          {/* Nose */}
          <ellipse cx="72" cy="63" rx="8.2" ry="6.2" fill="#141010" />
          <ellipse cx="69.2" cy="61.2" rx="2.3" ry="1.3" fill="#5C5252" />

          {/* Happy open mouth: tongue, little upper and lower teeth */}
          <path d="M60 75 Q72 88 84 75 Q80 87 72 87 Q64 87 60 75 Z" fill="#3A1E1A" />
          <path d="M64 80 Q72 88 80 80 Q77 86 72 86 Q67 86 64 80 Z" fill="#E88B8B" />
          <path d="M63 76.6 h18" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeDasharray="2.4 1.4" />
          <path d="M66 84.8 h12" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeDasharray="2 1.4" />
        </g>
      </g>
    </svg>
  );
}
