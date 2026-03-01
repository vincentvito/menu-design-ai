import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import {
  ArrowRight,
  UtensilsCrossed,
  LayoutGrid,
  Palette,
  ImageIcon,
  CreditCard,
  Truck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import type { MenuStatus } from "@/types/menu";

const AFTER_CUISINE = [
  "style_selected",
  "generating_samples",
  "samples_ready",
  "sample_selected",
  "payment_pending",
  "paid",
  "design_in_progress",
  "design_complete",
  "delivered",
];
const AFTER_FORMAT = [
  "style_selected",
  "generating_samples",
  "samples_ready",
  "sample_selected",
  "payment_pending",
  "paid",
  "design_in_progress",
  "design_complete",
  "delivered",
];
const AFTER_STYLE = [
  "generating_samples",
  "samples_ready",
  "sample_selected",
  "payment_pending",
  "paid",
  "design_in_progress",
  "design_complete",
  "delivered",
];
const AFTER_SAMPLES = [
  "sample_selected",
  "payment_pending",
  "paid",
  "design_in_progress",
  "design_complete",
  "delivered",
];
const AFTER_PAYMENT = [
  "paid",
  "design_in_progress",
  "design_complete",
  "delivered",
];

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

  const { data: menu } = await supabase
    .from("menus")
    .select("*")
    .eq("id", id)
    .single();

  if (!menu) notFound();

  const steps = [
    {
      title: "Select Cuisine",
      description: "Choose your restaurant's cuisine type",
      href: `/menus/${id}/cuisine`,
      icon: UtensilsCrossed,
      done: !!menu.cuisine_type || AFTER_CUISINE.includes(menu.status),
    },
    {
      title: "Format & Layout",
      description: "Choose menu format and page layout",
      href: `/menus/${id}/format`,
      icon: LayoutGrid,
      done: !!menu.menu_format || AFTER_FORMAT.includes(menu.status),
    },
    {
      title: "Style & Colors",
      description: "Pick a design style and color palette",
      href: `/menus/${id}/style`,
      icon: Palette,
      done: !!menu.template_id || AFTER_STYLE.includes(menu.status),
    },
    {
      title: "AI Samples",
      description: "Review 4 AI-generated menu designs and pick your favorite",
      href: `/menus/${id}/results`,
      icon: ImageIcon,
      done: AFTER_SAMPLES.includes(menu.status),
    },
    {
      title: "Order ($199)",
      description:
        "Place your order — a professional designer will create your final menu",
      href: `/menus/${id}/order`,
      icon: CreditCard,
      done: AFTER_PAYMENT.includes(menu.status),
    },
    {
      title: "Delivery",
      description: "Your designer is working on the final menu",
      href: `/menus/${id}`,
      icon: Truck,
      done: menu.status === "delivered",
    },
  ];

  const currentIdx = steps.findIndex((s) => !s.done);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {menu.restaurant_name || "Untitled Menu"}
          </h1>
          <p className="text-muted-foreground">
            {menu.cuisine_type || "Menu"} &middot;{" "}
            {menu.input_method === "text_paste" ? "Text input" : "File upload"}
          </p>
        </div>
        <StatusBadge status={menu.status as MenuStatus} />
      </div>

      <div className="space-y-4">
        {steps.map((step, i) => (
          <Card
            key={step.title}
            className={i === currentIdx ? "border-primary" : ""}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step.done ? "bg-primary text-primary-foreground" : i === currentIdx ? "border-2 border-primary text-primary" : "border-2 border-muted text-muted-foreground"}`}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <CardTitle className="text-base">{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </div>
                </div>
                {i === currentIdx && step.href !== `/menus/${id}` && (
                  <Button asChild>
                    <Link href={step.href}>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {step.done && step.href !== `/menus/${id}` && (
                  <Button variant="ghost" asChild>
                    <Link href={step.href}>View</Link>
                  </Button>
                )}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
