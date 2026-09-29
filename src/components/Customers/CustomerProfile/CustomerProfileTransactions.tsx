"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Wallet,
  Undo2,
  Search,
  RotateCcw,
  Clock,
  Table as TableIcon,
  GitCommitVertical,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  FileDown,
} from "lucide-react";
import { useGetAllCustomerTransactionsQuery } from "@/redux/api/customerTransactionApi";
import { TCustomerTransaction } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatInvoiceMoney,
  formatSignedDue,
} from "@/utils/formatInvoiceMoney";
import { cn } from "@/lib/utils";
import CustomerTransactionDetailModal from "@/components/CustomerTransactions/CustomerTransactionDetailModal";

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

type TransactionTab = "ALL" | "INVOICE" | "PAYMENT" | "RETURN_INVOICE";
type ViewFormat = "timeline" | "table";

const SORT_OPTIONS = [
  { label: "Newest First", sortBy: "createdAt", sortOrder: "desc" },
  { label: "Oldest First", sortBy: "createdAt", sortOrder: "asc" },
];

interface CustomerProfileTransactionsProps {
  customerId: string;
}

export default function CustomerProfileTransactions({
  customerId,
}: CustomerProfileTransactionsProps) {
  const [viewFormat, setViewFormat] = useState<ViewFormat>("timeline");
  const [activeTypeTab, setActiveTypeTab] = useState<TransactionTab>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortIndex, setSortIndex] = useState<string>("0");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);

  // Selected transaction for modal
  const [selectedTx, setSelectedTx] = useState<TCustomerTransaction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Query Params
  const selectedSort = SORT_OPTIONS[Number(sortIndex)] || SORT_OPTIONS[0];
  const queryParams: Record<string, unknown> = {
    customerId,
    page,
    limit,
    sortBy: selectedSort.sortBy,
    sortOrder: selectedSort.sortOrder,
  };

  if (searchTerm.trim()) {
    queryParams.searchTerm = searchTerm.trim();
  }
  if (activeTypeTab !== "ALL") {
    queryParams.type = activeTypeTab;
  }
  if (startDate) {
    queryParams.startDate = startDate;
  }
  if (endDate) {
    queryParams.endDate = endDate;
  }

  const {
    data: response,
    isLoading,
    isFetching,
  } = useGetAllCustomerTransactionsQuery(queryParams, {
    skip: !customerId,
  });

  const transactions = response?.data || [];
  const meta = response?.meta;
  const totalCount = meta?.total ?? 0;

  const isFiltersActive =
    activeTypeTab !== "ALL" ||
    searchTerm.trim() !== "" ||
    sortIndex !== "0" ||
    startDate !== "" ||
    endDate !== "";

  const handleResetFilters = () => {
    setActiveTypeTab("ALL");
    setSearchTerm("");
    setStartDate("");
    setEndDate("");
    setSortIndex("0");
    setPage(1);
  };

  const handleOpenDetail = (tx: TCustomerTransaction) => {
    setSelectedTx(tx);
    setIsDetailOpen(true);
  };

  const exportHref = React.useMemo(() => {
    const params = new URLSearchParams();
    params.set("customerId", customerId);
    params.set("sortBy", selectedSort.sortBy);
    params.set("sortOrder", selectedSort.sortOrder);
    if (searchTerm.trim()) params.set("searchTerm", searchTerm.trim());
    if (activeTypeTab !== "ALL") params.set("type", activeTypeTab);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    return `/customer-transactions/export?${params.toString()}`;
  }, [
    customerId,
    selectedSort,
    searchTerm,
    activeTypeTab,
    startDate,
    endDate,
  ]);

  return (
    <div className="space-y-4">
      {/* Controls & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs">
        {/* Top Controls: Title, Type Tabs & View Format Toggler */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Section Title & Type Tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold tracking-tight text-foreground mr-2">
              Customer Transactions
            </h3>

            <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/30">
              {(
                [
                  { id: "ALL", label: "All" },
                  { id: "INVOICE", label: "Invoices" },
                  { id: "PAYMENT", label: "Payments" },
                  { id: "RETURN_INVOICE", label: "Returns" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTypeTab(tab.id);
                    setPage(1);
                  }}
                  className={cn(
                    "px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
                    activeTypeTab === tab.id
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Export & View Mode Toggler (Timeline vs Table) */}
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <Button
              asChild
              variant="outline"
              size="sm"
              disabled={!transactions.length}
              className="h-7.5 gap-1.5 text-xs font-semibold cursor-pointer"
              title="Export Customer Transactions"
            >
              <Link href={exportHref}>
                <FileDown className="size-3.5" />
                <span>Export</span>
              </Link>
            </Button>

            <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40">
              <button
                type="button"
                onClick={() => setViewFormat("timeline")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
                  viewFormat === "timeline"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Timeline View"
              >
                <GitCommitVertical className="size-3.5" />
                <span>Timeline</span>
              </button>
              <button
                type="button"
                onClick={() => setViewFormat("table")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer",
                  viewFormat === "table"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Table View"
              >
                <TableIcon className="size-3.5" />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Inputs: Search, Date Range, Sort & Reset */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Search note, invoice, return..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="h-8 pl-8 text-xs bg-background"
            />
          </div>

          {/* Date Range Selection (Start Date to End Date) */}
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Input
                type="date"
                title="Start Date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="h-8 text-xs px-2 bg-background w-32 sm:w-36 font-mono"
              />
            </div>
            <span className="text-xs text-muted-foreground">to</span>
            <div className="relative">
              <Input
                type="date"
                title="End Date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="h-8 text-xs px-2 bg-background w-32 sm:w-36 font-mono"
              />
            </div>
          </div>

          {/* Sort Selector */}
          <Select
            value={sortIndex}
            onValueChange={(val) => {
              setSortIndex(val);
              setPage(1);
            }}
          >
            <SelectTrigger className="h-8 w-32 text-xs bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt, idx) => (
                <SelectItem key={idx} value={String(idx)} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reset Filters Button */}
          {isFiltersActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="size-3 mr-1" />
              Reset
            </Button>
          )}
        </div>

        {/* Top Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
          <p>
            {totalCount > 0 && meta ? (
              <>
                Showing{" "}
                <span className="font-semibold text-foreground font-mono">
                  {(meta.page - 1) * meta.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-foreground font-mono">
                  {Math.min(meta.page * meta.limit, totalCount)}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-foreground font-mono">
                  {totalCount}
                </span>{" "}
                transactions
              </>
            ) : (
              "0 transactions recorded"
            )}
          </p>

          {meta && meta.totalPage > 1 && (
            <div className="flex items-center gap-1 self-end sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
                className="h-7 px-2 text-xs cursor-pointer"
              >
                <ChevronLeft className="mr-1 size-3" />
                Previous
              </Button>

              <div className="px-2 text-xs font-medium text-muted-foreground font-mono">
                Page {meta.page} of {meta.totalPage}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(meta.totalPage, p + 1))}
                disabled={page >= meta.totalPage || isFetching}
                className="h-7 px-2 text-xs cursor-pointer"
              >
                Next
                <ChevronRight className="ml-1 size-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Timeline or Table View */}
      {viewFormat === "timeline" ? (
        /* TIMELINE VIEW */
        <div className="rounded-xl border border-border bg-card p-6 shadow-xs">
          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="size-8 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-16 w-full rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Clock className="size-10 mb-2 opacity-30 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">
                No transactions found
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                No customer transactions recorded under the current filters.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/70">
              {transactions.map((tx) => {
                const isInvoice = tx.type === "INVOICE";
                const isPayment = tx.type === "PAYMENT";
                const isReturn = tx.type === "RETURN_INVOICE";

                const nodeBg = isInvoice
                  ? "bg-blue-500/10 text-blue-600 border-blue-500/30"
                  : isPayment
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/30";

                const invoiceId =
                  tx.invoiceId ||
                  tx.invoice?.id ||
                  tx.payment?.invoiceId ||
                  tx.payment?.invoice?.id ||
                  tx.returnInvoice?.invoiceId ||
                  tx.returnInvoice?.invoice?.id;

                const invoiceNumber =
                  tx.invoice?.invoiceNumber ||
                  tx.payment?.invoice?.invoiceNumber ||
                  tx.returnInvoice?.invoice?.invoiceNumber ||
                  (isInvoice ? tx.referenceNumber : null);

                const returnInvoiceId =
                  tx.returnInvoiceId || tx.returnInvoice?.id;
                const returnNumber =
                  tx.returnInvoice?.returnNumber ||
                  (isReturn ? tx.referenceNumber : null);

                return (
                  <div key={tx.id} className="relative group">
                    {/* Node Dot / Icon */}
                    <div
                      className={cn(
                        "absolute -left-[35px] top-1 flex size-7 items-center justify-center rounded-full border shadow-xs bg-background",
                        nodeBg
                      )}
                    >
                      {isInvoice && <FileText className="size-3.5" />}
                      {isPayment && <Wallet className="size-3.5" />}
                      {isReturn && <Undo2 className="size-3.5" />}
                    </div>

                    {/* Timeline Item Card */}
                    <div className="rounded-xl border border-border/80 bg-background/60 p-4 shadow-xs hover:border-border hover:shadow-md transition-all space-y-3">
                      {/* Header: Type Badge, Ref Number & Timestamp */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-semibold uppercase tracking-wider py-0.5",
                              isInvoice &&
                                "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
                              isPayment &&
                                "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                              isReturn &&
                                "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                            )}
                          >
                            {isInvoice
                              ? "Invoice Sale"
                              : isPayment
                              ? "Cash Payment"
                              : "Product Return"}
                          </Badge>

                          {isReturn ? (
                            returnInvoiceId && returnNumber ? (
                              <Link
                                href={`/return-invoices/${returnInvoiceId}/invoice`}
                                className="group inline-flex items-center gap-1 font-mono text-xs font-semibold text-primary hover:underline"
                                title={`View Return Invoice #${returnNumber}`}
                              >
                                <span>{returnNumber}</span>
                                <ExternalLink className="size-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                              </Link>
                            ) : returnNumber ? (
                              <span className="font-mono text-xs font-semibold text-foreground">
                                {returnNumber}
                              </span>
                            ) : (
                              <span className="font-mono text-xs font-semibold text-foreground">
                                Return
                              </span>
                            )
                          ) : invoiceId && invoiceNumber ? (
                            <Link
                              href={`/invoices/${invoiceId}/invoice`}
                              className="group inline-flex items-center gap-1 font-mono text-xs font-semibold text-primary hover:underline"
                              title={`View Invoice #${invoiceNumber}`}
                            >
                              <span>{invoiceNumber}</span>
                              <ExternalLink className="size-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                            </Link>
                          ) : invoiceNumber ? (
                            <span className="font-mono text-xs font-semibold text-foreground">
                              {invoiceNumber}
                            </span>
                          ) : (
                            <span className="font-mono text-xs font-semibold text-foreground">
                              {isInvoice ? "Invoice" : isPayment ? "Payment" : "Return"}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                          <Calendar className="size-3 text-muted-foreground/70" />
                          <span>{formatDateTime(tx.createdAt)}</span>
                        </div>
                      </div>

                      {/* Amounts & Running Balance Strip */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-2.5 rounded-lg bg-muted/30 border border-border/40 text-xs">
                        {/* Due column */}
                        <div>
                          <span className="text-[10px] font-medium text-muted-foreground uppercase">
                            Due Added
                          </span>
                          <p className="font-mono font-semibold text-sm mt-0.5">
                            {tx.due > 0 ? (
                              <span className="text-amber-600 dark:text-amber-400">
                                {formatInvoiceMoney(tx.due)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/70">—</span>
                            )}
                          </p>
                        </div>

                        {/* Cash column */}
                        <div>
                          <span className="text-[10px] font-medium text-muted-foreground uppercase">
                            Cash / Payment
                          </span>
                          <p className="font-mono font-semibold text-sm mt-0.5">
                            {tx.cash > 0 ? (
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {formatInvoiceMoney(tx.cash)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/70">—</span>
                            )}
                          </p>
                        </div>

                        {/* Running Balance */}
                        <div>
                          <span className="text-[10px] font-medium text-muted-foreground uppercase">
                            Running Balance
                          </span>
                          <p
                            className={cn(
                              "font-mono font-bold text-sm mt-0.5",
                              tx.balance > 0
                                ? "text-rose-600 dark:text-rose-400"
                                : tx.balance < 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-muted-foreground"
                            )}
                          >
                            {formatSignedDue(tx.balance)}
                          </p>
                        </div>

                        {/* Actions / Details Trigger */}
                        <div className="flex items-center justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDetail(tx)}
                            className="h-7 px-2.5 text-xs gap-1 cursor-pointer"
                          >
                            <Eye className="size-3" />
                            Details
                          </Button>
                        </div>
                      </div>

                      {/* Note or Creator details if available */}
                      {(tx.note ||
                        tx.payment?.note ||
                        tx.invoice?.note ||
                        tx.createdBy) && (
                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground pt-1">
                          <p className="italic text-[11px] truncate max-w-md">
                            {tx.note ||
                              tx.payment?.note ||
                              tx.invoice?.note ||
                              ""}
                          </p>
                          {tx.createdBy && (
                            <span className="text-[10px] text-muted-foreground shrink-0 font-medium">
                              Logged by {tx.createdBy.firstName}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* TABLE VIEW (Matching CustomerTransactionTable, no customer name below date) */
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-[180px] text-xs">Date & Time</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-right text-xs">Due</TableHead>
                  <TableHead className="text-right text-xs">Cash</TableHead>
                  <TableHead className="text-right text-xs">Balance</TableHead>
                  <TableHead className="text-xs">Note</TableHead>
                  <TableHead className="text-xs">Invoice</TableHead>
                  <TableHead className="text-right text-xs w-[80px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} index={i}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-36 text-center text-xs text-muted-foreground"
                    >
                      No transactions found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx, index) => {
                    const isInvoice = tx.type === "INVOICE";
                    const isPayment = tx.type === "PAYMENT";
                    const isReturn = tx.type === "RETURN_INVOICE";

                    const invoiceId =
                      tx.invoiceId ||
                      tx.invoice?.id ||
                      tx.payment?.invoiceId ||
                      tx.payment?.invoice?.id ||
                      tx.returnInvoice?.invoiceId ||
                      tx.returnInvoice?.invoice?.id;

                    const invoiceNumber =
                      tx.invoice?.invoiceNumber ||
                      tx.payment?.invoice?.invoiceNumber ||
                      tx.returnInvoice?.invoice?.invoiceNumber ||
                      (isInvoice ? tx.referenceNumber : null);

                    const returnInvoiceId =
                      tx.returnInvoiceId || tx.returnInvoice?.id;
                    const returnNumber =
                      tx.returnInvoice?.returnNumber ||
                      (isReturn ? tx.referenceNumber : null);

                    return (
                      <TableRow
                        key={tx.id}
                        index={index}
                        className="hover:bg-muted/40 transition-colors text-xs"
                      >
                        {/* Date & Time (Without customer name underneath) */}
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-1.5 font-mono text-muted-foreground whitespace-nowrap">
                            <Calendar className="size-3 text-muted-foreground/70 shrink-0" />
                            <span>{formatDateTime(tx.createdAt)}</span>
                          </div>
                        </TableCell>

                        {/* Type Badge */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-semibold uppercase tracking-wider py-0.5",
                              isInvoice &&
                                "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
                              isPayment &&
                                "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                              isReturn &&
                                "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                            )}
                          >
                            {isInvoice && <FileText className="mr-1 size-3" />}
                            {isPayment && <Wallet className="mr-1 size-3" />}
                            {isReturn && <Undo2 className="mr-1 size-3" />}
                            {isInvoice
                              ? "Invoice"
                              : isPayment
                              ? "Payment"
                              : "Return"}
                          </Badge>
                        </TableCell>

                        {/* Due */}
                        <TableCell className="text-right font-mono font-semibold">
                          {tx.due > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400">
                              {formatInvoiceMoney(tx.due)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Cash */}
                        <TableCell className="text-right font-mono font-semibold">
                          {tx.cash > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {formatInvoiceMoney(tx.cash)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Balance */}
                        <TableCell className="text-right font-mono font-semibold">
                          <span
                            className={cn(
                              tx.balance > 0
                                ? "text-rose-600 dark:text-rose-400 font-bold"
                                : tx.balance < 0
                                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                                : "text-muted-foreground"
                            )}
                          >
                            {formatSignedDue(tx.balance)}
                          </span>
                        </TableCell>

                        {/* Note */}
                        <TableCell className="text-muted-foreground whitespace-pre-wrap break-words min-w-[200px] leading-relaxed">
                          {tx.note ||
                            tx.payment?.note ||
                            tx.invoice?.note ||
                            "—"}
                        </TableCell>

                        {/* Invoice */}
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {isReturn ? (
                            returnInvoiceId && returnNumber ? (
                              <Link
                                href={`/return-invoices/${returnInvoiceId}/invoice`}
                                className="group inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                                title={`View Return Invoice #${returnNumber}`}
                              >
                                <span>{returnNumber}</span>
                                <ExternalLink className="size-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                              </Link>
                            ) : returnNumber ? (
                              <span className="font-semibold text-foreground">
                                {returnNumber}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )
                          ) : invoiceId && invoiceNumber ? (
                            <Link
                              href={`/invoices/${invoiceId}/invoice`}
                              className="group inline-flex items-center gap-1 font-semibold text-primary hover:underline"
                              title={`View Invoice #${invoiceNumber}`}
                            >
                              <span>{invoiceNumber}</span>
                              <ExternalLink className="size-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                            </Link>
                          ) : invoiceNumber ? (
                            <span className="font-semibold text-foreground">
                              {invoiceNumber}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDetail(tx)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="size-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Bottom Pagination Controls (matching CustomerTransactionTable) */}
      {meta && meta.totalPage > 1 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Rows per page:</span>
            <Select
              value={String(limit)}
              onValueChange={(val) => {
                setLimit(Number(val));
                setPage(1);
              }}
            >
              <SelectTrigger className="h-7 w-16 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 50].map((pageSize) => (
                  <SelectItem
                    key={pageSize}
                    value={String(pageSize)}
                    className="text-xs"
                  >
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isFetching}
              className="h-8 px-2.5 text-xs cursor-pointer"
            >
              <ChevronLeft className="mr-1 size-3.5" />
              Previous
            </Button>

            <div className="px-2 text-xs font-medium text-muted-foreground font-mono">
              Page {meta.page} of {meta.totalPage}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(meta.totalPage, p + 1))}
              disabled={page >= meta.totalPage || isFetching}
              className="h-8 px-2.5 text-xs cursor-pointer"
            >
              Next
              <ChevronRight className="ml-1 size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <CustomerTransactionDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        transaction={selectedTx}
      />
    </div>
  );
}
