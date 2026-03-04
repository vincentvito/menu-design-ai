"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Plus, Trash2, GripVertical, Save, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { MenuData } from "@/types/menu";
import { buildMenuDataStarter, countMenuItems } from "@/lib/menu-data";

export default function EditMenuPage() {
  const router = useRouter();
  const params = useParams();
  const menuId = params.id as string;
  const supabase = createClient();

  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parseNotice, setParseNotice] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const primary = await supabase
        .from("menus")
        .select("edited_json, extracted_json, restaurant_name, processing_error, ocr_model")
        .eq("id", menuId)
        .single();

      let data = primary.data as
        | {
            edited_json: MenuData | null;
            extracted_json: MenuData | null;
            restaurant_name: string | null;
            processing_error?: string | null;
            ocr_model?: string | null;
          }
        | null;

      if (primary.error) {
        const fallback = await supabase
          .from("menus")
          .select("edited_json, extracted_json, restaurant_name")
          .eq("id", menuId)
          .single();
        data = fallback.data as
          | {
              edited_json: MenuData | null;
              extracted_json: MenuData | null;
              restaurant_name: string | null;
              processing_error?: string | null;
              ocr_model?: string | null;
            }
          | null;
      }

      if (data?.edited_json) {
        setMenuData(data.edited_json as MenuData);
        if (data.ocr_model === "heuristic-parser-v1") {
          setParseNotice(
            "Auto extraction used a fallback parser. Please review items and prices carefully.",
          );
        }
      } else if (data?.extracted_json) {
        setMenuData(data.extracted_json as MenuData);
        if (data.ocr_model === "heuristic-parser-v1") {
          setParseNotice(
            "Auto extraction used a fallback parser. Please review items and prices carefully.",
          );
        }
      } else {
        setMenuData(buildMenuDataStarter(data?.restaurant_name || "My Restaurant"));
        setParseNotice(
          data?.processing_error
            ? `Automatic extraction failed: ${data.processing_error}. Add your menu items manually below to continue.`
            : "Automatic extraction could not find menu items. Add your menu items manually below to continue.",
        );
      }
      setLoading(false);
    }
    load();
  }, [menuId, supabase]);

  function updateSectionName(sectionIndex: number, name: string) {
    setMenuData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.sections[sectionIndex].name = name;
      return next;
    });
  }

  function updateItem(sectionIndex: number, itemIndex: number, field: string, value: string | number | boolean) {
    setMenuData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      (next.sections[sectionIndex].items[itemIndex] as Record<string, unknown>)[field] = value;
      return next;
    });
  }

  function addItem(sectionIndex: number) {
    setMenuData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.sections[sectionIndex].items.push({ name: "", description: "", price: 0, currency: "AED", is_halal: true });
      return next;
    });
  }

  function removeItem(sectionIndex: number, itemIndex: number) {
    setMenuData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.sections[sectionIndex].items.splice(itemIndex, 1);
      return next;
    });
  }

  function addSection() {
    setMenuData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.sections.push({ name: "New Section", items: [] });
      return next;
    });
  }

  function removeSection(sectionIndex: number) {
    setMenuData((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev);
      next.sections.splice(sectionIndex, 1);
      return next;
    });
  }

  async function handleSave() {
    if (!menuData) return;
    setSaving(true);
    const { error } = await supabase
      .from("menus")
      .update({
        edited_json: menuData,
        restaurant_name: menuData.restaurant_name,
        status: "editing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", menuId);

    if (error) {
      toast.error(`Save failed: ${error.message}`);
    } else {
      toast.success("Menu data saved");
    }
    setSaving(false);
  }

  async function handleNext() {
    if (!menuData || !canContinue) {
      toast.error("Please add at least one section and one named menu item.");
      return;
    }

    await handleSave();
    router.push(`/menus/${menuId}/style`);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!menuData) {
    return <div className="py-16 text-center text-muted-foreground">Menu not found</div>;
  }

  const totalItems = menuData.sections.reduce((sum, s) => sum + s.items.length, 0);
  const validItemCount = menuData.sections.reduce(
    (sum, section) =>
      sum + section.items.filter((item) => item.name.trim().length > 0).length,
    0,
  );
  const canContinue = menuData.sections.length > 0 && validItemCount > 0;
  const likelyStarterFallback =
    menuData.sections.length === 1 &&
    menuData.sections[0]?.name === "Main" &&
    menuData.sections[0]?.items.length === 1 &&
    menuData.sections[0]?.items[0]?.name.trim().length === 0 &&
    countMenuItems(menuData) <= 1;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit Menu</h1>
          <p className="text-muted-foreground">
            {menuData.restaurant_name} &middot; {totalItems} items &middot; {menuData.sections.length} sections
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
          <Button onClick={handleNext} disabled={saving || !canContinue}>
            Continue Setup<ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {(parseNotice || likelyStarterFallback) && (
        <Card className="border-amber-300 bg-amber-50/60">
          <CardContent className="pt-6 text-sm text-amber-900">
            {parseNotice ||
              "Extraction was incomplete. Fill at least one item name to continue setup."}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="restaurant-name">Restaurant Name</Label>
            <Input id="restaurant-name" value={menuData.restaurant_name} onChange={(e) => setMenuData((prev) => prev ? { ...prev, restaurant_name: e.target.value } : prev)} />
          </div>
        </CardContent>
      </Card>

      {menuData.sections.map((section, sectionIndex) => (
        <Card key={sectionIndex}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <Input value={section.name} onChange={(e) => updateSectionName(sectionIndex, e.target.value)} className="h-auto border-none p-0 text-lg font-semibold shadow-none focus-visible:ring-0" />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{section.items.length} items</Badge>
                <Button variant="ghost" size="icon" onClick={() => removeSection(sectionIndex)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
            {section.name_ar && <CardDescription className="text-right" dir="rtl">{section.name_ar}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            {section.items.map((item, itemIndex) => (
              <div key={itemIndex}>
                {itemIndex > 0 && <Separator className="mb-4" />}
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">Name</Label>
                        <Input value={item.name} onChange={(e) => updateItem(sectionIndex, itemIndex, "name", e.target.value)} placeholder="Item name" />
                      </div>
                      <div className="w-28">
                        <Label className="text-xs text-muted-foreground">Price ({item.currency})</Label>
                        <Input type="number" step="0.01" min="0" value={item.price} onChange={(e) => updateItem(sectionIndex, itemIndex, "price", parseFloat(e.target.value) || 0)} />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <Textarea value={item.description || ""} onChange={(e) => updateItem(sectionIndex, itemIndex, "description", e.target.value)} placeholder="Brief description" rows={2} />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {([["is_vegetarian", "Vegetarian"], ["is_vegan", "Vegan"], ["is_gluten_free", "Gluten Free"], ["is_spicy", "Spicy"], ["is_halal", "Halal"]] as const).map(([key, label]) => (
                        <Button
                          key={key}
                          type="button"
                          size="sm"
                          variant={(item as Record<string, unknown>)[key] ? "default" : "outline"}
                          aria-pressed={!!(item as Record<string, unknown>)[key]}
                          className="h-6 rounded-full px-2 text-xs"
                          onClick={() => updateItem(sectionIndex, itemIndex, key, !(item as Record<string, unknown>)[key])}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="mt-5" onClick={() => removeItem(sectionIndex, itemIndex)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => addItem(sectionIndex)}>
              <Plus className="mr-2 h-4 w-4" />Add Item
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" className="w-full" onClick={addSection}>
        <Plus className="mr-2 h-4 w-4" />Add Section
      </Button>

      {!canContinue && (
        <p className="text-sm text-muted-foreground">
          Add at least one menu item name to enable Continue Setup.
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Save
        </Button>
        <Button onClick={handleNext} disabled={saving || !canContinue}>Continue Setup<ArrowRight className="ml-2 h-4 w-4" /></Button>
      </div>
    </div>
  );
}
