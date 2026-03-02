import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Menu } from "@/types/menu";

interface GenerationImage {
  id: string;
  image_url: string | null;
  status: string;
  variant_index: number;
}

export function GenerationPhaseSection({
  menu,
  images,
}: {
  menu: Menu;
  images: GenerationImage[];
}) {
  const isGenerating = menu.status === "generating_samples";
  const completedImages = images.filter((img) => img.status === "completed");

  return (
    <div className="space-y-4">
      {isGenerating ? (
        <>
          <p className="text-sm text-muted-foreground">
            Your AI designs are being generated. This takes about 30 seconds.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="flex aspect-[3/4] items-center justify-center p-0">
                  <Skeleton className="h-full w-full rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {completedImages.length} AI design
            {completedImages.length !== 1 ? "s" : ""} ready for review.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {completedImages.slice(0, 4).map((img) => (
              <Card key={img.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image_url!}
                    alt={`AI design ${img.variant_index + 1}`}
                    className="aspect-[3/4] w-full object-cover"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      <Button asChild className="w-full">
        <Link href={`/menus/${menu.id}/results`}>
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              View Live Progress
            </>
          ) : (
            <>
              View AI Designs
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Link>
      </Button>
    </div>
  );
}
