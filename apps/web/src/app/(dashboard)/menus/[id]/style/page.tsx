"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { Check, ArrowRight, ArrowLeft, Loader2, Palette } from "lucide-react";
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
import type { StyleTemplate, ColorPalette } from "@/types/menu";
import { mapPaletteToRoles } from "@/lib/palette-roles";

const FALLBACK_STYLE_PREVIEWS: Record<string, string> = {
  "fine-dining": "/showcase/le-petit-bistro.png",
  "modern-cafe": "/showcase/daily-bread.png",
  "casual-dining": "/showcase/olive-and-thyme.png",
  "fast-food": "/showcase/el-fuego.png",
  "arabic-traditional": "/showcase/spice-route.png",
  seafood: "/showcase/ember-and-oak.png",
};

function sameColorArrays(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((color, index) => color.toLowerCase() === b[index]?.toLowerCase());
}

function PaletteRoleLegend({ colors }: { colors: string[] }) {
  const roles = mapPaletteToRoles(colors);
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
      <span>BG: {roles.background}</span>
      <span>Text: {roles.textPrimary}</span>
      <span>Text 2: {roles.textSecondary}</span>
      <span>Accent: {roles.accent}</span>
      <span>Accent 2: {roles.accentAlt}</span>
      <span>Border: {roles.border}</span>
    </div>
  );
}

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
  const [saving, setSaving] = useState(false);
  const previousTemplateRef = useRef<string | null>(null);

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

      setLoading(false);
    }
    load();
  }, [menuId, supabase]);

  // Load palettes when selected template changes
  useEffect(() => {
    let cancelled = false;

    async function loadPalettes() {
      if (!selectedTemplate) {
        previousTemplateRef.current = null;
        setPalettes([]);
        setSelectedPaletteColors(null);
        setIsCustomPalette(false);
        return;
      }

      const templateChanged = previousTemplateRef.current !== selectedTemplate;
      previousTemplateRef.current = selectedTemplate;
      if (templateChanged) {
        setIsCustomPalette(false);
      }

      const { data } = await supabase
        .from("color_palettes")
        .select("*")
        .eq("style_template_id", selectedTemplate)
        .eq("is_active", true)
        .order("sort_order");

      if (cancelled) return;

      const parsed = (data || []).map((p) => ({
        ...p,
        colors: p.colors as string[],
      })) as ColorPalette[];
      setPalettes(parsed);

      const defaultPalette = parsed.find((p) => p.is_default) || parsed[0] || null;
      if (templateChanged) {
        setSelectedPaletteColors(defaultPalette ? defaultPalette.colors : null);
        return;
      }

      if (isCustomPalette) return;

      setSelectedPaletteColors((current) => {
        if (
          current &&
          parsed.some((palette) => sameColorArrays(palette.colors, current))
        ) {
          return current;
        }
        return defaultPalette ? defaultPalette.colors : null;
      });
    }

    loadPalettes();

    return () => {
      cancelled = true;
    };
  }, [selectedTemplate, supabase, isCustomPalette]);

  function handleCardKeySelect(
    event: { key: string; preventDefault: () => void },
    onSelect: () => void,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect();
    }
  }

  function getTemplatePreview(template: StyleTemplate) {
    if (template.preview_url) return template.preview_url;
    if (template.example_images?.length) return template.example_images[0];
    return FALLBACK_STYLE_PREVIEWS[template.slug] || null;
  }

  async function handleContinue() {
    if (!selectedTemplate) {
      toast.error("Please select a style template");
      return;
    }

    const paletteToSave = isCustomPalette ? customColors : selectedPaletteColors;
    if (!paletteToSave || paletteToSave.length === 0) {
      toast.error("Please select a color palette");
      return;
    }

    setSaving(true);

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
      setSaving(false);
      return;
    }

    toast.success("Style saved");
    router.push(`/menus/${menuId}/cuisine`);
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
          <h1 className="text-2xl font-bold">Choose Your Style</h1>
          <p className="text-muted-foreground">
            Pick a visual direction first using reference images, then continue
            with cuisine and layout
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/menus/${menuId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Style Selection */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Design Style</h2>
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          role="radiogroup"
          aria-label="Design style"
        >
          {templates.map((template) => {
            const isSelected = selectedTemplate === template.id;
            const preview = getTemplatePreview(template);
            return (
              <Card
                key={template.id}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""}`}
                onClick={() => setSelectedTemplate(template.id)}
                onKeyDown={(event) =>
                  handleCardKeySelect(event, () => setSelectedTemplate(template.id))
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {isSelected && (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {preview ? (
                    <div className="overflow-hidden rounded-md border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={preview}
                        alt={`${template.name} style preview`}
                        className="aspect-[3/4] w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[3/4] items-center justify-center rounded-md border bg-muted/50 text-xs text-muted-foreground">
                      Preview coming soon
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
          <p className="text-xs text-muted-foreground">
            Each palette is auto-mapped into roles: background, text, accent,
            and border colors.
          </p>
          <div
            className="grid gap-3 sm:grid-cols-2"
            role="radiogroup"
            aria-label="Color palette"
          >
            {palettes.map((palette) => {
              const isSelected =
                !isCustomPalette &&
                selectedPaletteColors &&
                JSON.stringify(selectedPaletteColors) ===
                  JSON.stringify(palette.colors);
              return (
                <Card
                  key={palette.id}
                  role="radio"
                  aria-checked={!!isSelected}
                  tabIndex={0}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected
                      ? "border-primary ring-2 ring-primary/20"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => {
                    setSelectedPaletteColors(palette.colors);
                    setIsCustomPalette(false);
                  }}
                  onKeyDown={(event) =>
                    handleCardKeySelect(event, () => {
                      setSelectedPaletteColors(palette.colors);
                      setIsCustomPalette(false);
                    })
                  }
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
                    <div className="mt-3">
                      <PaletteRoleLegend colors={palette.colors} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Custom Palette Option */}
            <Card
              role="radio"
              aria-checked={isCustomPalette}
              tabIndex={0}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isCustomPalette
                  ? "border-primary ring-2 ring-primary/20"
                  : "hover:border-primary/50"
              }`}
              onClick={() => {
                setIsCustomPalette(true);
                setSelectedPaletteColors(customColors);
              }}
              onKeyDown={(event) =>
                handleCardKeySelect(event, () => {
                  setIsCustomPalette(true);
                  setSelectedPaletteColors(customColors);
                })
              }
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Custom Palette</CardTitle>
              </CardHeader>
              <CardContent>
                {isCustomPalette ? (
                  <div className="space-y-3">
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
                    <PaletteRoleLegend colors={customColors} />
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
        onClick={handleContinue}
        disabled={
          !selectedTemplate ||
          (!selectedPaletteColors && !isCustomPalette) ||
          saving
        }
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving Style...
          </>
        ) : (
          <>
            Continue to Cuisine Selection
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}
