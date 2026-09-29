import { Metadata } from "next";
import InvoiceTable from "@/components/Invoices/InvoiceTable";

export const metadata: Metadata = {
  title: "Manage Invoices | Invoice Management",
  description: "View, manage, create invoices, track due payments and approvals",
};

export default function InvoicesPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Manage Invoices
      </h1>
      <InvoiceTable />
    </div>
  );
}
