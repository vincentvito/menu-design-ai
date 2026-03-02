import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Menu } from "@/types/menu";

export function SelectionPhaseSection({
  menu,
  selectedImage,
}: {
  menu: Menu;
  selectedImage: { id: string; image_url: string } | null;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        You&apos;ve picked your favorite design. Complete your order to have a
        professional designer create the final print-ready menu.
      </p>

      {selectedImage && (
        <Card className="mx-auto max-w-md overflow-hidden">
          <CardContent className="p-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage.image_url}
              alt="Selected menu design"
              className="aspect-[3/4] w-full object-cover"
            />
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button variant="outline" asChild className="flex-1">
          <Link href={`/menus/${menu.id}/results`}>Change Selection</Link>
        </Button>
        <Button asChild className="flex-1">
          <Link href={`/menus/${menu.id}/order`}>
            Complete Order
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
