import type { Metadata } from "next";

import { Bento } from "@/components/marketing/Bento";
import { Comparison } from "@/components/marketing/Comparison";
import { Faq } from "@/components/marketing/Faq";
import { FinalCta } from "@/components/marketing/FinalCta";
import { Guide } from "@/components/marketing/Guide";
import { Hero } from "@/components/marketing/Hero";
import { KeywordMarquee } from "@/components/marketing/KeywordMarquee";
import { ProofStrip } from "@/components/marketing/ProofStrip";
import { StickyStory } from "@/components/marketing/StickyStory";
import { TreeSection } from "@/components/marketing/TreeSection";
import { JsonLd } from "@/components/shared/JsonLd";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <JsonLd />
      <Hero />
      <KeywordMarquee />
      <ProofStrip />
      <StickyStory />
      <TreeSection />
      <Bento />
      <Comparison />
      <Guide />
      <Faq />
      <FinalCta />
    </>
  );
}
