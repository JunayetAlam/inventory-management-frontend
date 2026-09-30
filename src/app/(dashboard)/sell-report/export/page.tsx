"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { useGetProductProfitQuery } from "@/redux/api/productApi";
import SellReportExportView from "@/components/SellReport/SellReportExportView";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import useIsAdmin from "@/hooks/useIsAdmin";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function filterLabelFromParams(params: URLSearchParams) {
  const start = params.get("startDate");
  const end = params.get("endDate");
  if (start && end) return `${start} → ${end}`;
  if (start) return `From ${start}`;
  if (end) return `Until ${end}`;
  return "All time";
}

function ExportLoading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 py-10 px-4">
      <div className="max-w-[210mm] mx-auto space-y-6">
        <Skeleton className="h-10 w-48 rounded-md" />
        <Skeleton className="h-[297mm] w-full rounded-sm" />
      </div>
    </div>
  );
}

function SellReportExportPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAdmin, isAdminLoading] = useIsAdmin();

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [isAdmin, isAdminLoading, router]);

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {
      limit: 200,
      page: 1,
      sortBy: searchParams.get("sortBy") || "salesTotal",
      sortOrder: searchParams.get("sortOrder") || "desc",
    };

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const searchTerm = searchParams.get("searchTerm")?.trim();

    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (searchTerm) params.searchTerm = searchTerm;

    return params;
  }, [searchParams]);

  const filterLabel = filterLabelFromParams(searchParams);
  const searchTerm = searchParams.get("searchTerm")?.trim() || undefined;

  const { data, isLoading, isError } = useGetProductProfitQuery(queryParams, {
    skip: !isAdmin,
  });

  if (isAdminLoading || !isAdmin || isLoading) return <ExportLoading />;

  if (isError || !data?.data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 py-12 px-4">
        <div className="max-w-md mx-auto p-8 text-center space-y-4 rounded-xl border border-destructive/30 bg-card shadow-sm">
          <p className="text-destructive font-semibold">
            Failed to load the sell report
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="gap-2 cursor-pointer"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} className="size-4" />
            <span className="hidden sm:inline">Go Back</span>
          </Button>
        </div>
      </div>
    );
  }

  const report = data.data;
  const truncated =
    (data.meta?.total ?? 0) > (report.products?.length ?? 0)
      ? ` (showing ${report.products.length} of ${data.meta?.total})`
      : "";

  return (
    <SellReportExportView
      products={report.products}
      summary={report.summary}
      filterLabel={`${filterLabel}${truncated}`}
      searchTerm={searchTerm}
    />
  );
}

export default function SellReportExportPage() {
  return (
    <Suspense fallback={<ExportLoading />}>
      <SellReportExportPageInner />
    </Suspense>
  );
}
