"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  RotateCcw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileDown,
  FileText,
  Wallet,
  Undo2,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
import { useGetAllCustomerTransactionsQuery } from "@/redux/api/customerTransactionApi";
import { useGetAllCustomersQuery } from "@/redux/api/customerApi";
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
import CustomerTransactionStatsCards from "./CustomerTransactionStatsCards";
import CustomerTransactionDetailModal from "./CustomerTransactionDetailModal";
import CustomerFilterSelect from "./CustomerFilterSelect";

type TransactionTab = "ALL" | "INVOICE" | "PAYMENT" | "RETURN_INVOICE";

const SORT_OPTIONS = [
  { label: "Newest First", sortBy: "createdAt", sortOrder: "desc" },
  { label: "Oldest First", sortBy: "createdAt", sortOrder: "asc" },
];

export default function CustomerTransactionTable({
  hideStats = false,
}: {
  hideStats?: boolean;
} = {}) {
  const [activeTypeTab, setActiveTypeTab] = useState<TransactionTab>("ALL");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortIndex, setSortIndex] = useState<string>("0");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(25);

  // Selected transaction for detail modal
  const [selectedTx, setSelectedTx] = useState<TCustomerTransaction | null>(
    null,
  );
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);

  // Load customer list for filter dropdown
  const { data: customerData, isLoading: isCustomersLoading } =
    useGetAllCustomersQuery({
      limit: "all",
      isDeleted: false,
    });
  const customers = customerData?.data || [];

  const selectedCustomer = useMemo(
    () =>
      selectedCustomerId !== "ALL"
        ? customers.find((c) => c.id === selectedCustomerId) || null
        : null,
    [customers, selectedCustomerId],
  );

  // Query Params
  const selectedSort = SORT_OPTIONS[Number(sortIndex)] || SORT_OPTIONS[0];
  const queryParams: Record<string, unknown> = {
    page,
    limit,
    sortBy: selectedSort.sortBy,
    sortOrder: selectedSort.sortOrder,
  };

  if (searchTerm.trim()) {
    queryParams.searchTerm = searchTerm.trim();
  }
  if (selectedCustomerId !== "ALL") {
    queryParams.customerId = selectedCustomerId;
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

  // Fetch transactions
  const {
    data: response,
    isLoading,
    isFetching,
  } = useGetAllCustomerTransactionsQuery(queryParams);

  const transactions = response?.data || [];
  const meta = response?.meta;
  const totalCount = meta?.total ?? 0;

  const handleResetFilters = () => {
    setActiveTypeTab("ALL");
    setSelectedCustomerId("ALL");
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
    setSortIndex("0");
    setPage(1);
  };

  const handleOpenDetail = (tx: TCustomerTransaction) => {
    setSelectedTx(tx);
    setIsDetailOpen(true);
  };

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("sortBy", selectedSort.sortBy);
    params.set("sortOrder", selectedSort.sortOrder);
    if (searchTerm.trim()) params.set("searchTerm", searchTerm.trim());
    if (selectedCustomerId !== "ALL")
      params.set("customerId", selectedCustomerId);
    if (activeTypeTab !== "ALL") params.set("type", activeTypeTab);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
    return `/customer-transactions/export?${params.toString()}`;
  }, [
    selectedSort,
    searchTerm,
    selectedCustomerId,
    activeTypeTab,
    startDate,
    endDate,
  ]);

  const isFiltersActive =
    activeTypeTab !== "ALL" ||
    selectedCustomerId !== "ALL" ||
    startDate !== "" ||
    endDate !== "" ||
    searchTerm !== "" ||
    sortIndex !== "0";

  return (
    <div className="space-y-6">
      {/* 1. Top Stats Cards (Requested by User) */}
      {!hideStats && (
        <CustomerTransactionStatsCards
          queryParams={{
            ...(selectedCustomerId !== "ALL"
              ? { customerId: selectedCustomerId }
              : {}),
            ...(startDate ? { startDate } : {}),
            ...(endDate ? { endDate } : {}),
            ...(activeTypeTab !== "ALL" ? { type: activeTypeTab } : {}),
          }}
        />
      )}

      {/* 2. Top Header Controls: Filter Tabs & Export Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Type Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-muted/40 p-1 text-xs">
          {(
            [
              { label: "All Transactions", value: "ALL" },
              { label: "Invoices / Sales", value: "INVOICE" },
              { label: "Cash Payments", value: "PAYMENT" },
              { label: "Return Invoices", value: "RETURN_INVOICE" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setActiveTypeTab(tab.value);
                setPage(1);
              }}
              className={cn(
                "rounded-md px-3 py-1.5 font-medium transition-colors",
                activeTypeTab === tab.value
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            disabled={!transactions.length}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <Link href={exportHref}>
              <FileDown className="size-4" />
              Export List
            </Link>
          </Button>
        </div>
      </div>

      {/* 3. Filter & Search Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
          {/* Text Search */}
          <div className="relative lg:col-span-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by customer, phone, reference, or note..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 text-xs"
            />
          </div>

          {/* Select Customer */}
          <div className="lg:col-span-3">
            <CustomerFilterSelect
              customers={customers}
              selectedCustomerId={selectedCustomerId}
              onChange={(val) => {
                setSelectedCustomerId(val);
                setPage(1);
              }}
              isLoading={isCustomersLoading}
              placeholder="All Customers"
            />
          </div>

          {/* Start Date & End Date */}
          <div className="flex items-center gap-2 lg:col-span-3">
            <div className="relative flex-1">
              <Input
                type="date"
                title="Start Date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="text-xs px-2"
              />
            </div>
            <span className="text-xs text-muted-foreground">to</span>
            <div className="relative flex-1">
              <Input
                type="date"
                title="End Date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="text-xs px-2"
              />
            </div>
          </div>

          {/* Sort Selector */}
          <div className="lg:col-span-2">
            <Select
              value={sortIndex}
              onValueChange={(val) => {
                setSortIndex(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((s, idx) => (
                  <SelectItem key={idx} value={String(idx)} className="text-xs">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reset Filter info */}
        {isFiltersActive && (
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="size-3.5" />
              <span>Filters active</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="mr-1.5 size-3.5" />
              Reset filters
            </Button>
          </div>
        )}
      </div>

      {/* 4. Transactions Table (ProductTable layout style) */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {/* Table Top Toolbar: Count & Top Pagination */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border bg-muted/30 px-4 py-2.5">
          <p className="text-xs text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-48" />
            ) : totalCount > 0 && meta ? (
              <>
                Showing{" "}
                <span className="font-medium text-foreground font-mono">
                  {(meta.page - 1) * meta.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-foreground font-mono">
                  {Math.min(meta.page * meta.limit, totalCount)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground font-mono">
                  {totalCount}
                </span>{" "}
                transactions
              </>
            ) : (
              "0 transactions found"
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
                onClick={() => setPage((p) => Math.min(meta.totalPage, p + 1))}
                disabled={page >= meta.totalPage || isFetching}
                className="h-8 px-2.5 text-xs"
              >
                Next
                <ChevronRight className="ml-1 size-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Professional Customer Details Card (When a specific customer is selected) */}
        {selectedCustomer && (
          <div className="border-b border-border bg-muted/20 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <Avatar className="size-12 rounded-full border border-border/80 shrink-0">
                  {selectedCustomer.image ? (
                    <AvatarImage
                      src={selectedCustomer.image}
                      alt={selectedCustomer.name}
                    />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                    {selectedCustomer.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-foreground truncate">
                      {selectedCustomer.name}
                    </h2>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-semibold uppercase tracking-wider py-0"
                    >
                      Customer Details
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="size-3 text-muted-foreground/70 shrink-0" />
                      <span>
                        {selectedCustomer.countryCode || "+880"}{" "}
                        {selectedCustomer.phoneNumber}
                      </span>
                    </span>
                    {selectedCustomer.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="size-3 text-muted-foreground/70 shrink-0" />
                        <span>{selectedCustomer.email}</span>
                      </span>
                    )}
                    {selectedCustomer.address && (
                      <span className="flex items-center gap-1 truncate max-w-xs">
                        <MapPin className="size-3 text-muted-foreground/70 shrink-0" />
                        <span className="truncate">{selectedCustomer.address}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                    Total Due
                  </span>
                  <span
                    className={cn(
                      "font-mono font-bold text-sm sm:text-base",
                      (selectedCustomer.totalDue || 0) > 0
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {formatInvoiceMoney(selectedCustomer.totalDue || 0)}
                  </span>
                </div>

                <div className="h-8 w-px bg-border hidden sm:block" />

                <div className="flex items-center gap-1.5">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs font-semibold"
                  >
                    <Link href={`/customers/${selectedCustomer.id}`}>
                      <ExternalLink className="size-3" />
                      View Profile
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCustomerId("ALL");
                      setPage(1);
                    }}
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                    title="Clear Customer Filter"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Table Data View */}
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
                      {/* Date & Time (Hide customer name when customer is selected) */}
                      <TableCell className="py-2.5">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-mono text-muted-foreground whitespace-nowrap">
                            <Calendar className="size-3 text-muted-foreground/70 shrink-0" />
                            <span>{formatDateTime(tx.createdAt)}</span>
                          </div>
                          {!selectedCustomer && (
                            <p
                              className="font-semibold text-foreground text-xs truncate max-w-[170px]"
                              title={tx.customer?.name}
                            >
                              {tx.customer?.name || "Walk-in Customer"}
                            </p>
                          )}
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
                              "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
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
                                : "text-muted-foreground",
                          )}
                        >
                          {formatSignedDue(tx.balance)}
                        </span>
                      </TableCell>

                      {/* Note - show full note without skipping */}
                      <TableCell className="text-muted-foreground whitespace-pre-wrap break-words min-w-[200px] leading-relaxed">
                        {tx.note || tx.payment?.note || tx.invoice?.note || "—"}
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
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
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

        {/* Bottom Pagination Controls (Matching ProductTable) */}
        {meta && meta.totalPage > 1 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-border bg-muted/20 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Rows per page:</span>
              <Select
                value={String(limit)}
                onValueChange={(val) => {
                  setLimit(Number(val));
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-7 w-16 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((pageSize) => (
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

            <div className="flex items-center gap-1.5 self-center sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page <= 1 || isFetching}
                className="h-8 px-2 text-xs"
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
                className="h-8 px-2 text-xs"
              >
                Previous
              </Button>

              <span className="px-2 text-xs font-medium text-muted-foreground">
                Page {meta.page} of {meta.totalPage}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(meta.totalPage, p + 1))}
                disabled={page >= meta.totalPage || isFetching}
                className="h-8 px-2 text-xs"
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(meta.totalPage)}
                disabled={page >= meta.totalPage || isFetching}
                className="h-8 px-2 text-xs"
              >
                Last
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      <CustomerTransactionDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        transaction={selectedTx}
      />
    </div>
  );
}
