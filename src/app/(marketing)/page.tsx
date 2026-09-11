import type { Metadata } from "next";

import { Bento } from "@/components/marketing/Bento";
import { Comparison } from "@/components/marketing/Comparison";
import { Faq } from "@/components/marketing/Faq";
import { FinalCta } from "@/components/marketing/FinalCta";
import { Guide } from "@/components/marketing/Guide";
import { Hero } from "@/components/marketing/Hero";
import { KeywordMarquee } from "@/components/marketing/KeywordMarquee";
import { Pipeline } from "@/components/marketing/Pipeline";
import { ProofStrip } from "@/components/marketing/ProofStrip";
import { StickyStory } from "@/components/marketing/StickyStory";
import { TreeSection } from "@/components/marketing/TreeSection";
import { JsonLd } from "@/components/shared/JsonLd";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const Divider = () => <div aria-hidden="true" className="hairline mx-auto h-px max-w-7xl" />;

export default function HomePage() {
  return (
    <>
      <JsonLd />
      <Hero />
      <KeywordMarquee />
      <Pipeline />
      <ProofStrip />
      <Divider />
      <StickyStory />
      <TreeSection />
      <Bento />
      <Divider />
      <Comparison />
      <Divider />
      <Guide />
      <Divider />
      <Faq />
      <FinalCta />
    </>
  );
}
