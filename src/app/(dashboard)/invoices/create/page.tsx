import { Metadata } from "next";
import InvoiceForm from "@/components/Invoices/InvoiceForm";

export const metadata: Metadata = {
  title: "Create Invoice | Invoice Management",
  description: "Create a new customer invoice with automatic pricing, per-item discount, and payment tracking",
};

export default function CreateInvoicePage() {
  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Create Invoice
      </h1>
      <InvoiceForm isEditing={false} />
    </div>
  );
}
