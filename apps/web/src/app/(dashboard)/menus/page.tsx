import Link from "next/link";
import { Plus, Coins } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { StatusBadge } from "@/components/shared/status-badge";
import type { MenuStatus } from "@/types/menu";

export default async function MenusPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: menus }, { data: credits }] = await Promise.all([
    supabase
      .from("menus")
      .select("id, restaurant_name, status, cuisine_type, locale, created_at, edited_json")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", user.id)
      .single(),
  ]);

  const menuList = menus || [];
  const balance = credits?.balance ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Menus</h1>
          <p className="text-muted-foreground">
            Manage your restaurant menu designs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
            <Coins className="h-3 w-3" />
            {balance} credits
          </Badge>
          <Button asChild>
            <Link href="/menus/new">
              <Plus className="mr-2 h-4 w-4" />
              New Menu
            </Link>
          </Button>
        </div>
      </div>

      {menuList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <h3 className="mb-2 text-lg font-semibold">No menus yet</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Upload your first menu to get started
            </p>
            <Button asChild>
              <Link href="/menus/new">
                <Plus className="mr-2 h-4 w-4" />
                Create your first menu
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Menus</CardTitle>
            <CardDescription>
              {menuList.length} menu{menuList.length !== 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Cuisine</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menuList.map((menu) => {
                  const json = menu.edited_json as { sections?: { items?: unknown[] }[] } | null;
                  const itemCount =
                    json?.sections?.reduce(
                      (sum, s) => sum + (s.items?.length || 0),
                      0
                    ) || 0;

                  return (
                    <TableRow key={menu.id}>
                      <TableCell className="font-medium">
                        {menu.restaurant_name || "Untitled"}
                      </TableCell>
                      <TableCell>{menu.cuisine_type || "—"}</TableCell>
                      <TableCell>{itemCount}</TableCell>
                      <TableCell>
                        <StatusBadge status={menu.status as MenuStatus} />
                      </TableCell>
                      <TableCell>
                        {new Date(menu.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/menus/${menu.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
