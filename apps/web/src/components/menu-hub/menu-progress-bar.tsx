import { Fragment } from "react";
import { Check } from "lucide-react";
import type { Menu, MenuStatus } from "@/types/menu";

export type MenuPhase =
  | "setup"
  | "generation"
  | "selection"
  | "fulfillment"
  | "failed";

const AFTER_CUISINE: MenuStatus[] = [
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
const AFTER_FORMAT: MenuStatus[] = AFTER_CUISINE;
const AFTER_STYLE: MenuStatus[] = [
  "generating_samples",
  "samples_ready",
  "sample_selected",
  "payment_pending",
  "paid",
  "design_in_progress",
  "design_complete",
  "delivered",
];
const AFTER_SAMPLES: MenuStatus[] = [
  "sample_selected",
  "payment_pending",
  "paid",
  "design_in_progress",
  "design_complete",
  "delivered",
];
const AFTER_PAYMENT: MenuStatus[] = [
  "paid",
  "design_in_progress",
  "design_complete",
  "delivered",
];

export function getPhase(status: MenuStatus): MenuPhase {
  if (
    (
      [
        "draft",
        "ocr_processing",
        "ocr_complete",
        "editing",
        "style_selected",
      ] as MenuStatus[]
    ).includes(status)
  )
    return "setup";
  if (
    (["generating_samples", "samples_ready"] as MenuStatus[]).includes(status)
  )
    return "generation";
  if (
    (["sample_selected", "payment_pending"] as MenuStatus[]).includes(status)
  )
    return "selection";
  if (
    (
      [
        "paid",
        "design_in_progress",
        "design_complete",
        "delivered",
      ] as MenuStatus[]
    ).includes(status)
  )
    return "fulfillment";
  return "failed";
}

function getSteps(menu: Menu) {
  const status = menu.status as MenuStatus;
  return [
    {
      label: "Cuisine",
      done: !!menu.cuisine_type || AFTER_CUISINE.includes(status),
    },
    {
      label: "Format",
      done: !!menu.menu_format || AFTER_FORMAT.includes(status),
    },
    {
      label: "Style",
      done: !!menu.template_id || AFTER_STYLE.includes(status),
    },
    { label: "AI Samples", done: AFTER_SAMPLES.includes(status) },
    { label: "Download", done: AFTER_SAMPLES.includes(status) },
  ];
}

export function MenuProgressBar({
  menu,
  phase,
}: {
  menu: Menu;
  phase: MenuPhase;
}) {
  if (phase === "fulfillment" || phase === "failed") return null;

  const steps = getSteps(menu);

  return (
    <div className="flex items-center">
      {steps.map((step, i) => (
        <Fragment key={step.label}>
          {i > 0 && (
            <div
              className={`h-0.5 flex-1 ${step.done ? "bg-primary" : "bg-muted"}`}
            />
          )}
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                step.done
                  ? "bg-primary text-primary-foreground"
                  : "border-2 border-muted text-muted-foreground"
              }`}
            >
              {step.done ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className="text-xs text-muted-foreground">{step.label}</span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}
