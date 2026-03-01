import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MenuMockup } from "./menu-mockup";

export function HeroSection() {
  return (
    <section className="py-20 sm:py-28 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: Text */}
          <div className="space-y-6 text-center lg:text-left">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Your menu, redesigned by{" "}
              <span className="text-primary">AI + expert designers</span>
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground lg:mx-0">
              Upload your existing menu, pick your favorite AI-generated design,
              and a professional designer delivers the final print-ready
              version. First generation free.
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
