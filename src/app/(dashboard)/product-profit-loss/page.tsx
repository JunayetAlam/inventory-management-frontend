import { Metadata } from "next";
import ProductProfitTable from "@/components/ProductProfit/ProductProfitTable";

export const metadata: Metadata = {
  title: "Manage Product Profit/Loss | Invoice Management",
  description: "Per-product sales, cost, and profit/loss report with date filters",
};

export default function ProductProfitLossPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Manage Product Profit/Loss
      </h1>
      <ProductProfitTable />
    </div>
  );
}
