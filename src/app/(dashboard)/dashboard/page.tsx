"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import useIsAdmin from "@/hooks/useIsAdmin";
import useHandleSearchParams from "@/hooks/useHandleSearchParams";
import {
  useGetDashboardSummaryQuery,
  useGetProfitBreakdownQuery,
  useGetSalesPerformanceQuery,
} from "@/redux/api/statsApi";
import type { TDashboardPreset } from "@/types/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DashboardHeader from "@/components/Dashboard/Analytics/DashboardHeader";
import DashboardStatCards from "@/components/Dashboard/Analytics/DashboardStatCards";
import SalesAndProfitCard from "@/components/Dashboard/Analytics/SalesAndProfitCard";
import TopSellingProducts from "@/components/Dashboard/Analytics/TopSellingProducts";
import LowStockTable from "@/components/Dashboard/Analytics/LowStockTable";
import CustomerTransactionTable from "@/components/CustomerTransactions/CustomerTransactionTable";

const PRESET_VALUES: TDashboardPreset[] = ["today", "week", "month", "all", "custom"];

function DashboardContent() {
  const [isAdmin, isAdminLoading] = useIsAdmin();
  const searchParams = useSearchParams();
  const { handleSetSearchParams } = useHandleSearchParams();

  // Shared month range filter for Sales Performance & Profit Breakdown
  const [analyticsMonthRange, setAnalyticsMonthRange] = useState<{
    startMonth?: string;
    endMonth?: string;
  }>({});

  const rawPreset = searchParams.get("preset") as TDashboardPreset | null;
  const startDate = searchParams.get("startDate") ?? "";
  const endDate = searchParams.get("endDate") ?? "";
  const preset: TDashboardPreset =
    rawPreset && PRESET_VALUES.includes(rawPreset) ? rawPreset : "month";
  const customReady = preset !== "custom" || (!!startDate && !!endDate);

  const skip = !isAdmin || !customReady;
  const summaryQ = useGetDashboardSummaryQuery(
    { preset, ...(preset === "custom" ? { startDate, endDate } : {}) },
    { skip },
  );
  const salesQ = useGetSalesPerformanceQuery(
    analyticsMonthRange.startMonth && analyticsMonthRange.endMonth
      ? analyticsMonthRange
      : undefined,
    { skip: !isAdmin },
  );
  const profitQ = useGetProfitBreakdownQuery(
    analyticsMonthRange.startMonth && analyticsMonthRange.endMonth
      ? analyticsMonthRange
      : undefined,
    { skip: !isAdmin },
  );

  if (isAdminLoading) return null;
  if (!isAdmin) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You do not have permission to view dashboard analytics.
        </p>
      </div>
    );
  }

  const summary = summaryQ.data?.data;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <DashboardHeader
        preset={preset}
        startDate={startDate}
        endDate={endDate}
        rangeFrom={summary?.range.startDate}
        rangeTo={summary?.range.endDate}
        onPreset={(p) =>
          handleSetSearchParams({ preset: p, startDate: "", endDate: "", page: "1" })
        }
        onClearRange={() =>
          handleSetSearchParams({ preset: "", startDate: "", endDate: "", page: "1" })
        }
        onCustomRange={(s, e) =>
          handleSetSearchParams({ preset: "custom", startDate: s, endDate: e })
        }
      />

      <DashboardStatCards
        summary={summary?.summary}
        isLoading={summaryQ.isLoading || summaryQ.isFetching}
      />

      {/* Row 1: Sales Performance & Profit Breakdown in one card with one month range selector */}
      <SalesAndProfitCard
        salesData={salesQ.data?.data}
        profitData={profitQ.data?.data}
        isSalesLoading={salesQ.isLoading || salesQ.isFetching}
        isProfitLoading={profitQ.isLoading || profitQ.isFetching}
        range={analyticsMonthRange}
        onRangeChange={setAnalyticsMonthRange}
      />

      {/* Row 2: Top 10 Selling Products & Low Stock in one row */}
      <div className="grid gap-6 xl:grid-cols-2">
        <TopSellingProducts
          products={summary?.topProducts}
          isLoading={summaryQ.isLoading || summaryQ.isFetching}
        />
        <LowStockTable />
      </div>

      {/* Row 3: Customer Transactions inside a Card (stats hidden for dashboard) */}
      <Card className="overflow-hidden">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base font-semibold">
            Customer Transactions
          </CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Search, filter by client or date range, view details, and export records
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <CustomerTransactionTable hideStats={true} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}
