import { StatusBadge } from "@/components/shared/status-badge";
import type { Menu, MenuStatus } from "@/types/menu";

export function MenuHubHeader({ menu }: { menu: Menu }) {
  return (
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
  );
}
