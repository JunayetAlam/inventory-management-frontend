"use client";

import { useParams, useRouter } from "next/navigation";
import { useGetInvoiceByIdQuery } from "@/redux/api/invoiceApi";
import InvoiceView from "@/components/Invoices/InvoiceView.tsx/InvoiceView";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";

export default function InvoiceViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data, isLoading, isError } = useGetInvoiceByIdQuery(id, {
    skip: !id,
  });
  const invoice = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 py-10 px-4">
        <div className="max-w-[210mm] mx-auto space-y-6">
          <Skeleton className="h-10 w-48 rounded-md" />
          <Skeleton className="h-[297mm] w-full rounded-sm" />
        </div>
      </div>
    );
  }

  if (isError || !invoice) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 py-12 px-4">
        <div className="max-w-md mx-auto p-8 text-center space-y-4 rounded-xl border border-destructive/30 bg-card shadow-sm">
          <p className="text-destructive font-semibold">
            Invoice not found or failed to load
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

  return <InvoiceView invoice={invoice} />;
}
