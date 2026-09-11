import type { MetadataRoute } from "next";

import { absoluteUrl, siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The workspace holds private working data and the API has nothing to index.
        disallow: ["/api/", `${siteConfig.appPath}/`, siteConfig.appPath],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
