import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sparkles, CheckCircle, TrendingUp, Award } from "lucide-react";

export function MenuMockup() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* Menu card */}
      <div className="aspect-[3/4] rounded-xl border-2 bg-card p-8 shadow-2xl">
        {/* Restaurant header */}
        <div className="border-b pb-4 text-center">
          <h3 className="font-serif text-2xl font-bold">La Bella Vita</h3>
          <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
            Italian Cuisine
          </p>
        </div>

        {/* Menu items */}
        <div className="mt-6 space-y-4">
          {[
            { name: "Truffle Risotto", price: "$24" },
            { name: "Margherita Pizza", price: "$18" },
            { name: "Osso Buco", price: "$32" },
            { name: "Tiramisu", price: "$12" },
          ].map((item) => (
            <div key={item.name} className="flex items-end justify-between">
              <span className="text-sm font-medium">{item.name}</span>
              <span className="mb-0.5 flex-1 border-b border-dotted border-muted-foreground/30 mx-2" />
              <span className="text-sm text-muted-foreground">
                {item.price}
              </span>
            </div>
          ))}
        </div>

        <Separator className="my-6" />

        <p className="text-center text-xs italic text-muted-foreground">
          Est. 2024
        </p>
      </div>

      {/* Floating tags */}
      <Badge
        variant="secondary"
        className="absolute -top-3 -right-3 shadow-md"
      >
        <Sparkles className="mr-1 size-3" />
        AI-Powered
      </Badge>
      <Badge
        variant="outline"
        className="absolute top-1/4 -left-4 bg-background shadow-md"
      >
        <CheckCircle className="mr-1 size-3" />
        Print-Ready
      </Badge>
      <Badge
        variant="secondary"
        className="absolute bottom-1/3 -right-4 shadow-md"
      >
        <TrendingUp className="mr-1 size-3" />
        Increase Sales
      </Badge>
      <Badge
        variant="outline"
        className="absolute -bottom-3 left-1/4 bg-background shadow-md"
      >
        <Award className="mr-1 size-3" />
        Pro Designed
      </Badge>
    </div>
  );
}
