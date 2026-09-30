"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { PackageIcon, ShoppingCart01Icon, Wallet01Icon, ChartDecreaseIcon, ChartIncreaseIcon } from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInvoiceMoney } from "@/utils/formatInvoiceMoney";
import { cn } from "@/lib/utils";
import type { TProductProfitSummary } from "@/types";

function formatQty(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ProductProfitSummaryCards({
  summary,
  isLoading,
}: {
  summary?: TProductProfitSummary | null;
  isLoading?: boolean;
}) {
  const soldQty = summary?.soldQty ?? 0;
  const salesTotal = summary?.salesTotal ?? 0;
  const purchaseCost = summary?.purchaseCost ?? 0;
  const profit = summary?.profit ?? 0;
  const productCount = summary?.productCount ?? 0;
  const profitPercent = summary?.profitPercent;

  const cards = [
    {
      label: "Products",
      value: String(productCount),
      icon: PackageIcon,
      tone: "neutral" as const,
    },
    {
      label: "Sold Qty",
      value: formatQty(soldQty),
      icon: ShoppingCart01Icon,
      tone: "neutral" as const,
    },
    {
      label: "Sales Total",
      value: formatInvoiceMoney(salesTotal),
      icon: Wallet01Icon,
      tone: "neutral" as const,
    },
    {
      label: "Purchase Cost",
      value: formatInvoiceMoney(purchaseCost),
      icon: ChartDecreaseIcon,
      tone: "neutral" as const,
    },
    {
      label: "Net Profit/Loss",
      value:
        profitPercent != null
          ? `${formatInvoiceMoney(profit)} (${profitPercent}%)`
          : formatInvoiceMoney(profit),
      icon: ChartIncreaseIcon,
      tone:
        profit > 0 ? ("profit" as const) : profit < 0 ? ("loss" as const) : ("neutral" as const),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="shadow-xs ring-border/60">
            <CardContent className="flex items-center gap-4">
              <div
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl",
                  card.tone === "profit" && "bg-emerald-500/10 text-emerald-600",
                  card.tone === "loss" && "bg-rose-500/10 text-rose-600",
                  card.tone === "neutral" && "bg-primary/10 text-primary",
                )}
              >
                <HugeiconsIcon icon={Icon} strokeWidth={2} className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  {card.label}
                </p>
                {isLoading ? (
                  <Skeleton className="mt-1 h-7 w-24" />
                ) : (
                  <p
                    className={cn(
                      "text-lg font-bold tracking-tight font-mono truncate",
                      card.tone === "profit" && "text-emerald-600",
                      card.tone === "loss" && "text-rose-600",
                      card.tone === "neutral" && "text-foreground",
                    )}
                  >
                    {card.value}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
