import { Metadata } from "next";
import ReturnInvoiceTable from "@/components/ReturnInvoices/ReturnInvoiceTable";

export const metadata: Metadata = {
  title: "Return Invoices | Invoice Management",
  description: "Manage product return invoices linked to invoices",
};

export default function ReturnInvoicesPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Return Invoices
      </h1>
      <ReturnInvoiceTable />
    </div>
  );
}
