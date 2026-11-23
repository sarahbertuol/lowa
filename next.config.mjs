/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Agency proposals, Opportunity Engine proposals and the internal app are private:
  // keep them out of search engines.
  async headers() {
    const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];
    // Private app and public proposals (OE-16): no framing by other sites, no type sniffing.
    // SAMEORIGIN (not DENY) so our own previews and the 390px test frame still work (OE-17).
    const hardened = [
      ...noindex,
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
      { key: "X-Content-Type-Options", value: "nosniff" },
    ];
    const app = [
      ...hardened,
      { key: "Referrer-Policy", value: "same-origin" },
      { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=()" },
    ];
    return [
      { source: "/proposal/:path*", headers: noindex },
      // The token is the key: never send it to other sites as a referrer.
      { source: "/opportunity/:path*", headers: [...hardened, { key: "Referrer-Policy", value: "no-referrer" }] },
      { source: "/discover", headers: app },
      { source: "/discover/:path*", headers: app },
      { source: "/api/discover/:path*", headers: app },
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
