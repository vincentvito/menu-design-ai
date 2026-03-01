import { HeroSection } from "@/components/marketing/hero-section";
import { HowItWorksPreview } from "@/components/marketing/how-it-works-preview";
import { SocialProofSection } from "@/components/marketing/social-proof-section";
import { CTASection } from "@/components/marketing/cta-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorksPreview />
      <SocialProofSection />
      <CTASection />
    </>
  );
}
