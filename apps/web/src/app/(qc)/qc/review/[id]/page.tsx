"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Upload,
  Loader2,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { MenuData, MenuStatus } from "@/types/menu";

export default function DesignerReviewPage() {
  const router = useRouter();
  const params = useParams();
  const menuId = params.id as string;
  const supabase = createClient();

  const [menu, setMenu] = useState<{
    edited_json: MenuData | null;
    extracted_json: MenuData | null;
    restaurant_name: string;
    status: MenuStatus;
    selected_image_id: string | null;
    cuisine_type: string | null;
    original_image_url: string | null;
  } | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("menus")
        .select(
          "edited_json, extracted_json, restaurant_name, status, selected_image_id, cuisine_type, original_image_url",
        )
        .eq("id", menuId)
        .single();

      if (data) {
        setMenu(data as typeof menu);

        // Load the selected AI sample image
        if (data.selected_image_id) {
          const { data: img } = await supabase
            .from("ai_generation_images")
            .select("image_url")
            .eq("id", data.selected_image_id)
            .single();
          if (img?.image_url) setSelectedImageUrl(img.image_url);
        }
      }
      setLoading(false);
    }
    load();
  }, [menuId, supabase]);

  async function handleStartDesign() {
    setSaving(true);
    await supabase
      .from("menus")
      .update({ status: "design_in_progress" })
      .eq("id", menuId);

    setMenu((prev) =>
      prev ? { ...prev, status: "design_in_progress" } : prev,
    );
    setSaving(false);
    toast.success("Design marked as in progress");
  }

  async function handleMarkComplete() {
    if (!notes.trim()) {
      toast.error("Please add completion notes");
      return;
    }
    setSaving(true);

    const { error } = await supabase
      .from("menus")
      .update({
        status: "design_complete",
      })
      .eq("id", menuId);

    if (error) {
      toast.error(`Failed to update: ${error.message}`);
      setSaving(false);
      return;
    }

    // Create QC review record for tracking
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("qc_reviews").insert({
      menu_id: menuId,
      reviewer_id: user?.id,
      status: "approved",
      notes,
    });

    toast.success("Menu marked as design complete.");
    router.push("/qc");
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="aspect-[3/4]" />
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    );
  }

  if (!menu) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        Menu not found
      </div>
    );
  }

  const json = menu.edited_json || menu.extracted_json;
  const allItems =
    json?.sections.flatMap((s) =>
      s.items.map((item) => ({ ...item, section: s.name })),
    ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/qc")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {menu.restaurant_name || "Untitled"}
            </h1>
            <p className="text-muted-foreground">
              {menu.cuisine_type || "Menu"} &middot; {allItems.length} items
            </p>
          </div>
        </div>
        <StatusBadge status={menu.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: AI Sample Reference */}
        <Card>
          <CardHeader>
            <CardTitle>Selected AI Design</CardTitle>
            <CardDescription>
              Use this as the reference for the final menu design
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selectedImageUrl}
                alt="Selected AI design"
                className="w-full rounded-lg border"
              />
            ) : (
              <div className="flex aspect-[3/4] items-center justify-center rounded-lg bg-muted">
                <div className="space-y-2 text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No AI sample selected
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Menu data + actions */}
        <div className="space-y-4">
          {/* Menu data */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Menu Data</CardTitle>
              <CardDescription>
                All items and prices to include in the design
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Section / Item</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allItems.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{item.name}</span>
                            {item.description && (
                              <p className="text-xs text-muted-foreground">
                                {item.description}
                              </p>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {item.section}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {item.price} {item.currency}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Delivery notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Completion Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add notes about the completed design (file links, handoff details, special instructions...)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2">
            {menu.status === "paid" && (
              <Button
                className="flex-1"
                onClick={handleStartDesign}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Start Design
              </Button>
            )}
            {menu.status === "design_in_progress" && (
              <Button
                className="flex-1"
                onClick={handleMarkComplete}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Mark as Complete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
