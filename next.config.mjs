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
    ];
  },
};
export default nextConfig;
