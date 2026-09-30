"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { useGetAllCustomersQuery } from "@/redux/api/customerApi";
import CustomerListExportView from "@/components/Customers/CustomerListExport/CustomerListExportView";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

function filterLabelFromParams(params: URLSearchParams) {
  if (params.get("isDeleted") === "true") return "Archived";
  if (params.get("isDeleteRequested") === "true") return "Pending Deletion";
  return "All Active";
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

function CustomerExportPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {
      limit: "all",
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
    };

    const searchTerm = searchParams.get("searchTerm")?.trim();
    if (searchTerm) params.searchTerm = searchTerm;

    if (searchParams.get("isDeleted") === "true") {
      params.isDeleted = true;
    } else {
      params.isDeleted = false;
    }

    if (searchParams.get("isDeleteRequested") === "true") {
      params.isDeleteRequested = true;
    }

    return params;
  }, [searchParams]);

  const filterLabel = filterLabelFromParams(searchParams);
  const searchTerm = searchParams.get("searchTerm")?.trim() || undefined;

  const { data, isLoading, isError } = useGetAllCustomersQuery(queryParams);
  const customers = data?.data || [];

  if (isLoading) return <ExportLoading />;

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 py-12 px-4">
        <div className="max-w-md mx-auto p-8 text-center space-y-4 rounded-xl border border-destructive/30 bg-card shadow-sm">
          <p className="text-destructive font-semibold">
            Failed to load the customer list
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

  return (
    <CustomerListExportView
      customers={customers}
      filterLabel={filterLabel}
      searchTerm={searchTerm}
    />
  );
}

export default function CustomerExportPage() {
  return (
    <Suspense fallback={<ExportLoading />}>
      <CustomerExportPageInner />
    </Suspense>
  );
}
