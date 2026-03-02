import { Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Menu, MenuStatus } from "@/types/menu";

interface OrderSummary {
  id: string;
  status: string;
  amount: number;
  currency: string;
  paid_at: string | null;
  created_at: string;
}

const TIMELINE_STEPS = [
  {
    label: "Order Placed",
    doneAfter: [
      "paid",
      "design_in_progress",
      "design_complete",
      "delivered",
    ] as MenuStatus[],
  },
  {
    label: "Designer Working",
    doneAfter: [
      "design_in_progress",
      "design_complete",
      "delivered",
    ] as MenuStatus[],
  },
  {
    label: "Design Complete",
    doneAfter: ["design_complete", "delivered"] as MenuStatus[],
  },
  {
    label: "Delivered",
    doneAfter: ["delivered"] as MenuStatus[],
  },
];

export function FulfillmentPhaseSection({
  menu,
  selectedImage,
  order,
}: {
  menu: Menu;
  selectedImage: { id: string; image_url: string } | null;
  order: OrderSummary | null;
}) {
  const status = menu.status as MenuStatus;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {selectedImage && (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedImage.image_url}
                alt="Selected menu design"
                className="aspect-[3/4] w-full object-cover"
              />
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          <h3 className="font-semibold">Order Status</h3>
          <div className="space-y-0">
            {TIMELINE_STEPS.map((step, i) => {
              const done = step.doneAfter.includes(status);
              const isLast = i === TIMELINE_STEPS.length - 1;

              return (
                <div key={step.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        done
                          ? "bg-primary text-primary-foreground"
                          : "border-2 border-muted text-muted-foreground"
                      }`}
                    >
                      {done && <Check className="h-3.5 w-3.5" />}
                    </div>
                    {!isLast && (
                      <div
                        className={`h-8 w-0.5 ${done ? "bg-primary" : "bg-muted"}`}
                      />
                    )}
                  </div>
                  <div className="pt-0.5">
                    <p
                      className={`text-sm font-medium ${done ? "" : "text-muted-foreground"}`}
                    >
                      {step.label}
                    </p>
                    {step.label === "Order Placed" && order?.paid_at && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.paid_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {status === "delivered" && menu.final_deliverable_urls && (
        <Card>
          <CardContent className="flex flex-col gap-2 pt-6">
            <h3 className="font-semibold">Your Files</h3>
            {menu.final_deliverable_urls.map((url, i) => (
              <Button key={i} variant="outline" asChild>
                <a href={url} download>
                  <Download className="mr-2 h-4 w-4" />
                  Download File {i + 1}
                </a>
              </Button>
            ))}
            {menu.final_pdf_url && (
              <Button asChild>
                <a href={menu.final_pdf_url} download>
                  <Download className="mr-2 h-4 w-4" />
                  Download Final PDF
                </a>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
