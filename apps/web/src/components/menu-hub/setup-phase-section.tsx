import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Menu, MenuData } from "@/types/menu";

function getNextStepHref(menu: Menu): string {
  if (!menu.cuisine_type) return `/menus/${menu.id}/cuisine`;
  if (!menu.menu_format) return `/menus/${menu.id}/format`;
  return `/menus/${menu.id}/style`;
}

export function SetupPhaseSection({ menu }: { menu: Menu }) {
  const menuData: MenuData | null = menu.edited_json ?? menu.extracted_json;
  const sectionCount = menuData?.sections?.length ?? 0;
  const itemCount =
    menuData?.sections?.reduce((sum, s) => sum + s.items.length, 0) ?? 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Menu Data</CardTitle>
          </div>
          <CardDescription>
            {sectionCount > 0
              ? `${sectionCount} section${sectionCount !== 1 ? "s" : ""}, ${itemCount} item${itemCount !== 1 ? "s" : ""}`
              : "No menu data extracted yet"}
          </CardDescription>
        </CardHeader>
        {sectionCount > 0 && (
          <CardContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {menuData!.sections.map((section) => (
                <li key={section.name} className="flex justify-between">
                  <span>{section.name}</span>
                  <span>
                    {section.items.length} item
                    {section.items.length !== 1 ? "s" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>

      {menu.cuisine_type && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Cuisine</span>
            <p className="font-medium capitalize">{menu.cuisine_type}</p>
          </div>
          {menu.menu_format && (
            <div>
              <span className="text-muted-foreground">Format</span>
              <p className="font-medium capitalize">
                {menu.menu_format.replace("_", " ")}
              </p>
            </div>
          )}
          {menu.page_layout && (
            <div>
              <span className="text-muted-foreground">Layout</span>
              <p className="font-medium capitalize">
                {menu.page_layout.replace("_", " ")}
              </p>
            </div>
          )}
        </div>
      )}

      <Button asChild className="w-full">
        <Link href={getNextStepHref(menu)}>
          Continue Setup
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
