"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, CreditCard, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { MenuData } from "@/types/menu";

export default function PreviewPage() {
  const router = useRouter();
  const params = useParams();
  const menuId = params.id as string;
  const supabase = createClient();

  const [menu, setMenu] = useState<{ edited_json: MenuData; restaurant_name: string; status: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("menus")
        .select("edited_json, restaurant_name, status, template_id")
        .eq("id", menuId)
        .single();

      if (data) setMenu(data as typeof menu);
      setLoading(false);
    }
    load();
  }, [menuId, supabase]);

  function handleOrder() {
    toast.success("In production, this redirects to Stripe Checkout ($199.00)");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[600px] lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!menu?.edited_json) {
    return <div className="text-center py-16 text-muted-foreground">Menu not found</div>;
  }

  const json = menu.edited_json;
  const totalItems = json.sections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Preview</h1>
          <p className="text-muted-foreground">Review your menu before ordering</p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/menus/${menuId}/style`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />Change Style
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="flex aspect-[1/1.414] items-center justify-center rounded-lg bg-muted/50">
                <div className="space-y-4 p-8 text-center">
                  <FileText className="mx-auto h-16 w-16 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">PDF Preview</h3>
                    <p className="text-sm text-muted-foreground">Your print-ready menu will appear here after the Python backend generates it with WeasyPrint</p>
                  </div>
                  <Badge variant="outline">A4 &middot; 300 DPI &middot; CMYK</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{json.restaurant_name}</CardTitle>
              <CardDescription>{totalItems} items &middot; {json.sections.length} sections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {json.sections.map((section, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span>{section.name}</span>
                    <Badge variant="secondary">{section.items.length}</Badge>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Includes:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>Print-ready PDF (300 DPI, CMYK)</li>
                  <li>AI-generated background art</li>
                  <li>Professional quality control review</li>
                  <li>A4 format</li>
                </ul>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">Total</span>
                <span className="text-lg font-bold">$199.00</span>
              </div>

              <Button className="w-full" size="lg" onClick={handleOrder}>
                <CreditCard className="mr-2 h-4 w-4" />Order Menu — $199.00
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Your menu will be reviewed by a designer before delivery,
                typically within 3 business days.
              </p>
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full" disabled>
            <Download className="mr-2 h-4 w-4" />Download PDF (after payment)
          </Button>
        </div>
      </div>
    </div>
  );
}
