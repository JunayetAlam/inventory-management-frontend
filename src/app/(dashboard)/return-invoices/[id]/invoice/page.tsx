"use client";

import { useParams, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { useGetReturnInvoiceByIdQuery } from "@/redux/api/returnInvoiceApi";
import ReturnInvoiceView from "@/components/ReturnInvoices/ReturnInvoiceView/ReturnInvoiceView";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function ReturnInvoicePrintPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { data, isLoading, isError } = useGetReturnInvoiceByIdQuery(id, {
    skip: !id,
  });
  const returnInvoice = data?.data;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-[210mm] mx-auto space-y-6">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-[297mm] w-full" />
        </div>
      </div>
    );
  }

  if (isError || !returnInvoice) {
    return (
      <div className="min-h-screen py-12 px-4 text-center space-y-4">
        <p className="text-destructive font-semibold">
          Return invoice not found
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
    );
  }

  return <ReturnInvoiceView returnInvoice={returnInvoice} />;
}
