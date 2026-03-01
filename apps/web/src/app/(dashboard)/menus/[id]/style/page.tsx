"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Check, ArrowRight, ArrowLeft, Loader2, Coins, Palette } from "lucide-react";
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
import { generateSamples } from "@/app/actions/generation";
import type { StyleTemplate, ColorPalette } from "@/types/menu";

export default function StylePage() {
  const router = useRouter();
  const params = useParams();
  const menuId = params.id as string;
  const supabase = createClient();

  const [templates, setTemplates] = useState<StyleTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [palettes, setPalettes] = useState<ColorPalette[]>([]);
  const [selectedPaletteColors, setSelectedPaletteColors] = useState<string[] | null>(null);
  const [isCustomPalette, setIsCustomPalette] = useState(false);
  const [customColors, setCustomColors] = useState<string[]>([
    "#1a1a2e",
    "#c9a96e",
    "#fdf6ec",
    "#2c2c2c",
  ]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [creditBalance, setCreditBalance] = useState<number | null>(null);

  // Load templates + menu state
  useEffect(() => {
    async function load() {
      const { data: templateData } = await supabase
        .from("style_templates")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (templateData) setTemplates(templateData as StyleTemplate[]);

      const { data: menu } = await supabase
        .from("menus")
        .select("template_id, color_palette")
        .eq("id", menuId)
        .single();

      if (menu?.template_id) setSelectedTemplate(menu.template_id);
      if (menu?.color_palette) {
        setSelectedPaletteColors(menu.color_palette as string[]);
      }

      // Load credit balance
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: credits } = await supabase
          .from("user_credits")
          .select("balance")
          .eq("user_id", user.id)
          .single();
        setCreditBalance(credits?.balance ?? 0);
      }

      setLoading(false);
    }
    load();
  }, [menuId, supabase]);

  // Load palettes when selected template changes
  useEffect(() => {
    async function loadPalettes() {
      if (!selectedTemplate) {
        setPalettes([]);
        return;
      }

      const { data } = await supabase
        .from("color_palettes")
        .select("*")
        .eq("style_template_id", selectedTemplate)
        .eq("is_active", true)
        .order("sort_order");

      if (data) {
        const parsed = data.map((p) => ({
          ...p,
          colors: p.colors as string[],
        })) as ColorPalette[];
        setPalettes(parsed);

        // Auto-select the default palette if no palette is currently selected
        if (!selectedPaletteColors && !isCustomPalette) {
          const defaultPalette = parsed.find((p) => p.is_default) || parsed[0];
          if (defaultPalette) {
            setSelectedPaletteColors(defaultPalette.colors);
          }
        }
      }
    }
    loadPalettes();
    // Reset palette selection when template changes
    setSelectedPaletteColors(null);
    setIsCustomPalette(false);
  }, [selectedTemplate, supabase]);

  async function handleGenerate() {
    if (!selectedTemplate) {
      toast.error("Please select a style template");
      return;
    }

    const paletteToSave = isCustomPalette ? customColors : selectedPaletteColors;
    if (!paletteToSave || paletteToSave.length === 0) {
      toast.error("Please select a color palette");
      return;
    }

    if (creditBalance !== null && creditBalance < 1) {
      toast.error("You need at least 1 credit. Buy more credits first.");
      router.push("/credits/buy");
      return;
    }

    setGenerating(true);

    // Save template + palette selection
    const { error: updateError } = await supabase
      .from("menus")
      .update({
        template_id: selectedTemplate,
        color_palette: paletteToSave,
        status: "style_selected",
      })
      .eq("id", menuId);

    if (updateError) {
      toast.error(`Failed to save style: ${updateError.message}`);
      setGenerating(false);
      return;
    }

    // Trigger generation
    const result = await generateSamples(menuId);

    if (result.error) {
      toast.error(result.error);
      setGenerating(false);
      return;
    }

    toast.success("Generating 4 AI menu designs! This takes about 30 seconds.");
    router.push(`/menus/${menuId}/results`);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Style & Colors</h1>
          <p className="text-muted-foreground">
            Select a style and color palette, then generate 4 AI menu designs
          </p>
        </div>
        <div className="flex items-center gap-3">
          {creditBalance !== null && (
            <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
              <Coins className="h-3 w-3" />
              {creditBalance} credits
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={() => router.push(`/menus/${menuId}/format`)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      {/* Style Selection */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Design Style</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => {
            const colors = template.color_scheme as Record<
              string,
              string
            > | null;
            return (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-md ${selectedTemplate === template.id ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {selectedTemplate === template.id && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {colors && (
                    <div className="mb-3 flex gap-2">
                      {Object.entries(colors).map(([key, color]) => (
                        <div key={key} className="space-y-1 text-center">
                          <div
                            className="h-8 w-8 rounded-md border"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-[10px] text-muted-foreground">
                            {key}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Badge variant="secondary">{template.category}</Badge>
                    {template.supports_rtl && (
                      <Badge variant="outline">RTL</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Color Palette Selection — appears after style is selected */}
      {selectedTemplate && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Palette className="h-5 w-5" />
            Color Palette
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {palettes.map((palette) => {
              const isSelected =
                !isCustomPalette &&
                selectedPaletteColors &&
                JSON.stringify(selectedPaletteColors) ===
                  JSON.stringify(palette.colors);
              return (
                <Card
                  key={palette.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/20"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => {
                    setSelectedPaletteColors(palette.colors);
                    setIsCustomPalette(false);
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{palette.name}</CardTitle>
                      {palette.is_default && (
                        <Badge variant="secondary" className="text-[10px]">
                          Default
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      {palette.colors.map((color, i) => (
                        <div
                          key={i}
                          className="h-10 w-10 rounded-md border"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Custom Palette Option */}
            <Card
              className={`cursor-pointer transition-all hover:shadow-md ${
                isCustomPalette
                  ? "border-primary ring-2 ring-primary/20"
                  : "hover:border-primary/50"
              }`}
              onClick={() => {
                setIsCustomPalette(true);
                setSelectedPaletteColors(customColors);
              }}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Custom Palette</CardTitle>
              </CardHeader>
              <CardContent>
                {isCustomPalette ? (
                  <div className="flex gap-2">
                    {customColors.map((color, i) => (
                      <div key={i} className="space-y-1 text-center">
                        <input
                          type="color"
                          value={color}
                          onChange={(e) => {
                            const newColors = [...customColors];
                            newColors[i] = e.target.value;
                            setCustomColors(newColors);
                            setSelectedPaletteColors(newColors);
                          }}
                          className="h-10 w-10 cursor-pointer rounded-md border-0 p-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="text-[9px] text-muted-foreground">
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Pick your own brand colors
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Button
        size="lg"
        className="w-full"
        onClick={handleGenerate}
        disabled={
          !selectedTemplate ||
          (!selectedPaletteColors && !isCustomPalette) ||
          generating
        }
      >
        {generating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating AI Samples...
          </>
        ) : (
          <>
            Generate 4 AI Designs
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        This costs 1 credit and generates 4 unique AI menu designs
      </p>
    </div>
  );
}
