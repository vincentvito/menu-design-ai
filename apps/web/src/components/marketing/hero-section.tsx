import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MenuMockup } from "./menu-mockup";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28 lg:py-32">
      {/* Subtle gradient background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 h-[800px] w-[800px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/4 h-[600px] w-[600px] rounded-full bg-accent/5 blur-3xl" />
      </div>
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Text */}
          <div className="space-y-6 text-center lg:text-left">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Your menu, redesigned by{" "}
              <span className="text-primary">AI in seconds</span>
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground lg:mx-0">
              Upload your existing menu, pick your favorite AI-generated design,
              and download a print-ready PDF — completely free. Want it
              perfected? Upgrade to professional designer refinement.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Button size="lg" asChild>
                <Link href="/register">Try it free</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/how-it-works">How it works</Link>
              </Button>
            </div>
          </div>

          {/* Right: Mockup */}
          <div className="flex justify-center lg:justify-end">
            <MenuMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
