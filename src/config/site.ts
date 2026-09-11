/**
 * Single source of truth for site-wide metadata.
 *
 * NEXT_PUBLIC_SITE_URL must be set in production so canonical URLs, the sitemap
 * and Open Graph images resolve to absolute URLs.
 */
const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const siteConfig = {
  name: "NicheDesk",
  url: rawSiteUrl.replace(/\/$/, ""),
  tagline: "Turn an eRank export into a niche plan you can actually work through",
  // ~155 characters: the length search results show before truncating.
  description:
    "Organize eRank keyword exports into a nested niche tree. Filter 1,000+ Etsy keywords, color-code competition, and track every keyword from pending to done.",
  author: "Saeed Ahmed",
  locale: "en_US",
  /** Where the tool itself lives, so links and the sitemap stay in step. */
  appPath: "/app",
} as const;

export function absoluteUrl(path = "/"): string {
  return new URL(path, `${siteConfig.url}/`).toString();
}
