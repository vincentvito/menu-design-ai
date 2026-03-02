import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle, TrendingUp, Award } from "lucide-react";

export function MenuMockup() {
  return (
    <div className="relative mx-auto flex w-full max-w-lg items-center justify-center py-8">
      {/* Back card — Daily Bread (café, hipster minimal) */}
      <div
        className="absolute w-48 sm:w-52 lg:w-56"
        style={{
          transform: "rotate(-12deg) translateX(-72px) translateY(-18px)",
          zIndex: 1,
        }}
      >
        <div className="aspect-[3/4] overflow-hidden rounded-xl border-2 bg-card shadow-xl">
          <img
            src="/showcase/daily-bread.png"
            alt="AI-generated menu design for Daily Bread café"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Front card — El Fuego (warm artisan, Mexican) */}
      <div
        className="relative w-48 sm:w-52 lg:w-56"
        style={{
          transform: "rotate(6deg) translateX(48px) translateY(10px)",
          zIndex: 2,
        }}
      >
        <div className="aspect-[3/4] overflow-hidden rounded-xl border-2 bg-card shadow-2xl">
          <img
            src="/showcase/el-fuego.png"
            alt="AI-generated menu design for El Fuego"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* Floating tags */}
      <Badge
        className="absolute -top-1 right-0 z-10 bg-primary text-primary-foreground shadow-md sm:right-4"
      >
        <Sparkles className="mr-1 size-3" />
        AI-Powered
      </Badge>
      <Badge
        variant="outline"
        className="absolute top-1/4 -left-2 z-10 bg-background shadow-md sm:left-0"
      >
        <CheckCircle className="mr-1 size-3" />
        Print-Ready
      </Badge>
      <Badge
        className="absolute bottom-1/4 -right-2 z-10 bg-accent text-accent-foreground shadow-md sm:right-0"
      >
        <TrendingUp className="mr-1 size-3" />
        Increase Sales
      </Badge>
      <Badge
        variant="outline"
        className="absolute -bottom-1 left-1/4 z-10 bg-background shadow-md"
      >
        <Award className="mr-1 size-3" />
        Pro Designed
      </Badge>
    </div>
  );
}
