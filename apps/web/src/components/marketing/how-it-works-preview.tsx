import Link from "next/link";
import { Upload, Palette, Wand2, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: Upload,
    title: "Upload Menu",
    desc: "Photo, PDF, or just paste your menu text",
  },
  {
    icon: Palette,
    title: "Pick a Style",
    desc: "Choose cuisine type + design style for your restaurant",
  },
  {
    icon: Wand2,
    title: "AI Generates 4 Designs",
    desc: "Get 4 unique menu designs in seconds — pick your favorite",
  },
  {
    icon: FileCheck,
    title: "Pro Designer Delivers",
    desc: "A real designer creates your final print-ready menu for $199",
  },
];

export function HowItWorksPreview() {
  return (
    <section className="bg-muted/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold">How it works</h2>
          <p className="mt-2 text-muted-foreground">
            From upload to print-ready in 4 simple steps
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <Card key={step.title}>
              <CardContent className="pt-6">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-primary/10">
                  <step.icon className="size-6 text-primary" />
                </div>
                <Badge variant="secondary" className="mb-2">
                  Step {i + 1}
                </Badge>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step.desc}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button variant="outline" asChild>
            <Link href="/how-it-works">Learn more</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
