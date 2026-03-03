import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — MenuAI",
  description:
    "Read how MenuAI collects, uses, and protects personal data and uploaded menu content.",
};

export default function PrivacyPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated: March 3, 2026
        </p>

        <div className="mt-10 space-y-8 text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Information We Collect
            </h2>
            <p>
              We collect account details (such as name and email), billing
              records, and content you provide (including menu text and uploaded
              files) to operate the service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              How We Use Information
            </h2>
            <p>
              We use your data to provide menu generation, process payments,
              deliver purchased services, improve product quality, and prevent
              abuse.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Data Sharing
            </h2>
            <p>
              We share data only with service providers required to run MenuAI,
              such as authentication, storage, payment, and AI infrastructure
              partners.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Data Retention and Security
            </h2>
            <p>
              We retain data for as long as needed to provide the service and
              comply with legal obligations. We apply reasonable technical and
              organizational safeguards to protect data.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Contact
            </h2>
            <p>
              For privacy questions or requests, contact us at{" "}
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
