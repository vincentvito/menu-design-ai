import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — MenuAI",
  description:
    "Read the terms governing your use of MenuAI, including billing, content ownership, and service limitations.",
};

export default function TermsPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated: March 3, 2026
        </p>

        <div className="mt-10 space-y-8 text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Service Overview
            </h2>
            <p>
              MenuAI provides AI-assisted menu concept generation and optional
              professional design refinement services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Accounts and Access
            </h2>
            <p>
              You are responsible for maintaining account security and for all
              activity under your account.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Billing and Purchases
            </h2>
            <p>
              Paid features are billed at the prices shown at checkout. Credits
              and upgrade purchases are processed through third-party payment
              providers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Content Ownership
            </h2>
            <p>
              You retain ownership of menu content you submit. You grant MenuAI
              the rights needed to process that content and deliver results.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Limitation of Liability
            </h2>
            <p>
              MenuAI is provided on an as-available basis. To the extent
              permitted by law, MenuAI is not liable for indirect or
              consequential damages.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Contact</h2>
            <p>
              For legal questions, contact us at{" "}
              <a className="text-primary underline" href="mailto:hello@menuai.com">
                hello@menuai.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
