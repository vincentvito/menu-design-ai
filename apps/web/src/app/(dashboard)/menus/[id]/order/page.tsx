"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { createMenuOrderCheckout } from "@/app/actions/credits";

export default function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: menuId } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [menuFormat, setMenuFormat] = useState<string | null>(null);
  const [pageLayout, setPageLayout] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: menu } = await supabase
        .from("menus")
        .select("restaurant_name, selected_image_id, menu_format, page_layout")
        .eq("id", menuId)
        .single();

      if (menu?.restaurant_name) setRestaurantName(menu.restaurant_name);
      if (menu?.menu_format) setMenuFormat(menu.menu_format);
      if (menu?.page_layout) setPageLayout(menu.page_layout);

      if (menu?.selected_image_id) {
        const { data: img } = await supabase
          .from("ai_generation_images")
          .select("image_url")
          .eq("id", menu.selected_image_id)
          .single();

        if (img?.image_url) setImageUrl(img.image_url);
      }

      setLoading(false);
    }
    load();
  }, [menuId, supabase]);

  async function handleCheckout() {
    setPurchasing(true);
    try {
      const result = await createMenuOrderCheckout(menuId);
      if (result.error) {
        toast.error(result.error);
      } else if (result.url) {
        window.location.assign(result.url);
        return;
      }
    } catch {
      toast.error("Failed to create checkout session");
    }
    setPurchasing(false);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="aspect-[3/4] w-full" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Upgrade to Professional Design</h1>
          <p className="text-muted-foreground">
            Love your AI design? Let a pro perfect it.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/menus/${menuId}/results`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Selected design preview */}
      <Card>
        <CardHeader>
          <CardTitle>Your Selected Design</CardTitle>
          <CardDescription>
            {restaurantName || "Menu"} — a professional designer will refine
            this into a polished, print-ready menu
          </CardDescription>
        </CardHeader>
        <CardContent>
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="Selected menu design"
              className="w-full rounded-lg border"
            />
          ) : (
            <div className="flex aspect-[3/4] items-center justify-center rounded-lg bg-muted">
              <p className="text-muted-foreground">No image available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order summary */}
      <Card>
        <CardHeader>
          <CardTitle>Upgrade Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Professional Design Upgrade</span>
              <span className="font-semibold">$199.00</span>
            </div>
            {menuFormat && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Format</span>
                <span>
                  {menuFormat === "photo"
                    ? "Photo Menu"
                    : menuFormat === "balanced"
                      ? "Balanced"
                      : "Text-Only / Elegant"}
                </span>
              </div>
            )}
            {pageLayout && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Pages</span>
                <span>
                  {pageLayout === "single"
                    ? "Single Page"
                    : pageLayout === "front_back"
                      ? "Front & Back"
                      : "Multi-page Booklet"}
                </span>
              </div>
            )}
            <div className="border-t pt-2">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span>$199.00</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
            <h4 className="font-semibold">What you get with the upgrade:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-primary" />
                Professional designer refines your AI design
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-primary" />
                Polished typography and layout
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-primary" />
                Print-ready PDF + editable source files (AI/PSD)
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-primary" />
                1 round of revisions included
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-primary" />
                Delivered within 3 business days
              </li>
            </ul>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={handleCheckout}
            disabled={purchasing}
          >
            {purchasing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="mr-2 h-4 w-4" />
            )}
            Upgrade for $199
          </Button>

          <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-3 w-3" />
            Secure payment via Stripe
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
