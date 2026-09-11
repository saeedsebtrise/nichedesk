import work from "@/assets/screenshots/work.png";
import { FAQS } from "@/components/marketing/content";
import { absoluteUrl, siteConfig } from "@/config/site";

/**
 * Structured data for the landing page.
 *
 * The FAQ entries come from the same list the page renders, so the markup and
 * the visible answers cannot disagree — which is what Google asks for. No
 * rating or review is claimed: there are none to cite, and inventing them
 * breaks Google's structured-data policy.
 */
export function JsonLd() {
  const graph = [
    {
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      url: siteConfig.url,
      name: siteConfig.name,
      description: siteConfig.description,
      inLanguage: "en",
    },
    {
      "@type": "SoftwareApplication",
      "@id": absoluteUrl("/#app"),
      name: siteConfig.name,
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Etsy keyword research",
      operatingSystem: "Web",
      url: absoluteUrl(siteConfig.appPath),
      description: siteConfig.description,
      screenshot: absoluteUrl(work.src),
      author: { "@type": "Person", name: siteConfig.author },
      isPartOf: { "@id": absoluteUrl("/#website") },
      featureList: [
        "Nested niche tree with unlimited depth",
        "eRank CSV import with column-name matching",
        "Import preview with including, excluding, volume and competition filters",
        "Custom competition colour thresholds",
        "Pending, done and tick tracking",
        "Bulk move, mark and delete",
        "CSV export",
      ],
    },
    {
      "@type": "FAQPage",
      "@id": absoluteUrl("/#faq"),
      isPartOf: { "@id": absoluteUrl("/#website") },
      mainEntity: FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ];

  // Escaping "<" keeps a stray "</script>" in any string from closing the tag early.
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(
    /</g,
    "\\u003c",
  );

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
