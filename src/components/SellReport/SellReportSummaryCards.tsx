"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { PackageIcon, ShoppingCart01Icon, Wallet01Icon } from "@hugeicons/core-free-icons";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInvoiceMoney } from "@/utils/formatInvoiceMoney";
import type { TProductProfitSummary } from "@/types";

function formatQty(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

export default function SellReportSummaryCards({
  summary,
  isLoading,
}: {
  summary?: TProductProfitSummary | null;
  isLoading?: boolean;
}) {
  const soldQty = summary?.soldQty ?? 0;
  const salesTotal = summary?.salesTotal ?? 0;
  const productCount = summary?.productCount ?? 0;

  const cards = [
    {
      label: "Products",
      value: String(productCount),
      icon: PackageIcon,
    },
    {
      label: "Sold Qty",
      value: formatQty(soldQty),
      icon: ShoppingCart01Icon,
    },
    {
      label: "Total Sales",
      value: formatInvoiceMoney(salesTotal),
      icon: Wallet01Icon,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="shadow-xs ring-border/60">
            <CardContent className="flex items-center gap-4">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HugeiconsIcon icon={Icon} strokeWidth={2} className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  {card.label}
                </p>
                {isLoading ? (
                  <Skeleton className="mt-1 h-7 w-24" />
                ) : (
                  <p className="text-lg font-bold tracking-tight font-mono truncate text-foreground">
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
