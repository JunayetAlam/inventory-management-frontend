"use client";

import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { ArrowDownLeft01Icon, ArrowUpRight01Icon, CalendarClockIcon, Calendar01Icon, Calendar04Icon, Wallet01Icon } from "@hugeicons/core-free-icons";
import { useGetCustomerStatsQuery } from "@/redux/api/statsApi";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatSignedDue } from "@/utils/formatInvoiceMoney";
import { cn } from "@/lib/utils";

interface StatItemProps {
  title: string;
  icon: IconSvgElement;
  iconBg: string;
  iconColor: string;
  due: number;
  deposit: number;
  isLoading: boolean;
  subtitle?: string;
}

function PeriodStatCard({
  title,
  icon: Icon,
  iconBg,
  iconColor,
  due,
  deposit,
  isLoading,
  subtitle,
}: StatItemProps) {
  return (
    <Card className="shadow-xs ring-border/60 hover:shadow-sm transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-lg",
                iconBg,
                iconColor,
              )}
            >
              <HugeiconsIcon icon={Icon} strokeWidth={2} className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {title}
              </p>
              {subtitle && (
                <p className="text-[10px] text-muted-foreground truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Breakdown: Deposit & Due */}
        {isLoading ? (
          <div className="space-y-2 pt-1">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/50">
            {/* Deposit */}
            <div className="rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 p-2 border border-emerald-500/15">
              <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <HugeiconsIcon icon={ArrowDownLeft01Icon} strokeWidth={2} className="size-3 shrink-0" />
                <span>Deposit</span>
              </div>
              <p className="mt-0.5 text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate">
                {formatSignedDue(deposit)}
              </p>
            </div>

            {/* Due */}
            <div
              className={cn(
                "rounded-lg p-2 border",
                due > 0
                  ? "bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/15"
                  : "bg-muted/40 border-border/50",
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-1 text-[10px] font-medium",
                  due > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-muted-foreground",
                )}
              >
                <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={2} className="size-3 shrink-0" />
                <span>Due</span>
              </div>
              <p
                className={cn(
                  "mt-0.5 text-sm font-bold font-mono truncate",
                  due > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-foreground",
                )}
              >
                {formatSignedDue(due)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function CustomerStatsCards() {
  const { data, isLoading } = useGetCustomerStatsQuery();
  const stats = data?.data;

  const totalCustomers = stats?.totalCustomers ?? 0;
  const todayDue = Number(stats?.today?.due ?? 0);
  const todayDeposit = Number(stats?.today?.deposit ?? 0);

  const thisMonthDue = Number(stats?.thisMonth?.due ?? 0);
  const thisMonthDeposit = Number(stats?.thisMonth?.deposit ?? 0);

  const thisYearDue = Number(stats?.thisYear?.due ?? 0);
  const thisYearDeposit = Number(stats?.thisYear?.deposit ?? 0);

  const totalDue = Number(stats?.total?.due ?? stats?.totalDue ?? 0);
  const totalDeposit = Number(stats?.total?.deposit ?? 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Today Amount */}
      <PeriodStatCard
        title="Today Amount"
        icon={CalendarClockIcon}
        iconBg="bg-blue-500/10"
        iconColor="text-blue-600 dark:text-blue-400"
        due={todayDue}
        deposit={todayDeposit}
        isLoading={isLoading}
      />

      {/* 2. This Month Amount */}
      <PeriodStatCard
        title="This Month Amount"
        icon={Calendar01Icon}
        iconBg="bg-violet-500/10"
        iconColor="text-violet-600 dark:text-violet-400"
        due={thisMonthDue}
        deposit={thisMonthDeposit}
        isLoading={isLoading}
      />

      {/* 3. This Year Amount */}
      <PeriodStatCard
        title="This Year Amount"
        icon={Calendar04Icon}
        iconBg="bg-amber-500/10"
        iconColor="text-amber-600 dark:text-amber-400"
        due={thisYearDue}
        deposit={thisYearDeposit}
        isLoading={isLoading}
      />

      {/* 4. Total Amount */}
      <PeriodStatCard
        title="Total Amount"
        subtitle={`${totalCustomers} active ${totalCustomers === 1 ? "customer" : "customers"}`}
        icon={Wallet01Icon}
        iconBg="bg-primary/10"
        iconColor="text-primary"
        due={totalDue}
        deposit={totalDeposit}
        isLoading={isLoading}
      />
    </div>
  );
}
