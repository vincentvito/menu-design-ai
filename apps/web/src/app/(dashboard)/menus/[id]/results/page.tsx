"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
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
import {
  pollGeneration,
  checkAndUpdateImages,
  selectSample,
  generateSamples,
} from "@/app/actions/generation";
import type { AIGenerationImage } from "@/types/menu";

export default function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: menuId } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [generationId, setGenerationId] = useState<string | null>(null);
  const [images, setImages] = useState<AIGenerationImage[]>([]);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [allDone, setAllDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Load generation for this menu
  useEffect(() => {
    async function loadGeneration() {
      const { data: gen } = await supabase
        .from("ai_generations")
        .select("id")
        .eq("menu_id", menuId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (gen) {
        setGenerationId(gen.id);
      }

      // Check if menu already has a selected image
      const { data: menu } = await supabase
        .from("menus")
        .select("selected_image_id")
        .eq("id", menuId)
        .single();

      if (menu?.selected_image_id) {
        setSelectedImageId(menu.selected_image_id);
      }

      setLoading(false);
    }
    loadGeneration();
  }, [menuId, supabase]);

  // Poll for image completion
  const poll = useCallback(async () => {
    if (!generationId || allDone) return;

    // Check and update images from Replicate
    await checkAndUpdateImages(generationId);

    // Then poll current state
    const result = await pollGeneration(generationId);
    setImages(result.images as AIGenerationImage[]);
    setAllDone(result.allDone);
  }, [generationId, allDone]);

  useEffect(() => {
    if (!generationId) return;

    // Initial poll
    poll();

    // Poll every 3 seconds while not done
    if (!allDone) {
      const interval = setInterval(poll, 3000);
      return () => clearInterval(interval);
    }
  }, [generationId, allDone, poll]);

  async function handleSelect() {
    if (!selectedImageId) {
      toast.error("Please select a design");
      return;
    }

    setSaving(true);
    const result = await selectSample(menuId, selectedImageId);

    if (result.error) {
      toast.error(result.error);
      setSaving(false);
      return;
    }

    toast.success("Design selected! Proceed to order.");
    router.push(`/menus/${menuId}/order`);
  }

  async function handleRegenerate() {
    setRegenerating(true);
    const result = await generateSamples(menuId);

    if (result.error) {
      toast.error(result.error);
      setRegenerating(false);
      return;
    }

    if (result.generationId) {
      setGenerationId(result.generationId);
      setImages([]);
      setAllDone(false);
      setSelectedImageId(null);
      toast.success("Regenerating 4 new designs...");
    }
    setRegenerating(false);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-[3/4]" />
          ))}
        </div>
      </div>
    );
  }

  if (!generationId) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 text-center">
        <h1 className="text-2xl font-bold">No Designs Generated Yet</h1>
        <p className="text-muted-foreground">
          Go back to the style page to generate your AI menu designs.
        </p>
        <Button onClick={() => router.push(`/menus/${menuId}/style`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Style Selection
        </Button>
      </div>
    );
  }

  const completedCount = images.filter(
    (img) => img.status === "completed",
  ).length;
  const failedCount = images.filter((img) => img.status === "failed").length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">AI Menu Designs</h1>
          <p className="text-muted-foreground">
            {allDone
              ? `${completedCount} designs ready${failedCount > 0 ? `, ${failedCount} failed` : ""} — pick your favorite`
              : "Generating your designs... this takes about 30 seconds"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/menus/${menuId}/style`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {allDone && (
            <Button
              variant="outline"
              onClick={handleRegenerate}
              disabled={regenerating}
            >
              {regenerating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Regenerate (1 credit)
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {(images.length > 0 ? images : Array.from({ length: 4 })).map(
          (img, i) => {
            const image = img as AIGenerationImage | undefined;
            const isCompleted = image?.status === "completed";
            const isFailed = image?.status === "failed";
            const isGenerating = !image || image.status === "generating" || image.status === "pending";
            const isSelected = image?.id === selectedImageId;

            return (
              <Card
                key={image?.id || i}
                className={`overflow-hidden transition-all ${
                  isCompleted ? "cursor-pointer hover:shadow-md" : ""
                } ${isSelected ? "ring-2 ring-primary" : ""}`}
                onClick={() => {
                  if (isCompleted && image?.id) {
                    setSelectedImageId(image.id);
                  }
                }}
              >
                <CardContent className="relative p-0">
                  {isGenerating && (
                    <div className="flex aspect-[3/4] items-center justify-center bg-muted">
                      <div className="space-y-3 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Generating...
                        </p>
                      </div>
                    </div>
                  )}

                  {isFailed && (
                    <div className="flex aspect-[3/4] items-center justify-center bg-muted">
                      <div className="space-y-3 text-center">
                        <AlertTriangle className="mx-auto h-8 w-8 text-destructive" />
                        <p className="text-sm text-destructive">
                          Generation failed
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {image?.error_message || "Unknown error"}
                        </p>
                      </div>
                    </div>
                  )}

                  {isCompleted && image?.image_url && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.image_url}
                        alt={`Design variant ${(image.variant_index ?? 0) + 1}`}
                        className="aspect-[3/4] w-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-lg">
                          <Check className="h-5 w-5 text-primary-foreground" />
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          },
        )}
      </div>

      {allDone && completedCount > 0 && (
        <Button
          size="lg"
          className="w-full"
          disabled={!selectedImageId || saving}
          onClick={handleSelect}
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="mr-2 h-4 w-4" />
          )}
          Select This Design & Continue to Order
        </Button>
      )}
    </div>
  );
}
