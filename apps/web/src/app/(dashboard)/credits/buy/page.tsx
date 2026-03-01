"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Coins, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createCheckoutSession } from "@/app/actions/credits";
import type { CreditPackage } from "@/types/menu";

export default function BuyCreditsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (data) setPackages(data as CreditPackage[]);
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleBuy(pkg: CreditPackage) {
    setPurchasing(pkg.id);
    try {
      const result = await createCheckoutSession(pkg.id);
      if (result.error) {
        toast.error(result.error);
      } else if (result.url) {
        window.location.href = result.url;
        return; // Don't reset purchasing state — navigating away
      }
    } catch {
      toast.error("Failed to create checkout session");
    }
    setPurchasing(null);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Buy Credits</h1>
          <p className="text-muted-foreground">
            Each credit generates 4 AI menu design samples
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/credits")}>
          <ArrowLeft className="mr-2 h-4 w-4" />Back
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {packages.map((pkg) => (
          <Card
            key={pkg.id}
            className={`relative ${pkg.is_popular ? "border-primary shadow-md" : ""}`}
          >
            {pkg.is_popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />Most Popular
                </Badge>
              </div>
            )}
            <CardHeader className="text-center">
              <CardTitle className="text-lg">{pkg.name}</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-foreground">
                  ${pkg.price_usd}
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-lg font-semibold">
                <Coins className="h-5 w-5 text-primary" />
                {pkg.credits} credits
              </div>
              <p className="text-center text-sm text-muted-foreground">
                ${(pkg.price_usd / pkg.credits).toFixed(2)} per generation
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-primary" />
                  {pkg.credits * 4} total AI samples
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-primary" />
                  Never expire
                </li>
              </ul>
              <Button
                className="w-full"
                variant={pkg.is_popular ? "default" : "outline"}
                onClick={() => handleBuy(pkg)}
                disabled={purchasing === pkg.id}
              >
                {purchasing === pkg.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Buy {pkg.name}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Payments processed securely via Stripe. Credits are added instantly.
      </p>
    </div>
  );
}
