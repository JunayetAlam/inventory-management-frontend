"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { useGetAllProductsQuery } from "@/redux/api/productApi";
import ProductListExportView from "@/components/Products/ProductListExport/ProductListExportView";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

function filterLabelFromParams(params: URLSearchParams) {
  if (params.get("isDeleted") === "true") return "Archived";
  if (params.get("isDeleteRequested") === "true") return "Pending Deletion";
  const stockStatus = params.get("stockStatus");
  if (stockStatus === "NEGATIVE") return "Negative Stock (< 0)";
  if (stockStatus === "OUT_OF_STOCK") return "Out of Stock (0)";
  if (stockStatus === "CRITICAL") return "Critical Low (1–5)";
  if (stockStatus === "LOW") return "Low Stock (6–20)";
  if (params.get("lowStock") === "true") return "Low Stock (≤ 20)";
  const unit = params.get("unit");
  if (unit) return `Active · ${unit}`;
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

function ProductExportPageInner() {
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

    const unit = searchParams.get("unit");
    if (unit) params.unit = unit;

    if (searchParams.get("isDeleted") === "true") {
      params.isDeleted = true;
    } else {
      params.isDeleted = false;
    }

    if (searchParams.get("isDeleteRequested") === "true") {
      params.isDeleteRequested = true;
    }

    if (searchParams.get("lowStock") === "true") {
      params.lowStock = "true";
    }

    const stockStatus = searchParams.get("stockStatus");
    if (stockStatus) {
      params.stockStatus = stockStatus;
    }

    return params;
  }, [searchParams]);

  const filterLabel = filterLabelFromParams(searchParams);
  const searchTerm = searchParams.get("searchTerm")?.trim() || undefined;
  const lowStockOnly = searchParams.get("lowStock") === "true";

  const { data, isLoading, isError } = useGetAllProductsQuery(queryParams);
  let products = data?.data || [];

  if (lowStockOnly) {
    const stockStatus = searchParams.get("stockStatus");
    if (stockStatus === "NEGATIVE") {
      products = products.filter((p) => p.stock < 0);
    } else if (stockStatus === "OUT_OF_STOCK") {
      products = products.filter((p) => p.stock === 0);
    } else if (stockStatus === "CRITICAL") {
      products = products.filter((p) => p.stock > 0 && p.stock <= 5);
    } else if (stockStatus === "LOW") {
      products = products.filter((p) => p.stock > 5 && p.stock <= 20);
    } else {
      products = products.filter((p) => p.stock <= 20);
    }
  }

  if (isLoading) return <ExportLoading />;

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 py-12 px-4">
        <div className="max-w-md mx-auto p-8 text-center space-y-4 rounded-xl border border-destructive/30 bg-card shadow-sm">
          <p className="text-destructive font-semibold">
            Failed to load the product list
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

  const backHref = lowStockOnly ? "/low-stock" : "/products";

  return (
    <ProductListExportView
      products={products}
      filterLabel={filterLabel}
      searchTerm={searchTerm}
      backHref={backHref}
    />
  );
}

export default function ProductExportPage() {
  return (
    <Suspense fallback={<ExportLoading />}>
      <ProductExportPageInner />
    </Suspense>
  );
}
