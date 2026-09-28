"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  FileDown,
  Package,
  RotateCcw,
  Search,
} from "lucide-react";
import useIsAdmin from "@/hooks/useIsAdmin";
import { useGetProductProfitQuery } from "@/redux/api/productApi";
import type { ProductProfitSortField } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatInvoiceMoney } from "@/utils/formatInvoiceMoney";
import { cn } from "@/lib/utils";
import SellReportSummaryCards from "./SellReportSummaryCards";
import TableSkeleton from "../Global/TableSkeleton";

const SORT_OPTIONS: {
  label: string;
  sortBy: ProductProfitSortField;
  sortOrder: "asc" | "desc";
}[] = [
  { label: "Sales: High to Low", sortBy: "salesTotal", sortOrder: "desc" },
  { label: "Sales: Low to High", sortBy: "salesTotal", sortOrder: "asc" },
  { label: "Sold Qty: High to Low", sortBy: "soldQty", sortOrder: "desc" },
  { label: "Sold Qty: Low to High", sortBy: "soldQty", sortOrder: "asc" },
  { label: "Name: A to Z", sortBy: "name", sortOrder: "asc" },
  { label: "Name: Z to A", sortBy: "name", sortOrder: "desc" },
];

function formatQty(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

const TABLE_HEADERS = ["#", "Product", "Sold", "Sell", "Receipts"];

export default function SellReportTable() {
  const router = useRouter();
  const [isAdmin, isAdminLoading] = useIsAdmin();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [appliedStart, setAppliedStart] = useState("");
  const [appliedEnd, setAppliedEnd] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortIndex, setSortIndex] = useState("0");
  const [page, setPage] = useState(1);
  const [dateError, setDateError] = useState<string | null>(null);

  const selectedSort = SORT_OPTIONS[Number(sortIndex)] || SORT_OPTIONS[0];

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [isAdmin, isAdminLoading, router]);

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {
      page,
      limit: 25,
      sortBy: selectedSort.sortBy,
      sortOrder: selectedSort.sortOrder,
    };
    if (appliedStart) params.startDate = appliedStart;
    if (appliedEnd) params.endDate = appliedEnd;
    if (searchTerm.trim()) params.searchTerm = searchTerm.trim();
    return params;
  }, [page, selectedSort, appliedStart, appliedEnd, searchTerm]);

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
  } = useGetProductProfitQuery(queryParams, { skip: !isAdmin });

  const report = response?.data;
  const products = report?.products || [];
  const summary = report?.summary;
  const meta = response?.meta;

  const applyDateFilter = () => {
    if (startDate && endDate && startDate > endDate) {
      setDateError("Start date cannot be after end date");
      return;
    }
    setDateError(null);
    setAppliedStart(startDate);
    setAppliedEnd(endDate);
    setPage(1);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearchTerm(searchInput.trim());
    setPage(1);
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setAppliedStart("");
    setAppliedEnd("");
    setSearchInput("");
    setSearchTerm("");
    setSortIndex("0");
    setPage(1);
    setDateError(null);
  };

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("sortBy", selectedSort.sortBy);
    params.set("sortOrder", selectedSort.sortOrder);
    if (appliedStart) params.set("startDate", appliedStart);
    if (appliedEnd) params.set("endDate", appliedEnd);
    if (searchTerm.trim()) params.set("searchTerm", searchTerm.trim());
    return `/sell-report/export?${params.toString()}`;
  }, [selectedSort, appliedStart, appliedEnd, searchTerm]);

  if (isAdminLoading || !isAdmin) {
    return <TableSkeleton headers={TABLE_HEADERS} title="Sell Report" />;
  }

  return (
    <div className="space-y-4">
      <SellReportSummaryCards
        summary={summary}
        isLoading={isLoading || isFetching}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end flex-1">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Start date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full sm:w-40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              End date
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full sm:w-40"
            />
          </div>
          <Button type="button" variant="secondary" onClick={applyDateFilter}>
            Apply dates
          </Button>

          <form
            onSubmit={handleSearch}
            className="flex min-w-0 flex-1 gap-2 sm:min-w-[220px]"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search product"
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="outline">
              Search
            </Button>
          </form>

          <Select
            value={sortIndex}
            onValueChange={(value) => {
              setSortIndex(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt, index) => (
                <SelectItem key={opt.label} value={String(index)}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={handleReset}
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <Link href={exportHref}>
              <FileDown className="size-4" />
              Export List
            </Link>
          </Button>
        </div>
      </div>

      {dateError ? (
        <p className="text-sm text-destructive">{dateError}</p>
      ) : null}

      {(appliedStart || appliedEnd) && (
        <p className="text-xs text-muted-foreground">
          Showing sales
          {appliedStart ? ` from ${appliedStart}` : ""}
          {appliedEnd ? ` to ${appliedEnd}` : ""}
        </p>
      )}

      {/* Main Table Card */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {/* Table Top Toolbar: Count & Top Pagination */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border bg-muted/30 px-4 py-2.5">
          <p className="text-xs text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-48" />
            ) : meta && meta.total > 0 ? (
              <>
                Showing{" "}
                <span className="font-medium text-foreground font-mono">
                  {(meta.page - 1) * meta.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-foreground font-mono">
                  {Math.min(meta.page * meta.limit, meta.total)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground font-mono">
                  {meta.total}
                </span>{" "}
                products
              </>
            ) : (
              "0 products found"
            )}
          </p>

          {/* Top Pagination Controls */}
          {meta && meta.totalPage > 1 && (
            <div className="flex items-center gap-1 self-end sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
                className="h-8 px-2.5 text-xs"
              >
                <ChevronLeft className="mr-1 size-3.5" />
                Previous
              </Button>

              <div className="px-2 text-xs font-medium text-muted-foreground">
                Page {meta.page} of {meta.totalPage}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= meta.totalPage || isFetching}
                className="h-8 px-2.5 text-xs"
              >
                Next
                <ChevronRight className="ml-1 size-3.5" />
              </Button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Sold</TableHead>
                <TableHead className="text-right">Sell</TableHead>
                <TableHead>Receipts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} index={i}>
                    <TableCell className="text-center">
                      <Skeleton className="h-4 w-5 mx-auto" />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-12 text-center text-sm text-destructive"
                  >
                    Failed to load sell report
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Package className="size-8 text-muted-foreground/40" />
                      <p className="text-base font-medium text-foreground">
                        No products found
                      </p>
                      <p className="text-xs text-muted-foreground">
                        No product sales found for the selected filters
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((row, index) => {
                  const serialNumber =
                    (page - 1) * (meta?.limit || 25) + index + 1;
                  return (
                    <TableRow
                      key={row.productId}
                      index={index}
                      className={cn(isFetching && "opacity-60")}
                    >
                      <TableCell className="text-center text-xs font-mono text-muted-foreground w-12">
                        {serialNumber}
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {row.productName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {row.unit}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatQty(row.soldQty)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {formatInvoiceMoney(row.salesTotal)}
                      </TableCell>
                      <TableCell className="max-w-60">
                        <div className="flex flex-wrap gap-1">
                          {(row.receipts || []).length === 0 ? (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          ) : (
                            (row.receipts || []).map((r) => (
                              <Link
                                key={r.id}
                                href={`/receipts/${r.id}/invoice`}
                                className="font-mono text-xs text-primary hover:underline"
                                title={`Open invoice ${r.receiptNumber}`}
                              >
                                {r.receiptNumber} ({formatQty(r.quantity)})
                              </Link>
                            ))
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {meta && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-border px-4 py-3 bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {meta.total > 0 ? (
                <>
                  Showing{" "}
                  <span className="font-medium text-foreground font-mono">
                    {(meta.page - 1) * meta.limit + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-foreground font-mono">
                    {Math.min(meta.page * meta.limit, meta.total)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground font-mono">
                    {meta.total}
                  </span>{" "}
                  products
                </>
              ) : (
                "0 products found"
              )}
            </p>

            {meta.totalPage > 1 && (
              <div className="flex items-center gap-1 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isFetching}
                  className="h-8 px-2.5 text-xs"
                >
                  <ChevronLeft className="mr-1 size-3.5" />
                  Previous
                </Button>

                <div className="px-2 text-xs font-medium text-muted-foreground">
                  Page {meta.page} of {meta.totalPage}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= meta.totalPage || isFetching}
                  className="h-8 px-2.5 text-xs"
                >
                  Next
                  <ChevronRight className="ml-1 size-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
