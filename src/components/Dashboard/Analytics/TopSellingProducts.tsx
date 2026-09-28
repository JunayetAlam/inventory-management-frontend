"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatInvoiceMoney } from "@/utils/formatInvoiceMoney";
import { cn } from "@/lib/utils";
import type { TDashboardTopProduct } from "@/types/dashboard";

const formatQty = (v: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(v);

export default function TopSellingProducts({
  products,
  isLoading,
}: {
  products?: TDashboardTopProduct[];
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top 10 Selling Products</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !products?.length ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No sales in the selected range.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Sold Qty</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Profit</TableHead>
                <TableHead className="text-right">Profit %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p, i) => (
                <TableRow key={p.productId} index={i}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{p.productName}</TableCell>
                  <TableCell className="text-right">{formatQty(p.soldQty)}</TableCell>
                  <TableCell className="text-right">{formatInvoiceMoney(p.salesTotal)}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-medium",
                      p.profit < 0 ? "text-rose-600" : "text-emerald-600",
                    )}
                  >
                    {formatInvoiceMoney(p.profit)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right",
                      (p.profitPercent ?? 0) < 0 ? "text-rose-600" : "text-emerald-600",
                    )}
                  >
                    {p.profitPercent != null ? `${p.profitPercent}%` : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
