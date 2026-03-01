"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
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
import type { CuisineType } from "@/types/menu";

export default function CuisineSelectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: menuId } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [cuisines, setCuisines] = useState<CuisineType[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("cuisine_types")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (data) setCuisines(data as CuisineType[]);

      // Load current menu to check if cuisine already selected
      const { data: menu } = await supabase
        .from("menus")
        .select("cuisine_type")
        .eq("id", menuId)
        .single();

      if (menu?.cuisine_type) setSelected(menu.cuisine_type);
      setLoading(false);
    }
    load();
  }, [supabase, menuId]);

  async function handleContinue() {
    if (!selected) {
      toast.error("Please select a cuisine type");
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("menus")
      .update({ cuisine_type: selected })
      .eq("id", menuId);

    if (error) {
      toast.error("Failed to save cuisine type");
      setSaving(false);
      return;
    }

    router.push(`/menus/${menuId}/format`);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Select Cuisine Type</h1>
          <p className="text-muted-foreground">
            This helps AI generate the perfect menu design for your restaurant
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/menus/${menuId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cuisines.map((cuisine) => (
          <Card
            key={cuisine.id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selected === cuisine.slug
                ? "border-primary ring-2 ring-primary/20"
                : "hover:border-primary/50"
            }`}
            onClick={() => setSelected(cuisine.slug)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-xl">{cuisine.icon}</span>
                {cuisine.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-xs">
                {cuisine.description}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={!selected || saving}
        onClick={handleContinue}
      >
        {saving ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <ArrowRight className="mr-2 h-4 w-4" />
        )}
        Continue to Format & Layout
      </Button>
    </div>
  );
}
