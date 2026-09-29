import { Metadata } from "next";
import { Suspense } from "react";
import ReturnInvoiceForm from "@/components/ReturnInvoices/ReturnInvoiceForm";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Create Return Invoice | Invoice Management",
  description: "Create a return invoice against an invoice",
};

export default function CreateReturnInvoicePage() {
  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Create Return Invoice
      </h1>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <ReturnInvoiceForm />
      </Suspense>
    </div>
  );
}
