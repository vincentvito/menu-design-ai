import type { Metadata } from "next";
import { PricingCard } from "@/components/marketing/pricing-card";
import { FAQAccordion } from "@/components/marketing/faq-accordion";

export const metadata: Metadata = {
  title: "Pricing — MenuAI",
  description:
    "Simple, transparent pricing. Try AI designs for free, get a professional menu for $199, or go full service with food photography for $1,299.",
};

const faqItems = [
  {
    question: "What do I get with the free tier?",
    answer:
      "When you sign up, you get 1 free generation which produces 4 unique AI-generated menu designs. You can choose your cuisine type and design style, then see all 4 variations instantly.",
  },
  {
    question: "How does the $199 professional design work?",
    answer:
      "After you pick your favorite AI-generated design, a professional designer uses it as the foundation to create a polished, print-ready menu. You receive a high-resolution PDF and editable source files, with 1 revision included.",
  },
  {
    question: "What's included in the Full Service package?",
    answer:
      "The Full Service package includes everything in the Professional Design tier, plus food styling guidance and photography direction. It's done remotely — just send us photos of your food and ingredients, and our chefs will guide the styling. You get 2 revisions included.",
  },
  {
    question: "Can I buy more AI generations?",
    answer:
      "Yes! You can purchase credit packages at any time from your dashboard. Each credit gives you one generation of 4 unique AI menu designs.",
  },
  {
    question: "What file formats do I receive?",
    answer:
      "Professional Design and Full Service customers receive a print-ready PDF optimized for your paper size, plus editable source files (AI/PSD) so you can make future updates.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Professional Design menus are delivered in 3 business days. Full Service menus, which include photography direction and styling, are typically delivered in 5–7 business days.",
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
            Try AI designs for free. Pay only when you&apos;re ready.
          </p>
        </div>

        {/* 3-column pricing */}
        <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          <PricingCard
            title="AI Previews"
            price="Free"
            priceNote="1 generation included on signup"
            description="See what AI can create"
            features={[
              "4 unique AI menu designs",
              "Multiple cuisine & style options",
              "Buy more credits anytime",
            ]}
            cta={{ label: "Get started free", href: "/register" }}
          />
          <PricingCard
            title="Professional Design"
            price="$199"
            priceNote="per menu — one-time"
            description="Print-ready menu by a real designer"
            features={[
              "Based on your chosen AI design",
              "Print-ready PDF + source files",
              "1 revision included",
              "Delivered in 3 business days",
            ]}
            cta={{ label: "Start designing", href: "/register" }}
            highlighted
            badge="Most Popular"
          />
          <PricingCard
            title="Full Service"
            price="$1,299"
            priceNote="per menu — one-time"
            description="Photography + professional design"
            features={[
              "Everything in Professional Design",
              "Food styling + photography guidance",
              "Remote photo direction — send us photos of your food & ingredients",
              "Premium menu design",
              "2 revisions included",
              "Delivered in 5–7 business days",
            ]}
            cta={{ label: "Contact us", href: "mailto:hello@menuai.com" }}
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
