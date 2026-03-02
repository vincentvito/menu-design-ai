import { CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ShowcaseCard, type ShowcaseItem } from "./showcase-card";

const stats = [
  { value: "500+", label: "Menus designed" },
  { value: "50+", label: "Restaurant styles" },
  { value: "24h", label: "Average turnaround" },
  { value: "4.9/5", label: "Customer rating" },
];

const showcaseItems: ShowcaseItem[] = [
  {
    id: 1,
    restaurantName: "La Bella Vita",
    cuisineLabel: "Italian",
    styleLabel: "Classic Elegance",
    imageUrl: "/showcase/la-bella-vita.png",
    gradient: "from-amber-100 to-orange-200",
  },
  {
    id: 2,
    restaurantName: "Sakura Omakase",
    cuisineLabel: "Japanese",
    styleLabel: "Modern Editorial",
    imageUrl: "/showcase/sakura.png",
    gradient: "from-stone-100 to-stone-200",
  },
  {
    id: 3,
    restaurantName: "El Fuego",
    cuisineLabel: "Mexican",
    styleLabel: "Warm Artisan",
    imageUrl: "/showcase/el-fuego.png",
    gradient: "from-red-200 to-orange-300",
  },
  {
    id: 4,
    restaurantName: "Le Petit Bistro",
    cuisineLabel: "French",
    styleLabel: "Dark Dramatic",
    imageUrl: "/showcase/le-petit-bistro.png",
    gradient: "from-slate-700 to-slate-900",
  },
  {
    id: 5,
    restaurantName: "The Spice Route",
    cuisineLabel: "Indian",
    styleLabel: "Warm Artisan",
    imageUrl: "/showcase/spice-route.png",
    gradient: "from-yellow-200 to-amber-300",
  },
  {
    id: 6,
    restaurantName: "Verdant",
    cuisineLabel: "Vegan",
    styleLabel: "Modern Editorial",
    imageUrl: "/showcase/verdant.png",
    gradient: "from-emerald-100 to-green-200",
  },
  {
    id: 7,
    restaurantName: "Ember & Oak",
    cuisineLabel: "Steakhouse",
    styleLabel: "Dark Dramatic",
    imageUrl: "/showcase/ember-and-oak.png",
    gradient: "from-stone-800 to-stone-950",
  },
  {
    id: 8,
    restaurantName: "Golden Dragon",
    cuisineLabel: "Chinese",
    styleLabel: "Classic Elegance",
    imageUrl: "/showcase/noodle-house.png",
    gradient: "from-red-100 to-red-200",
  },
  {
    id: 9,
    restaurantName: "Olive & Thyme",
    cuisineLabel: "Mediterranean",
    styleLabel: "Warm Artisan",
    imageUrl: "/showcase/olive-and-thyme.png",
    gradient: "from-lime-100 to-emerald-200",
  },
  {
    id: 10,
    restaurantName: "Seoul Kitchen",
    cuisineLabel: "Korean",
    styleLabel: "Dark Dramatic",
    imageUrl: "/showcase/seoul-kitchen.png",
    gradient: "from-indigo-800 to-violet-900",
  },
  {
    id: 11,
    restaurantName: "Daily Bread",
    cuisineLabel: "Cafe",
    styleLabel: "Classic Elegance",
    imageUrl: "/showcase/daily-bread.png",
    gradient: "from-stone-100 to-stone-200",
  },
];

const DESKTOP_VISIBLE = 7;

export function DesignersShowcaseSection() {
  const desktopItems = showcaseItems.slice(0, DESKTOP_VISIBLE);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Stats bar */}
        <div className="grid grid-cols-2 gap-8 border-y py-12 text-center md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-bold text-primary">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Headline block */}
        <div className="mt-16 text-center">
          <Badge
            variant="outline"
            className="mx-auto inline-flex items-center gap-1.5 px-4 py-1.5 text-sm"
          >
            <CheckCircle className="size-3.5" />
            Over 2,000 projects delivered
          </Badge>

          <h2 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl lg:text-5xl">
            Work with{" "}
            <span className="inline-flex items-center whitespace-nowrap rounded-full bg-primary px-4 py-0.5 text-primary-foreground sm:px-5 sm:py-1">
              professional designers
            </span>
            , not just AI.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            No design experience? No worries. If you need to polish a visual or
            prepare it for print, our vetted designers can finalise your assets.
          </p>
        </div>

        {/* Showcase gallery — Desktop fan layout */}
        <div className="mt-16 hidden justify-center overflow-hidden py-8 md:flex">
          {desktopItems.map((item, index) => (
            <ShowcaseCard
              key={item.id}
              item={item}
              index={index}
              total={desktopItems.length}
              />
          ))}
        </div>

        {/* Showcase gallery — Mobile horizontal scroll */}
        <div className="mt-12 md:hidden">
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4">
            {showcaseItems.map((item) => (
              <div key={item.id} className="snap-center">
                <ShowcaseCard item={item} index={0} total={1} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
