import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — MenuAI",
  description:
    "MenuAI helps restaurants turn menu content into polished, print-ready designs with AI and professional designer support.",
};

export default function AboutPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          About MenuAI
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          MenuAI is built for restaurant owners who need high-quality menus
          without a long design process.
        </p>

        <div className="mt-12 space-y-8">
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">What We Do</h2>
            <p className="text-muted-foreground">
              We transform your menu content into visual menu concepts using AI,
              then optionally pair you with a professional designer to finalize
              typography, spacing, and print-ready output.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">How We Work</h2>
            <p className="text-muted-foreground">
              You upload or paste your menu, select your direction, generate 4
              concepts, and download your preferred version. If you need a
              premium finish, our designer-in-the-loop workflow handles the
              final polish.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Who It&apos;s For</h2>
            <p className="text-muted-foreground">
              Independent restaurants, cafes, food trucks, and multi-location
              operators who want fast iteration with consistent visual quality.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
