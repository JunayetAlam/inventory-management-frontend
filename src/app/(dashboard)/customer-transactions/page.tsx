import { Metadata } from "next";
import CustomerTransactionTable from "@/components/CustomerTransactions/CustomerTransactionTable";

export const metadata: Metadata = {
  title: "Manage Customer Transactions | Invoice Management",
  description: "View and manage all customer transactions, payments, and return invoices",
};

export default function CustomerTransactionsPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Manage Customer Transactions
      </h1>
      <CustomerTransactionTable />
    </div>
  );
}
