import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Coins, ArrowUpRight, ArrowDownRight } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";

const typeLabel: Record<string, string> = {
  signup_bonus: "Signup Bonus",
  purchase: "Credit Purchase",
  generation: "AI Generation",
  refund: "Refund",
  admin_grant: "Admin Grant",
};

export default async function CreditsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: credits } = await supabase
    .from("user_credits")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: transactions } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const balance = credits?.balance ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Credits</h1>
          <p className="text-muted-foreground">
            Each generation produces 4 AI menu design samples
          </p>
        </div>
        <Button asChild>
          <Link href="/credits/buy">
            <Plus className="mr-2 h-4 w-4" />Buy Credits
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Available Credits</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Coins className="h-6 w-6 text-primary" />
              {balance}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Earned</CardDescription>
            <CardTitle className="text-3xl">{credits?.lifetime_earned ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Used</CardDescription>
            <CardTitle className="text-3xl">{credits?.lifetime_spent ?? 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Your credit activity</CardDescription>
        </CardHeader>
        <CardContent>
          {!transactions || transactions.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No transactions yet. Your signup bonus will appear here.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      <Badge variant={tx.amount > 0 ? "default" : "secondary"}>
                        {typeLabel[tx.type] || tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tx.description}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`flex items-center justify-end gap-1 font-mono ${tx.amount > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                        {tx.amount > 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3" />
                        )}
                        {tx.amount > 0 ? "+" : ""}{tx.amount}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {tx.balance_after}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString()}
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
