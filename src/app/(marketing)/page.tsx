import type { Metadata } from "next";

import { Bento } from "@/components/marketing/Bento";
import { Comparison } from "@/components/marketing/Comparison";
import { Faq } from "@/components/marketing/Faq";
import { FinalCta } from "@/components/marketing/FinalCta";
import { Guide } from "@/components/marketing/Guide";
import { Hero } from "@/components/marketing/Hero";
import { ProofStrip } from "@/components/marketing/ProofStrip";
import { Showcase } from "@/components/marketing/Showcase";
import { Steps } from "@/components/marketing/Steps";
import { JsonLd } from "@/components/shared/JsonLd";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <JsonLd />
      <Hero />
      <ProofStrip />
      <Showcase />
      <Bento />
      <Steps />
      <Comparison />
      <Guide />
      <Faq />
      <FinalCta />
    </>
  );
}
