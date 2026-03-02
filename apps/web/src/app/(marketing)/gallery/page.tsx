import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GalleryCard } from "@/components/marketing/gallery-card";

export const metadata: Metadata = {
  title: "Gallery — MenuAI",
  description:
    "Browse menu designs created by MenuAI and our professional designers. Italian, Japanese, Mexican, French, Korean, Vegan, Steakhouse, and more.",
};

const galleryItems = [
  { id: 1, name: "La Bella Vita", cuisine: "Italian", style: "Classic Elegance", imageUrl: "/showcase/la-bella-vita.png" },
  { id: 2, name: "Sakura Omakase", cuisine: "Japanese", style: "Modern Editorial", imageUrl: "/showcase/sakura.png" },
  { id: 3, name: "El Fuego", cuisine: "Mexican", style: "Warm Artisan", imageUrl: "/showcase/el-fuego.png" },
  { id: 4, name: "Le Petit Bistro", cuisine: "French", style: "Dark Dramatic", imageUrl: "/showcase/le-petit-bistro.png" },
  { id: 5, name: "The Spice Route", cuisine: "Indian", style: "Warm Artisan", imageUrl: "/showcase/spice-route.png" },
  { id: 6, name: "Verdant", cuisine: "Vegan", style: "Modern Editorial", imageUrl: "/showcase/verdant.png" },
  { id: 7, name: "Ember & Oak", cuisine: "Steakhouse", style: "Dark Dramatic", imageUrl: "/showcase/ember-and-oak.png" },
  { id: 8, name: "Golden Dragon Noodle House", cuisine: "Chinese", style: "Classic Elegance", imageUrl: "/showcase/noodle-house.png" },
  { id: 9, name: "Olive & Thyme", cuisine: "Mediterranean", style: "Warm Artisan", imageUrl: "/showcase/olive-and-thyme.png" },
  { id: 10, name: "Seoul Kitchen", cuisine: "Korean", style: "Dark Dramatic", imageUrl: "/showcase/seoul-kitchen.png" },
  { id: 11, name: "Daily Bread", cuisine: "Cafe", style: "Classic Elegance", imageUrl: "/showcase/daily-bread.png" },
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
              imageUrl={item.imageUrl}
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
