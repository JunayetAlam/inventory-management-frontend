"use client";

import { AlertTriangle, Receipt as Invoice, TrendingDown, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInvoiceMoney } from "@/utils/formatInvoiceMoney";
import { cn } from "@/lib/utils";
import type { TDashboardSummary } from "@/types/dashboard";

export default function DashboardStatCards({
  summary,
  isLoading,
}: {
  summary?: TDashboardSummary["summary"];
  isLoading?: boolean;
}) {
  const cards = [
    {
      label: "Total Sale Amount",
      value: formatInvoiceMoney(summary?.totalSales ?? 0),
      icon: Invoice,
      tone: "",
    },
    {
      label: "Total Customers",
      value: String(summary?.totalCustomers ?? 0),
      icon: Users,
      tone: "",
    },
    {
      label: "Total Expenses",
      value: formatInvoiceMoney(summary?.totalExpenses ?? 0),
      icon: TrendingDown,
      tone: "",
    },
    {
      label: "Low Stock Items",
      value: String(summary?.lowStockCount ?? 0),
      icon: AlertTriangle,
      tone: (summary?.lowStockCount ?? 0) > 0 ? "text-amber-600" : "",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, tone }) => (
        <Card key={label}>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{label}</p>
              {isLoading ? (
                <Skeleton className="mt-2 h-7 w-28" />
              ) : (
                <p className={cn("mt-1 truncate text-xl font-semibold", tone)}>
                  {value}
                </p>
              )}
            </div>
            <Icon className={cn("size-6 shrink-0 text-muted-foreground", tone)} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
