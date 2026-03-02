import { redirect, notFound } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MenuHubHeader } from "@/components/menu-hub/menu-hub-header";
import {
  MenuProgressBar,
  getPhase,
} from "@/components/menu-hub/menu-progress-bar";
import { SetupPhaseSection } from "@/components/menu-hub/setup-phase-section";
import { GenerationPhaseSection } from "@/components/menu-hub/generation-phase-section";
import { SelectionPhaseSection } from "@/components/menu-hub/selection-phase-section";
import { FulfillmentPhaseSection } from "@/components/menu-hub/fulfillment-phase-section";
import type { MenuStatus } from "@/types/menu";

export default async function MenuDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch menu + related data in parallel
  const [{ data: menu }, { data: latestGeneration }, { data: order }] =
    await Promise.all([
      supabase.from("menus").select("*").eq("id", id).single(),
      supabase
        .from("ai_generations")
        .select(
          "id, status, ai_generation_images(id, image_url, status, variant_index)"
        )
        .eq("menu_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("orders")
        .select(
          "id, status, amount, currency, paid_at, created_at, generation_id, selected_image_id"
        )
        .eq("menu_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (!menu) notFound();

  // Fetch selected image if one is chosen
  let selectedImage: { id: string; image_url: string } | null = null;
  if (menu.selected_image_id) {
    const { data } = await supabase
      .from("ai_generation_images")
      .select("id, image_url")
      .eq("id", menu.selected_image_id)
      .single();
    if (data?.image_url) {
      selectedImage = { id: data.id, image_url: data.image_url };
    }
  }

  const phase = getPhase(menu.status as MenuStatus);
  const images = latestGeneration?.ai_generation_images ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <MenuHubHeader menu={menu} />
      <MenuProgressBar menu={menu} phase={phase} />

      {phase === "setup" && <SetupPhaseSection menu={menu} />}

      {phase === "generation" && (
        <GenerationPhaseSection menu={menu} images={images} />
      )}

      {phase === "selection" && (
        <SelectionPhaseSection menu={menu} selectedImage={selectedImage} />
      )}

      {phase === "fulfillment" && (
        <FulfillmentPhaseSection
          menu={menu}
          selectedImage={selectedImage}
          order={order}
        />
      )}

      {phase === "failed" && (
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <div>
              <p className="font-semibold">Something went wrong</p>
              <p className="text-sm text-muted-foreground">
                There was an error processing your menu. Please try again.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/menus/${menu.id}/style`}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
