/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Agency proposals are private links: keep them out of search engines.
  async headers() {
    return [
      {
        source: "/proposal/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      // Private routine panel: not linked anywhere, not in robots.txt (that would expose it).
      {
        source: "/rotina-k7r2q9/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
      {
        source: "/rotina-k7r2q9",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ];
  },
};
export default nextConfig;
