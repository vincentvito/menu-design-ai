"use client";

import { useState, useEffect, useCallback, use, Fragment } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Download,
  Loader2,
  Palette,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import {
  pollGeneration,
  checkAndUpdateImages,
  selectSample,
  generateSamples,
  generateVariations,
} from "@/app/actions/generation";
import { VARIATION_TAGS } from "@/lib/prompts";
import type { VariationTagCategory } from "@/lib/prompts";
import type { AIGenerationImage } from "@/types/menu";

interface GenerationHistoryEntry {
  id: string;
  thumbnailUrl: string | null;
  isVariation: boolean;
}

const TAG_CATEGORY_LABELS: Record<VariationTagCategory, string> = {
  background: "Background",
  typography: "Typography",
  colors: "Colors",
  layout: "Layout",
  imagery: "Imagery",
};

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
  const [downloading, setDownloading] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);

  // Variation refinement state
  const [refineMode, setRefineMode] = useState(false);
  const [refineImageId, setRefineImageId] = useState<string | null>(null);
  const [freeTextInstruction, setFreeTextInstruction] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [refining, setRefining] = useState(false);
  const [generationHistory, setGenerationHistory] = useState<
    GenerationHistoryEntry[]
  >([]);

  // Build history chain by walking parent_generation_id
  const loadHistory = useCallback(
    async (currentGenId: string) => {
      const history: GenerationHistoryEntry[] = [];
      let genId: string | null = currentGenId;

      while (genId) {
        const { data } = await supabase
          .from("ai_generations")
          .select("id, parent_generation_id")
          .eq("id", genId)
          .single();

        const gen = data as { id: string; parent_generation_id: string | null } | null;
        if (!gen) break;

        const { data: thumb } = await supabase
          .from("ai_generation_images")
          .select("image_url")
          .eq("generation_id", gen.id)
          .eq("status", "completed")
          .order("variant_index")
          .limit(1)
          .single();

        history.unshift({
          id: gen.id,
          thumbnailUrl: (thumb as { image_url: string | null } | null)?.image_url ?? null,
          isVariation: !!gen.parent_generation_id,
        });

        genId = gen.parent_generation_id;
      }

      setGenerationHistory(history);
    },
    [supabase],
  );

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
        loadHistory(gen.id);
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
  }, [menuId, supabase, loadHistory]);

  // Poll for image completion
  const poll = useCallback(async () => {
    if (!generationId || allDone) return;

    await checkAndUpdateImages(generationId);

    const result = await pollGeneration(generationId);
    setImages(result.images as AIGenerationImage[]);

    if (result.allDone && !allDone) {
      setAllDone(true);
      // Refresh history thumbnails once images are done
      loadHistory(generationId);
    }
  }, [generationId, allDone, loadHistory]);

  useEffect(() => {
    if (!generationId) return;

    poll();

    if (!allDone) {
      const interval = setInterval(poll, 3000);
      return () => clearInterval(interval);
    }
  }, [generationId, allDone, poll]);

  async function handleDownloadPdf() {
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

    // Trigger PDF download
    setDownloading(true);
    try {
      const response = await fetch(`/api/menus/${menuId}/pdf`);
      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        response.headers
          .get("content-disposition")
          ?.match(/filename="(.+)"/)?.[1] ?? "menu-design.pdf";
      a.click();
      URL.revokeObjectURL(url);

      setPdfReady(true);
      toast.success("Your menu PDF is downloading!");
    } catch {
      toast.error("Failed to download PDF. Please try again.");
    }
    setDownloading(false);
    setSaving(false);
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
      setRefineMode(false);
      toast.success("Regenerating 4 new designs...");
      loadHistory(result.generationId);
    }
    setRegenerating(false);
  }

  function handleEnterRefineMode(imageId: string) {
    setRefineMode(true);
    setRefineImageId(imageId);
    setFreeTextInstruction("");
    setSelectedTags([]);
  }

  function handleExitRefineMode() {
    setRefineMode(false);
    setRefineImageId(null);
    setFreeTextInstruction("");
    setSelectedTags([]);
  }

  function toggleTag(instruction: string) {
    setSelectedTags((prev) =>
      prev.includes(instruction)
        ? prev.filter((t) => t !== instruction)
        : [...prev, instruction],
    );
  }

  async function handleGenerateVariations() {
    if (!refineImageId) return;

    if (!freeTextInstruction.trim() && selectedTags.length === 0) {
      toast.error(
        "Please describe what you'd like to change or select at least one tag",
      );
      return;
    }

    setRefining(true);
    const result = await generateVariations(
      menuId,
      refineImageId,
      freeTextInstruction,
      selectedTags,
    );

    if (result.error) {
      toast.error(result.error);
      if (result.error.includes("credits")) {
        router.push("/credits/buy");
      }
      setRefining(false);
      return;
    }

    if (result.generationId) {
      setGenerationId(result.generationId);
      setImages([]);
      setAllDone(false);
      setSelectedImageId(null);
      setRefineMode(false);
      setFreeTextInstruction("");
      setSelectedTags([]);
      toast.success("Generating 4 variations... this takes about 30 seconds");
      loadHistory(result.generationId);
    }
    setRefining(false);
  }

  function handleHistoryClick(historyGenId: string) {
    if (historyGenId === generationId) return;
    setGenerationId(historyGenId);
    setImages([]);
    setAllDone(false);
    setSelectedImageId(null);
    setRefineMode(false);
  }

  // Get the selected image URL for the refine panel thumbnail
  const refineImageUrl = refineImageId
    ? images.find((img) => img.id === refineImageId)?.image_url
    : null;

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
      {/* Header */}
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

      {/* History breadcrumb */}
      {generationHistory.length > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">History:</span>
          {generationHistory.map((gen, i) => (
            <Fragment key={gen.id}>
              {i > 0 && (
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              )}
              <button
                className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors ${
                  gen.id === generationId
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80"
                }`}
                onClick={() => handleHistoryClick(gen.id)}
              >
                {gen.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={gen.thumbnailUrl}
                    alt=""
                    className="h-6 w-6 rounded object-cover"
                  />
                )}
                {gen.isVariation ? `V${i}` : "Original"}
              </button>
            </Fragment>
          ))}
        </div>
      )}

      {/* Image grid */}
      <div className="grid grid-cols-2 gap-4">
        {(images.length > 0 ? images : Array.from({ length: 4 })).map(
          (img, i) => {
            const image = img as AIGenerationImage | undefined;
            const isCompleted = image?.status === "completed";
            const isFailed = image?.status === "failed";
            const isGenerating =
              !image ||
              image.status === "generating" ||
              image.status === "pending";
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
                      {allDone && (
                        <button
                          className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-md bg-background/80 px-2.5 py-1.5 text-xs font-medium shadow-sm backdrop-blur-sm transition-colors hover:bg-background"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEnterRefineMode(image.id);
                          }}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Refine
                        </button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          },
        )}
      </div>

      {/* Action buttons */}
      {allDone && completedCount > 0 && !refineMode && !pdfReady && (
        <Button
          size="lg"
          className="w-full"
          disabled={!selectedImageId || saving || downloading}
          onClick={handleDownloadPdf}
        >
          {saving || downloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {downloading
            ? "Preparing PDF..."
            : "Download Your Menu PDF — Free"}
        </Button>
      )}

      {/* Designer upsell — shown after PDF download */}
      {pdfReady && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-primary" />
              Your menu PDF is ready!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Want a professional designer to perfect your menu? Get
              print-ready files with polished typography, editable source
              files, and 1 revision included.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                size="lg"
                className="flex-1"
                onClick={() => router.push(`/menus/${menuId}/order`)}
              >
                <Palette className="mr-2 h-4 w-4" />
                Upgrade to Pro Design — $199
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={handleDownloadPdf}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Download Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refinement panel */}
      {refineMode && (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                {refineImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={refineImageUrl}
                    alt="Selected design"
                    className="h-20 w-15 rounded-md border object-cover"
                  />
                )}
                <div>
                  <h3 className="font-semibold">Refine This Design</h3>
                  <p className="text-sm text-muted-foreground">
                    Describe changes or pick suggestions below. We&apos;ll
                    generate 4 variations.
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExitRefineMode}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Free text input */}
            <Textarea
              placeholder="e.g., Make the background darker, use a more elegant font, add more whitespace between sections..."
              value={freeTextInstruction}
              onChange={(e) => setFreeTextInstruction(e.target.value)}
              rows={3}
            />

            {/* Tag chips by category */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Quick suggestions</p>
              {(
                Object.entries(VARIATION_TAGS) as [
                  VariationTagCategory,
                  (typeof VARIATION_TAGS)[VariationTagCategory],
                ][]
              ).map(([category, tags]) => (
                <div key={category} className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">
                    {TAG_CATEGORY_LABELS[category]}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => {
                      const isActive = selectedTags.includes(tag.instruction);
                      return (
                        <Button
                          key={tag.label}
                          type="button"
                          size="sm"
                          variant={isActive ? "default" : "outline"}
                          aria-pressed={isActive}
                          className="h-7 cursor-pointer select-none rounded-full px-3 transition-colors"
                          onClick={() => toggleTag(tag.instruction)}
                        >
                          {tag.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Generate variations button */}
            <Button
              size="lg"
              className="w-full"
              disabled={
                refining ||
                (!freeTextInstruction.trim() && selectedTags.length === 0)
              }
              onClick={handleGenerateVariations}
            >
              {refining ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Generate Variations (1 credit)
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
