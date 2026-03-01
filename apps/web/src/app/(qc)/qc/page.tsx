import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
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
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/shared/status-badge";
import type { MenuStatus } from "@/types/menu";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default async function DesignQueuePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch menus that are paid and need design work
  const { data: menus } = await supabase
    .from("menus")
    .select(
      "id, restaurant_name, cuisine_type, locale, status, updated_at, created_at",
    )
    .in("status", ["paid", "design_in_progress", "design_complete"])
    .order("updated_at", { ascending: true });

  const queue = (menus || []).map((m) => ({
    id: m.id,
    restaurant_name: m.restaurant_name || "Untitled",
    cuisine_type: m.cuisine_type || "—",
    locale: m.locale || "en",
    submitted_at: m.updated_at || m.created_at,
    status: m.status as MenuStatus,
  }));

  const paidCount = queue.filter((q) => q.status === "paid").length;
  const inProgressCount = queue.filter(
    (q) => q.status === "design_in_progress",
  ).length;
  const completedCount = queue.filter(
    (q) => q.status === "design_complete",
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Design Queue</h1>
        <p className="text-muted-foreground">
          Paid orders awaiting design — create the final menu based on the AI
          sample
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>New Orders</CardDescription>
            <CardTitle className="text-3xl">{paidCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
            <CardTitle className="text-3xl">{inProgressCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
            <CardTitle className="text-3xl">{completedCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            {queue.length} {queue.length === 1 ? "menu" : "menus"} in queue
          </CardDescription>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No orders in queue. Waiting for customers.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurant</TableHead>
                  <TableHead>Cuisine</TableHead>
                  <TableHead>Locale</TableHead>
                  <TableHead>Ordered</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.restaurant_name}
                    </TableCell>
                    <TableCell>{item.cuisine_type}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.locale}</Badge>
                    </TableCell>
                    <TableCell>{timeAgo(item.submitted_at)}</TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" asChild>
                        <Link href={`/qc/review/${item.id}`}>
                          {item.status === "paid" ? "Start" : "View"}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
