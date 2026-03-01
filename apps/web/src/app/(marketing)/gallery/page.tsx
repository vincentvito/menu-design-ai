import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GalleryCard } from "@/components/marketing/gallery-card";

export const metadata: Metadata = {
  title: "Gallery — MenuAI",
  description:
    "Browse menu designs created by MenuAI and our professional designers. Italian, Japanese, Mexican, French, and more.",
};

const galleryItems = [
  { id: 1, name: "La Bella Vita", cuisine: "Italian", style: "Elegant" },
  { id: 2, name: "Sakura", cuisine: "Japanese", style: "Minimalist" },
  { id: 3, name: "El Fuego", cuisine: "Mexican", style: "Bold" },
  { id: 4, name: "Le Petit Bistro", cuisine: "French", style: "Classic" },
  { id: 5, name: "Spice Route", cuisine: "Indian", style: "Vibrant" },
  { id: 6, name: "The Green Table", cuisine: "American", style: "Modern" },
  { id: 7, name: "Noodle House", cuisine: "Chinese", style: "Traditional" },
  { id: 8, name: "Olive & Thyme", cuisine: "Mediterranean", style: "Warm" },
  { id: 9, name: "Seoul Kitchen", cuisine: "Korean", style: "Contemporary" },
];

export default function GalleryPage() {
  return (
    <div className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header */}
        <div className="mb-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Our Portfolio
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Browse menu designs created by MenuAI + our professional designers
          </p>
        </div>

        {/* Gallery grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {galleryItems.map((item) => (
            <GalleryCard
              key={item.id}
              name={item.name}
              cuisine={item.cuisine}
              style={item.style}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="mb-4 text-muted-foreground">
            Want a design like these?
          </p>
          <Button size="lg" asChild>
            <Link href="/register">Start your menu</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
