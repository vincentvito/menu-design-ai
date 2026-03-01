import { Badge } from "@/components/ui/badge";
import type { MenuStatus } from "@/types/menu";

const statusConfig: Record<
  MenuStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  ocr_processing: { label: "Extracting...", variant: "outline" },
  ocr_complete: { label: "Ready", variant: "outline" },
  editing: { label: "Editing", variant: "outline" },
  style_selected: { label: "Style Selected", variant: "outline" },
  generating_samples: { label: "Generating...", variant: "outline" },
  samples_ready: { label: "Samples Ready", variant: "default" },
  sample_selected: { label: "Sample Picked", variant: "default" },
  payment_pending: { label: "Awaiting Payment", variant: "outline" },
  paid: { label: "Paid", variant: "default" },
  design_in_progress: { label: "In Design", variant: "outline" },
  design_complete: { label: "Design Complete", variant: "default" },
  delivered: { label: "Delivered", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
};

export function StatusBadge({ status }: { status: MenuStatus }) {
  const config = statusConfig[status] || {
    label: status,
    variant: "secondary" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
