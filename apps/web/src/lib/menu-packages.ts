import type { MenuPackage } from "@/types/menu";

export interface MenuPackageDefinition {
  slug: MenuPackage;
  name: string;
  priceUsd: number;
  priceCents: number;
  priceLabel: string;
  description: string;
  features: string[];
  includesDigital: boolean;
  includesDesigner: boolean;
  isPaid: boolean;
}

export const MENU_PACKAGES: Record<MenuPackage, MenuPackageDefinition> = {
  basic: {
    slug: "basic",
    name: "Basic",
    priceUsd: 0,
    priceCents: 0,
    priceLabel: "Free",
    description: "Keep it simple with a print PDF export of your selected design.",
    features: [
      "Free print PDF download",
      "No digital hosted menu",
      "No QR code assets",
    ],
    includesDigital: false,
    includesDesigner: false,
    isPaid: false,
  },
  digital: {
    slug: "digital",
    name: "Digital",
    priceUsd: 29,
    priceCents: 2900,
    priceLabel: "$29",
    description: "Get a hosted mobile menu with downloadable QR assets.",
    features: [
      "Hosted mobile menu page",
      "Download QR PNG and SVG",
      "Download PDF with embedded QR",
    ],
    includesDigital: true,
    includesDesigner: false,
    isPaid: true,
  },
  pro: {
    slug: "pro",
    name: "Pro",
    priceUsd: 199,
    priceCents: 19900,
    priceLabel: "$199",
    description:
      "Designer refinement plus all Digital package deliverables included.",
    features: [
      "Professional designer refinement",
      "Print-ready final files",
      "Hosted mobile menu and QR assets included",
    ],
    includesDigital: true,
    includesDesigner: true,
    isPaid: true,
  },
};

export type PaidMenuPackage = Exclude<MenuPackage, "basic">;

export function isPaidMenuPackage(value: string): value is PaidMenuPackage {
  return value === "digital" || value === "pro";
}
