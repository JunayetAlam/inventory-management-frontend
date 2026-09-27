"use client";

import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
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
import DefaultPagination from "@/components/Global/Pagination";
import { useGetLowStockQuery } from "@/redux/api/statsApi";
import { formatInvoiceMoney } from "@/utils/formatInvoiceMoney";

function StockBadge({ stock, unit }: { stock: number; unit: string }) {
  if (stock < 0)
    return (
      <Badge className="border-rose-500/20 bg-rose-500/10 text-xs font-semibold text-rose-600">
        Oversold ({stock} {unit})
      </Badge>
    );
  if (stock === 0)
    return (
      <Badge className="border-rose-500/20 bg-rose-500/10 text-xs font-semibold text-rose-600">
        Out of stock (0)
      </Badge>
    );
  return (
    <Badge className="border-amber-500/20 bg-amber-500/10 text-xs font-semibold text-amber-600 dark:text-amber-400">
      Low stock ({stock} {unit})
    </Badge>
  );
}

export default function LowStockTable() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const limit = 10;

  const { data, isLoading, isFetching } = useGetLowStockQuery({ page, limit });
  const products = data?.data?.products ?? [];

  return (
    <Card id="low-stock">
      <CardHeader>
        <CardTitle className="text-base">
          Low Stock Items
          {data?.data && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              (stock ≤ {data.data.threshold})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : products.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No low stock items. 🎉
          </p>
        ) : (
          <div className={isFetching ? "opacity-60 transition-opacity" : undefined}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Buying Price</TableHead>
                  <TableHead className="text-right">Selling Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>
                      <StockBadge stock={p.stock} unit={p.unit} />
                    </TableCell>
                    <TableCell className="text-right">
                      {p.buyingPrice != null ? formatInvoiceMoney(p.buyingPrice) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatInvoiceMoney(p.sellingPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {data?.meta && (
              <DefaultPagination meta={data.meta} showItemPerPage={false} />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
