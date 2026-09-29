"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useGetAllCustomerTransactionsQuery } from "@/redux/api/customerTransactionApi";
import { useGetAllCustomersQuery } from "@/redux/api/customerApi";
import CustomerTransactionExportView from "@/components/CustomerTransactions/CustomerTransactionExport/CustomerTransactionExportView";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

function filterTypeLabel(type?: string | null) {
  if (type === "INVOICE") return "Invoices / Sales";
  if (type === "PAYMENT") return "Cash Payments";
  if (type === "RETURN_INVOICE") return "Return Invoices";
  return "All Transactions";
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

function CustomerTransactionExportPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryParams = useMemo(() => {
    const params: Record<string, unknown> = {
      limit: "all",
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
    };

    const customerId = searchParams.get("customerId");
    if (customerId && customerId !== "ALL") params.customerId = customerId;

    const type = searchParams.get("type");
    if (type && type !== "ALL") params.type = type;

    const startDate = searchParams.get("startDate");
    if (startDate) params.startDate = startDate;

    const endDate = searchParams.get("endDate");
    if (endDate) params.endDate = endDate;

    const searchTerm = searchParams.get("searchTerm")?.trim();
    if (searchTerm) params.searchTerm = searchTerm;

    return params;
  }, [searchParams]);

  const customerId = searchParams.get("customerId");
  const type = searchParams.get("type");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const searchTerm = searchParams.get("searchTerm")?.trim() || undefined;

  // Customers query to get customer name if customerId filter is active
  const { data: customerData } = useGetAllCustomersQuery(
    { limit: "all" },
    { skip: !customerId || customerId === "ALL" },
  );

  const matchedCustomer = customerData?.data?.find((c) => c.id === customerId);
  const customerName = matchedCustomer
    ? `${matchedCustomer.name} (${matchedCustomer.phoneNumber})`
    : undefined;

  const dateRangeLabel =
    startDate && endDate
      ? `${startDate} to ${endDate}`
      : startDate
      ? `From ${startDate}`
      : endDate
      ? `Until ${endDate}`
      : undefined;

  const filterLabel = filterTypeLabel(type);

  const { data, isLoading, isError } = useGetAllCustomerTransactionsQuery(queryParams);
  const transactions = data?.data || [];

  if (isLoading) return <ExportLoading />;

  if (isError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 py-12 px-4">
        <div className="max-w-md mx-auto p-8 text-center space-y-4 rounded-xl border border-destructive/30 bg-card shadow-sm">
          <p className="text-destructive font-semibold">
            Failed to load the customer transactions
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="gap-2 cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Go Back</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <CustomerTransactionExportView
      transactions={transactions}
      filterLabel={filterLabel}
      customerName={customerName}
      selectedCustomer={matchedCustomer}
      dateRangeLabel={dateRangeLabel}
      searchTerm={searchTerm}
      backHref="/customer-transactions"
    />
  );
}

export default function CustomerTransactionExportPage() {
  return (
    <Suspense fallback={<ExportLoading />}>
      <CustomerTransactionExportPageInner />
    </Suspense>
  );
}
