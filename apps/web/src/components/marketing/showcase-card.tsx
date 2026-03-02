import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ShowcaseItem {
  id: number;
  restaurantName: string;
  cuisineLabel: string;
  styleLabel: string;
  imageUrl: string | null;
  gradient: string;
}

interface ShowcaseCardProps {
  item: ShowcaseItem;
  index: number;
  total: number;
}

function getCardTransform(index: number, total: number) {
  const center = (total - 1) / 2;
  const offset = center === 0 ? 0 : (index - center) / center;

  const rotation = offset * 8;
  const translateY = Math.abs(offset) * 24;
  const scale = 1 - Math.abs(offset) * 0.05;

  return {
    transform: `rotate(${rotation}deg) translateY(${translateY}px) scale(${scale})`,
    zIndex: total - Math.abs(Math.round(offset * total)),
  };
}

export function ShowcaseCard({ item, index, total }: ShowcaseCardProps) {
  const style = getCardTransform(index, total);

  return (
    <div
      className="w-44 shrink-0 transition-transform duration-300 hover:!scale-105 hover:!z-50 lg:w-48"
      style={style}
    >
      <div className="overflow-hidden rounded-xl border bg-card shadow-lg">
        <div className="relative aspect-[3/4]">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={`${item.restaurantName} menu design`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${item.gradient}`}
            >
              <div className="px-3 text-center">
                <FileText className="mx-auto size-8 text-foreground/20" />
                <p className="mt-2 text-xs font-medium text-foreground/40">
                  {item.styleLabel}
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="truncate text-sm font-semibold">
            {item.restaurantName}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
              {item.cuisineLabel}
            </Badge>
            <span className="truncate text-[10px] text-muted-foreground">
              {item.styleLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
