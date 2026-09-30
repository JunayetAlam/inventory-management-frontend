"use client";

import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDataTransferHorizontalIcon, Clock01Icon, Wallet01Icon, BalanceScaleIcon } from "@hugeicons/core-free-icons";
import { useGetCustomerTransactionStatsQuery } from "@/redux/api/customerTransactionApi";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatInvoiceMoney,
  formatSignedDue,
} from "@/utils/formatInvoiceMoney";

interface CustomerProfileStatsCardsProps {
  customerId: string;
}

export default function CustomerProfileStatsCards({
  customerId,
}: CustomerProfileStatsCardsProps) {
  const { data, isLoading } = useGetCustomerTransactionStatsQuery(
    { customerId },
    { skip: !customerId },
  );

  const stats = data?.data;
  const totalTransactions = stats?.totalTransactions ?? 0;
  const totalDue = stats?.totalDue ?? 0;
  const totalPayment = stats?.totalPayment ?? 0;
  const totalBalance = stats?.totalBalance ?? totalDue - totalPayment;

  const cards = [
    {
      label: "Total Transactions",
      value: totalTransactions.toLocaleString(),
      icon: ArrowDataTransferHorizontalIcon,
      iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      description: "Total recorded transactions",
    },
    {
      label: "Total Due",
      value: formatInvoiceMoney(totalDue),
      icon: Clock01Icon,
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      description: "Sum of all invoiced amounts",
    },
    {
      label: "Total Cash / Payment",
      value: formatInvoiceMoney(totalPayment),
      icon: Wallet01Icon,
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      description: "Total payments & return credits",
    },
    {
      label: "Present Due",
      value: formatSignedDue(totalBalance),
      icon: BalanceScaleIcon,
      iconBg:
        totalBalance > 0
          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
          : "bg-purple-500/10 text-purple-600 dark:text-purple-400",
      description: "Net outstanding balance (Due - Paid)",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label} className="shadow-xs ring-border/60 border">
            <CardContent className="flex items-center gap-4">
              <div
                className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${card.iconBg}`}
              >
                <HugeiconsIcon icon={Icon} strokeWidth={2} className="size-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground truncate">
                  {card.label}
                </p>
                {isLoading ? (
                  <Skeleton className="mt-1 h-7 w-24" />
                ) : (
                  <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono truncate mt-0.5">
                    {card.value}
                  </p>
                )}
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  {card.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
