import { Metadata } from "next";
import ProductTable from "@/components/Products/ProductTable";
import ProductStatsCards from "@/components/Products/ProductStatsCards";

export const metadata: Metadata = {
  title: "Manage Products | Invoice Management",
  description: "Manage product catalog, prices, stocks, and audit history",
};

export default function ProductsPage() {
  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">
        Manage Products
      </h1>
      <ProductStatsCards />
      <ProductTable />
    </div>
  );
}
