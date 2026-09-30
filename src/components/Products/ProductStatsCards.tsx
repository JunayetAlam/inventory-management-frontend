"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { PackageIcon, WarehouseIcon, ShoppingCart01Icon } from "@hugeicons/core-free-icons";
import { useGetProductStatsQuery } from "@/redux/api/productApi";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatQty(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ProductStatsCards() {
  const { data, isLoading } = useGetProductStatsQuery();
  const stats = data?.data;
  const totalProducts = stats?.totalProducts ?? 0;
  const totalStock = Number(stats?.totalStock) || 0;
  const totalSoldQty = Number(stats?.totalSoldQty) || 0;

  const cards = [
    {
      label: "Total Product",
      value: String(totalProducts),
      icon: PackageIcon,
    },
    {
      label: "Total Stock",
      value: formatQty(totalStock),
      icon: WarehouseIcon,
    },
    {
      label: "Total Sold Qty",
      value: formatQty(totalSoldQty),
      icon: ShoppingCart01Icon,
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
                  <Skeleton className="mt-1 h-7 w-20" />
                ) : (
                  <p className="text-2xl font-bold tracking-tight text-foreground font-mono truncate">
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
