import { HeroSection } from "@/components/marketing/hero-section";
import { HowItWorksPreview } from "@/components/marketing/how-it-works-preview";
import { DesignersShowcaseSection } from "@/components/marketing/designers-showcase-section";
import { CTASection } from "@/components/marketing/cta-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorksPreview />
      <DesignersShowcaseSection />
      <CTASection />
    </>
  );
}
