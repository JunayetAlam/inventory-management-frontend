import { Metadata } from "next";
import LowStockTable from "@/components/LowStock/LowStockTable";
import LowStockStatsCard from "@/components/LowStock/LowStockStatsCard";

export const metadata: Metadata = {
  title: "Low Stock Inventory | Invoice Management",
  description: "Monitor and restock low inventory products (<= 20 units remaining)",
};

export default function LowStockPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Low Stock Inventory
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Track and restock products with low or negative inventory levels (20 or fewer items remaining).
        </p>
      </div>

      <LowStockStatsCard />
      <LowStockTable />
    </div>
  );
}
