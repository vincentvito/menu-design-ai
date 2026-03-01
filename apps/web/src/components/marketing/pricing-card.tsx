import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PricingCardProps {
  title: string;
  price: string;
  priceNote: string;
  description: string;
  features: string[];
  cta: { label: string; href: string };
  badge?: string;
  highlighted?: boolean;
}

export function PricingCard({
  title,
  price,
  priceNote,
  description,
  features,
  cta,
  badge,
  highlighted,
}: PricingCardProps) {
  return (
    <Card
      className={cn(
        "relative flex flex-col",
        highlighted && "border-primary shadow-lg"
      )}
    >
      {badge && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          {badge}
        </Badge>
      )}
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <div>
          <p className="text-4xl font-bold">{price}</p>
          <p className="mt-1 text-sm text-muted-foreground">{priceNote}</p>
        </div>
        <ul className="space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={highlighted ? "default" : "outline"}
          asChild
        >
          <Link href={cta.href}>{cta.label}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
