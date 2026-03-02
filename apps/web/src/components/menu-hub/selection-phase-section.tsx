import Link from "next/link";
import { Download, Palette } from "lucide-react";
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
        You&apos;ve picked your favorite design. Download the PDF for free or
        upgrade to have a professional designer perfect it.
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

      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <Button asChild className="flex-1">
          <Link href={`/menus/${menu.id}/results`}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Link>
        </Button>
        <Button variant="outline" asChild className="flex-1">
          <Link href={`/menus/${menu.id}/order`}>
            <Palette className="mr-2 h-4 w-4" />
            Upgrade to Pro — $199
          </Link>
        </Button>
      </div>
      <Button variant="ghost" asChild className="w-full">
        <Link href={`/menus/${menu.id}/results`}>Change Selection</Link>
      </Button>
    </div>
  );
}
