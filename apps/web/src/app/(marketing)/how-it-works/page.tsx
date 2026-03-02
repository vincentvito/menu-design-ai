import type { Metadata } from "next";
import Link from "next/link";
import { Upload, Palette, Wand2, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "How It Works — MenuAI",
  description:
    "Upload your menu, pick a style, get 4 AI-generated designs, and download your favorite as a free PDF. Optionally upgrade to professional designer refinement.",
};

const steps = [
  {
    icon: Upload,
    title: "Upload Your Menu",
    subtitle: "Photo, PDF, or just paste your menu text",
    description:
      "Getting started is simple. Take a photo of your current menu, upload a PDF, or paste the text directly. Our AI extracts all your dishes, prices, and sections automatically.",
    features: [
      "Supports JPEG, PNG, WebP, and PDF formats",
      "AI-powered text extraction (OCR)",
      "Paste text directly if you prefer",
      "Edit extracted data before designing",
    ],
  },
  {
    icon: Palette,
    title: "Choose Your Style",
    subtitle: "Pick cuisine type + design style",
    description:
      "Select the cuisine type that matches your restaurant, then browse our curated collection of design styles. Each style is crafted to complement specific food cultures.",
    features: [
      "50+ cuisine types available",
      "Curated design templates with color palettes",
      "Preview color schemes before generating",
      "Styles optimized for different paper sizes",
    ],
  },
  {
    icon: Wand2,
    title: "AI Generates 4 Designs",
    subtitle: "See 4 unique options in seconds",
    description:
      "Our AI creates 4 distinct menu designs based on your content, cuisine, and chosen style. Each variant offers a different take — compare them side by side and pick your favorite.",
    features: [
      "4 unique design variations per generation",
      "Results in under 60 seconds",
      "Regenerate with a different style anytime",
      "First generation is free",
    ],
  },
  {
    icon: Download,
    title: "Download Your Menu PDF",
    subtitle: "Free PDF download — upgrade to pro if you want",
    description:
      "Pick your favorite AI design and download it as a free PDF. Love the design but want it perfected? Optionally upgrade for $199 and a professional designer will refine the typography, spacing, and layout to deliver a polished print-ready menu.",
    features: [
      "Free PDF download of your AI-generated design",
      "Optional $199 upgrade for professional designer refinement",
      "Polished typography, layout, and print-ready files",
      "Editable source files (AI/PSD) with the upgrade",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            How MenuAI Works
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            From your current menu to a stunning redesign in 4 steps
          </p>
        </div>

        {/* Steps */}
        <div className="relative space-y-16">
          {/* Vertical connector line */}
          <div className="absolute bottom-0 left-8 top-0 hidden w-px bg-border lg:block" />

          {steps.map((step, i) => (
            <div
              key={step.title}
              className="grid items-start gap-8 lg:grid-cols-[80px_1fr]"
            >
              {/* Step number circle */}
              <div className="hidden size-16 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground lg:flex">
                {i + 1}
              </div>

              {/* Step card */}
              <Card>
                <CardHeader>
                  <div className="mb-2 flex items-center gap-3 lg:hidden">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {i + 1}
                    </div>
                    <Badge variant="secondary">Step {i + 1}</Badge>
                  </div>
                  <div className="mb-2 hidden lg:block">
                    <Badge variant="secondary">Step {i + 1}</Badge>
                  </div>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <step.icon className="size-5 text-primary" />
                    {step.title}
                  </CardTitle>
                  <CardDescription>{step.subtitle}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{step.description}</p>
                  <ul className="mt-4 space-y-2">
                    {step.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm"
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold">Ready to get started?</h2>
          <p className="mt-2 text-muted-foreground">
            Your first AI generation is free. No credit card required.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/register">Try it free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
