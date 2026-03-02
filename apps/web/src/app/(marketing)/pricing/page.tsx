import type { Metadata } from "next";
import { PricingCard } from "@/components/marketing/pricing-card";
import { FAQAccordion } from "@/components/marketing/faq-accordion";

export const metadata: Metadata = {
  title: "Pricing — MenuAI",
  description:
    "Simple, transparent pricing. Generate AI menu designs for free, download your PDF, and optionally upgrade to professional designer refinement for $199.",
};

const faqItems = [
  {
    question: "What do I get for free?",
    answer:
      "When you sign up, you get 1 free generation which produces 4 unique AI-generated menu designs. Pick your favorite and download it as a PDF — completely free. You can buy more credits anytime to generate additional designs.",
  },
  {
    question: "What is the $199 professional design upgrade?",
    answer:
      "After you download your free AI-generated menu PDF, you can optionally upgrade to professional design. A real designer refines your AI design into a polished, print-ready menu with proper typography and layout. You receive a high-resolution PDF and editable source files (AI/PSD), with 1 revision included.",
  },
  {
    question: "Can I buy more AI generations?",
    answer:
      "Yes! You can purchase credit packages at any time from your dashboard. Each credit gives you one generation of 4 unique AI menu designs, each with a free PDF download.",
  },
  {
    question: "What file formats do I receive?",
    answer:
      "The free tier gives you a PDF of your AI-generated design. If you upgrade to Professional Design, you also receive editable source files (AI/PSD) so you can make future updates.",
  },
  {
    question: "How long does the professional design take?",
    answer:
      "Professional Design menus are delivered within 3 business days after payment.",
  },
];

export default function PricingPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Generate AI menu designs for free. Upgrade only if you want a
            pro touch.
          </p>
        </div>

        {/* 2-column pricing */}
        <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-2">
          <PricingCard
            title="AI Menu Design"
            price="Free"
            priceNote="1 generation included on signup"
            description="Generate, download, and print"
            features={[
              "4 unique AI menu designs per generation",
              "Multiple cuisine & style options",
              "Refine with AI variations",
              "Free PDF download of your design",
              "Buy more credits anytime",
            ]}
            cta={{ label: "Get started free", href: "/register" }}
          />
          <PricingCard
            title="Professional Design"
            price="$199"
            priceNote="per menu — optional upgrade"
            description="A real designer perfects your AI menu"
            features={[
              "Everything in the free tier",
              "Professional designer refines your AI design",
              "Polished typography and layout",
              "Print-ready PDF + editable source files",
              "1 revision included",
              "Delivered in 3 business days",
            ]}
            cta={{ label: "Start designing", href: "/register" }}
            highlighted
            badge="Most Popular"
          />
        </div>

        {/* FAQ */}
        <div className="mx-auto mt-24 max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold">
            Frequently asked questions
          </h2>
          <FAQAccordion items={faqItems} />
        </div>
      </div>
    </div>
  );
}
