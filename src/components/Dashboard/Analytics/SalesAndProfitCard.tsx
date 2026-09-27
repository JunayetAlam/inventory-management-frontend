"use client";

import React from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Cell,
  Pie,
  PieChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatInvoiceMoney } from "@/utils/formatInvoiceMoney";
import { cn } from "@/lib/utils";
import type {
  TSalesPerformancePoint,
  TProfitBreakdown,
} from "@/types/dashboard";
import ChartMonthRangeFilter, {
  formatRangeSubtext,
} from "./ChartMonthRangeFilter";

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const salesChartConfig = {
  sales: { label: "Sales", color: "var(--chart-6)" },
  expenses: { label: "Expenses", color: "var(--chart-7)" },
  profit: { label: "Profit", color: "var(--chart-2)" },
} satisfies ChartConfig;

const colorVar = (i: number) => `var(--chart-${(i % 12) + 1})`;
const keyOf = (month: string) => `m${month.replace("-", "_")}`;

interface SalesAndProfitCardProps {
  salesData?: TSalesPerformancePoint[];
  profitData?: TProfitBreakdown;
  isSalesLoading?: boolean;
  isProfitLoading?: boolean;
  range?: { startMonth?: string; endMonth?: string };
  onRangeChange?: (range: { startMonth?: string; endMonth?: string }) => void;
}

export default function SalesAndProfitCard({
  salesData,
  profitData,
  isSalesLoading,
  isProfitLoading,
  range,
  onRangeChange,
}: SalesAndProfitCardProps) {
  const hasSalesData = !!salesData?.some((p) => p.sales !== 0 || p.expenses !== 0);

  const months = profitData?.months ?? [];
  const profitChartConfig = Object.fromEntries(
    months.map((m, i) => [keyOf(m.month), { label: m.label, color: colorVar(i) }]),
  ) satisfies ChartConfig;

  const slices = months
    .map((m, i) => ({
      ...m,
      key: keyOf(m.month),
      fill: `var(--color-${keyOf(m.month)})`,
      i,
    }))
    .filter((m) => m.profit > 0);
  const net = profitData?.totalProfit ?? 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold">
            Sales & Profit Performance
          </CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Monthly financial metrics ({formatRangeSubtext(range?.startMonth, range?.endMonth)})
          </p>
        </div>
        <ChartMonthRangeFilter
          startMonth={range?.startMonth}
          endMonth={range?.endMonth}
          onApply={(start, end) =>
            onRangeChange?.({ startMonth: start, endMonth: end })
          }
          onReset={() => onRangeChange?.({})}
        />
      </CardHeader>

      <CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2 xl:divide-x xl:divide-border/60">
          {/* Left Column: Sales Performance */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Sales Performance
                </h3>
                <p className="text-xs text-muted-foreground">
                  Sales, expenses & profit trend
                </p>
              </div>
            </div>

            {isSalesLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : !hasSalesData ? (
              <p className="py-24 text-center text-sm text-muted-foreground">
                No sales recorded in the selected period.
              </p>
            ) : (
              <ChartContainer
                config={salesChartConfig}
                className="min-h-72 max-h-[420px] w-full"
              >
                <ComposedChart accessibilityLayer data={salesData}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(v: string) => {
                      const parts = v.split(" ");
                      return parts.length === 2
                        ? `${parts[0].slice(0, 3)} '${parts[1].slice(2)}`
                        : v.slice(0, 3);
                    }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    width={48}
                    tickFormatter={(v: number) => compact.format(v)}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => (
                          <div className="flex w-full items-center justify-between gap-4">
                            <span className="text-muted-foreground">
                              {salesChartConfig[name as keyof typeof salesChartConfig]
                                ?.label ?? name}
                            </span>
                            <span className="font-mono font-medium tabular-nums">
                              {formatInvoiceMoney(Number(value))}
                            </span>
                          </div>
                        )}
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="sales" fill="var(--color-sales)" radius={4} />
                  <Line
                    dataKey="expenses"
                    type="monotone"
                    stroke="var(--color-expenses)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    dataKey="profit"
                    type="monotone"
                    stroke="var(--color-profit)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </ComposedChart>
              </ChartContainer>
            )}
          </div>

          {/* Right Column: Profit Breakdown */}
          <div className="space-y-4 xl:pl-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Profit Breakdown
                </h3>
                <p className="text-xs text-muted-foreground">
                  Net profit & monthly margin distribution
                </p>
              </div>
            </div>

            {isProfitLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : slices.length === 0 ? (
              <p className="py-24 text-center text-sm text-muted-foreground">
                No profit recorded in the selected period.
              </p>
            ) : (
              <div className="flex flex-col items-center gap-6 lg:flex-row">
                <div className="relative shrink-0">
                  <ChartContainer
                    config={profitChartConfig}
                    className="aspect-square h-56 w-56"
                  >
                    <PieChart>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            hideLabel
                            nameKey="key"
                            formatter={(value, _name, item) => (
                              <div className="flex w-full items-center justify-between gap-4">
                                <span className="text-muted-foreground">
                                  {item.payload?.label}
                                </span>
                                <span className="font-mono font-medium tabular-nums">
                                  {formatInvoiceMoney(Number(value))}
                                </span>
                              </div>
                            )}
                          />
                        }
                      />
                      <Pie
                        data={slices}
                        dataKey="profit"
                        nameKey="key"
                        innerRadius="62%"
                        strokeWidth={2}
                      >
                        {slices.map((s) => (
                          <Cell key={s.month} fill={s.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xs text-muted-foreground">
                      Net profit
                    </span>
                    <span
                      className={cn(
                        "text-sm font-semibold",
                        net < 0 ? "text-destructive" : "text-emerald-600",
                      )}
                    >
                      {formatInvoiceMoney(net)}
                    </span>
                  </div>
                </div>

                <ul className="grid max-h-72 w-full grid-cols-1 gap-x-4 gap-y-2 overflow-y-auto pr-1 text-sm sm:grid-cols-2">
                  {months.map((m, i) => (
                    <li
                      key={m.month}
                      className="flex items-center justify-between gap-2 rounded-md p-1 hover:bg-muted/40 transition-colors"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{
                            background:
                              m.profit > 0 ? colorVar(i) : "var(--destructive)",
                          }}
                        />
                        <span className="truncate">{m.label}</span>
                      </span>
                      <span
                        className={cn(
                          "tabular-nums text-xs font-medium shrink-0",
                          m.profit < 0 && "text-destructive",
                        )}
                      >
                        {m.profit < 0 ? "−" : ""}
                        {formatInvoiceMoney(Math.abs(m.profit))}
                        {m.percent != null && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({m.percent}%)
                          </span>
                        )}
                        {m.profit < 0 && (
                          <span className="ml-1 text-xs">loss</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
