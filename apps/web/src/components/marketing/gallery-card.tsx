import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface GalleryCardProps {
  name: string;
  cuisine: string;
  style: string;
}

export function GalleryCard({ name, cuisine, style }: GalleryCardProps) {
  return (
    <Card className="group overflow-hidden">
      {/* Image placeholder */}
      <div className="relative aspect-[3/4] bg-muted">
        <div className="absolute inset-0 flex items-center justify-center">
          <FileText className="size-12 text-muted-foreground/30" />
        </div>
        <div className="absolute inset-0 bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold">{name}</h3>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="secondary">{cuisine}</Badge>
          <span className="text-xs text-muted-foreground">{style}</span>
        </div>
      </CardContent>
    </Card>
  );
}
