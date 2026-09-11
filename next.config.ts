import type { NextConfig } from "next";

// Resolved once at build time and inlined into client bundles too, so the
// server and the browser agree on the site URL. Vercel's system variables are
// only visible on the server, which left client components on localhost.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  env: { NICHEDESK_SITE_URL: siteUrl },
};

export default nextConfig;
