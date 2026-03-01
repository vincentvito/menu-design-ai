"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Camera,
  Type,
  LayoutTemplate,
  FileText,
  BookOpen,
  Info,
} from "lucide-react";
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
import type { MenuData, MenuFormat, PageLayout } from "@/types/menu";

const FORMAT_OPTIONS: {
  value: MenuFormat;
  title: string;
  description: string;
  icon: typeof Camera;
}[] = [
  {
    value: "photo",
    title: "Photo Menu",
    description:
      "Large food photos dominate the design with minimal text. Best for visually appealing dishes.",
    icon: Camera,
  },
  {
    value: "balanced",
    title: "Balanced",
    description:
      "Photos and text in harmony for a professional look. Great for most restaurants.",
    icon: LayoutTemplate,
  },
  {
    value: "text_only",
    title: "Text-Only / Elegant",
    description:
      "Typography-focused with decorative elements, no photos. Perfect for fine dining and wine bars.",
    icon: Type,
  },
];

const LAYOUT_OPTIONS: {
  value: PageLayout;
  title: string;
  description: string;
  icon: typeof FileText;
}[] = [
  {
    value: "single",
    title: "Single Page",
    description: "All items on one page — clean and simple.",
    icon: FileText,
  },
  {
    value: "front_back",
    title: "Front & Back",
    description: "Two-sided menu with front and back pages.",
    icon: BookOpen,
  },
  {
    value: "booklet",
    title: "Multi-page Booklet",
    description: "Multiple pages for extensive menus.",
    icon: BookOpen,
  },
];

function suggestLayout(itemCount: number): PageLayout {
  if (itemCount < 15) return "single";
  if (itemCount <= 30) return "front_back";
  return "booklet";
}

export default function FormatLayoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: menuId } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [selectedFormat, setSelectedFormat] = useState<MenuFormat | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<PageLayout | null>(null);
  const [suggestedLayout, setSuggestedLayout] = useState<PageLayout>("single");
  const [itemCount, setItemCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: menu } = await supabase
        .from("menus")
        .select(
          "menu_format, page_layout, extracted_json, edited_json",
        )
        .eq("id", menuId)
        .single();

      if (menu) {
        if (menu.menu_format) setSelectedFormat(menu.menu_format as MenuFormat);
        if (menu.page_layout) setSelectedLayout(menu.page_layout as PageLayout);

        const menuData = (menu.edited_json || menu.extracted_json) as MenuData | null;
        if (menuData) {
          const count = menuData.sections.flatMap((s) => s.items).length;
          setItemCount(count);
          const suggested = suggestLayout(count);
          setSuggestedLayout(suggested);
          if (!menu.page_layout) setSelectedLayout(suggested);
        }
      }

      setLoading(false);
    }
    load();
  }, [supabase, menuId]);

  async function handleContinue() {
    if (!selectedFormat) {
      toast.error("Please select a menu format");
      return;
    }
    if (!selectedLayout) {
      toast.error("Please select a page layout");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("menus")
      .update({
        menu_format: selectedFormat,
        page_layout: selectedLayout,
      })
      .eq("id", menuId);

    if (error) {
      toast.error("Failed to save preferences");
      setSaving(false);
      return;
    }

    router.push(`/menus/${menuId}/style`);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Format & Layout</h1>
          <p className="text-muted-foreground">
            Choose how your menu should look and how many pages it needs
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/menus/${menuId}/cuisine`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Menu Format Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Menu Format</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {FORMAT_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <Card
                key={option.value}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedFormat === option.value
                    ? "border-primary ring-2 ring-primary/20"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedFormat(option.value)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-5 w-5" />
                    {option.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs">
                    {option.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Page Layout Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Page Layout</h2>
        {itemCount > 0 && (
          <p className="text-sm text-muted-foreground">
            Your menu has {itemCount} items — we recommend{" "}
            <span className="font-medium">
              {LAYOUT_OPTIONS.find((o) => o.value === suggestedLayout)?.title}
            </span>
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-3">
          {LAYOUT_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isRecommended = option.value === suggestedLayout && itemCount > 0;
            return (
              <Card
                key={option.value}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedLayout === option.value
                    ? "border-primary ring-2 ring-primary/20"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedLayout(option.value)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Icon className="h-5 w-5" />
                    {option.title}
                    {isRecommended && (
                      <Badge variant="secondary" className="ml-auto text-[10px]">
                        Recommended
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-xs">
                    {option.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {selectedLayout && selectedLayout !== "single" && (
          <div className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              AI generates the front/main page as a preview. The professional
              designer will create the complete {selectedLayout === "front_back" ? "two-sided" : "multi-page"} layout.
            </span>
          </div>
        )}
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={!selectedFormat || !selectedLayout || saving}
        onClick={handleContinue}
      >
        {saving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="mr-2 h-4 w-4" />
        )}
        Continue to Style & Colors
      </Button>
    </div>
  );
}
