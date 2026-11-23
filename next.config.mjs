/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Agency proposals, Opportunity Engine proposals and the internal app are private:
  // keep them out of search engines.
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    return [
      { source: "/proposal/:path*", headers: noindex },
      // The token is the key: never send it to other sites as a referrer.
      { source: "/opportunity/:path*", headers: [...noindex, { key: "Referrer-Policy", value: "no-referrer" }] },
      { source: "/discover", headers: noindex },
      { source: "/discover/:path*", headers: noindex },
      { source: "/api/discover/:path*", headers: noindex },
      {
        // The worker lives in /discover/ but also controls /discover itself.
        source: "/discover/sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/discover" },
          { key: "Cache-Control", value: "no-cache" },
        ],
      },
    ];
  },
};
export default nextConfig;
