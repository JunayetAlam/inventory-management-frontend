import { Metadata } from "next";
import CustomerTable from "@/components/Customers/CustomerTable";
import CustomerStatsCards from "@/components/Customers/CustomerStatsCards";
import CustomerHeader from "@/components/Customers/CustomerHeader";

export const metadata: Metadata = {
  title: "Manage Customers | Invoice Management",
  description: "Manage customer profiles, phone numbers, contact records, and audit history",
};

export default function CustomersPage() {
  return (
    <div className="space-y-6 p-6">
      <CustomerHeader />
      <CustomerStatsCards />
      <CustomerTable />
    </div>
  );
}

