"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  RotateCcw,
  Pencil,
  Activity,
  FileDown,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import { useGetAllProductsQuery } from "@/redux/api/productApi";
import { TProduct } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import ProductFormModal from "@/components/Products/ProductFormModal";
import ProductActivitySheet from "@/components/Products/ProductActivitySheet";

const PRODUCT_UNITS: { label: string; value: string }[] = [
  { label: "All Units", value: "ALL" },
  { label: "Piece (pcs)", value: "PIECE" },
  { label: "Kilogram (kg)", value: "KG" },
  { label: "Gram (g)", value: "GRAM" },
  { label: "Liter (L)", value: "LITER" },
  { label: "Box", value: "BOX" },
  { label: "Packet (pkt)", value: "PACKET" },
  { label: "Meter (m)", value: "METER" },
  { label: "Other", value: "OTHER" },
];

const SORT_OPTIONS = [
  { label: "Stock: Lowest First (Urgent)", sortBy: "stock", sortOrder: "asc" },
  { label: "Stock: Highest First", sortBy: "stock", sortOrder: "desc" },
  { label: "Name: A to Z", sortBy: "name", sortOrder: "asc" },
  { label: "Name: Z to A", sortBy: "name", sortOrder: "desc" },
  { label: "Selling Price: Low to High", sortBy: "sellingPrice", sortOrder: "asc" },
  { label: "Selling Price: High to Low", sortBy: "sellingPrice", sortOrder: "desc" },
];

type StockFilterType = "ALL" | "NEGATIVE" | "OUT_OF_STOCK" | "CRITICAL" | "LOW";

export default function LowStockTable() {
  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("ALL");
  const [stockFilter, setStockFilter] = useState<StockFilterType>("ALL");
  const [sortIndex, setSortIndex] = useState("0");
  const [page, setPage] = useState(1);

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<TProduct | null>(null);
  const [activitySheetOpen, setActivitySheetOpen] = useState(false);
  const [selectedProductForActivity, setSelectedProductForActivity] =
    useState<TProduct | null>(null);

  // Description expansion
  const [expandedDescriptions, setExpandedDescriptions] = useState<
    Record<string, boolean>
  >({});
  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const selectedSort = SORT_OPTIONS[Number(sortIndex)] || SORT_OPTIONS[0];

  const queryParams: Record<string, unknown> = {
    page,
    limit: 25,
    sortBy: selectedSort.sortBy,
    sortOrder: selectedSort.sortOrder,
    lowStock: "true",
    isDeleted: false,
  };

  if (searchTerm.trim()) {
    queryParams.searchTerm = searchTerm.trim();
  }

  if (selectedUnit !== "ALL") {
    queryParams.unit = selectedUnit;
  }

  if (stockFilter !== "ALL") {
    queryParams.stockStatus = stockFilter;
  }

  const {
    data: response,
    isLoading,
    isFetching,
  } = useGetAllProductsQuery(queryParams);

  let products = response?.data || [];
  const meta = response?.meta;

  // Client-side fallback filtering
  if (stockFilter === "NEGATIVE") {
    products = products.filter((p) => p.stock < 0);
  } else if (stockFilter === "OUT_OF_STOCK") {
    products = products.filter((p) => p.stock === 0);
  } else if (stockFilter === "CRITICAL") {
    products = products.filter((p) => p.stock > 0 && p.stock <= 5);
  } else if (stockFilter === "LOW") {
    products = products.filter((p) => p.stock > 5 && p.stock <= 20);
  }

  const totalCount =
    stockFilter === "ALL" ? (meta?.total ?? products.length) : products.length;

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedUnit("ALL");
    setStockFilter("ALL");
    setSortIndex("0");
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    selectedUnit !== "ALL" ||
    stockFilter !== "ALL" ||
    sortIndex !== "0";

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("lowStock", "true");
    params.set("sortBy", selectedSort.sortBy);
    params.set("sortOrder", selectedSort.sortOrder);
    if (searchTerm.trim()) params.set("searchTerm", searchTerm.trim());
    if (selectedUnit !== "ALL") params.set("unit", selectedUnit);
    if (stockFilter !== "ALL") params.set("stockStatus", stockFilter);
    return `/products/export?${params.toString()}`;
  }, [selectedSort, searchTerm, selectedUnit, stockFilter]);

  const handleOpenEdit = (p: TProduct) => {
    setProductToEdit(p);
    setFormModalOpen(true);
  };

  const handleOpenActivity = (p: TProduct) => {
    setSelectedProductForActivity(p);
    setActivitySheetOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Top Header Controls: Export Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <Button
          asChild
          variant="outline"
          className="h-9 gap-1.5 text-xs font-semibold"
        >
          <Link href={exportHref}>
            <FileDown className="size-4" />
            Export List
          </Link>
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          {/* Search Input */}
          <div className="relative lg:col-span-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search product by name or description..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 text-xs"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 lg:col-span-6 lg:justify-end">
            {/* Stock Level Filter */}
            <Select
              value={stockFilter}
              onValueChange={(val: StockFilterType) => {
                setStockFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs w-44">
                <Filter className="size-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Stock Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Low Stock (≤ 20)</SelectItem>
                <SelectItem value="NEGATIVE">Negative / Minus (&lt; 0)</SelectItem>
                <SelectItem value="OUT_OF_STOCK">Out of Stock (0)</SelectItem>
                <SelectItem value="CRITICAL">Critical Low (1 – 5)</SelectItem>
                <SelectItem value="LOW">Low Stock (6 – 20)</SelectItem>
              </SelectContent>
            </Select>

            {/* Unit Filter */}
            <Select
              value={selectedUnit}
              onValueChange={(val) => {
                setSelectedUnit(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs w-36">
                <SelectValue placeholder="All Units" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_UNITS.map((u) => (
                  <SelectItem key={u.value} value={u.value} className="text-xs">
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Select */}
            <Select
              value={sortIndex}
              onValueChange={(val) => {
                setSortIndex(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs w-44">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt, idx) => (
                  <SelectItem key={opt.label} value={String(idx)} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5"
                title="Reset Filters"
              >
                <RotateCcw className="size-3.5" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
        {/* Table Top Toolbar: Count & Top Pagination */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border bg-muted/30 px-4 py-2.5">
          <p className="text-xs text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-48" />
            ) : totalCount > 0 && meta ? (
              <>
                Showing{" "}
                <span className="font-medium text-foreground font-mono">
                  {(meta.page - 1) * meta.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-foreground font-mono">
                  {Math.min(meta.page * meta.limit, totalCount)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground font-mono">
                  {totalCount}
                </span>{" "}
                products
              </>
            ) : (
              "0 products found"
            )}
          </p>

          {/* Top Pagination Controls */}
          {meta && meta.totalPage > 1 && (
            <div className="flex items-center gap-1 self-end sm:self-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
                className="h-8 px-2.5 text-xs"
              >
                <ChevronLeft className="mr-1 size-3.5" />
                Previous
              </Button>

              <div className="px-2 text-xs font-medium text-muted-foreground">
                Page {meta.page} of {meta.totalPage}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= meta.totalPage || isFetching}
                className="h-8 px-2.5 text-xs"
              >
                Next
                <ChevronRight className="ml-1 size-3.5" />
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} index={i}>
                  <TableCell className="text-center">
                    <Skeleton className="h-4 w-5 mx-auto" />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-8 w-24 ml-auto rounded-md" />
                  </TableCell>
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Package className="size-8 text-muted-foreground/40" />
                    <p className="text-base font-medium text-foreground">
                      No low stock products found
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {hasActiveFilters
                        ? "Try adjusting your filters or search criteria."
                        : "Great job! All products have sufficient inventory."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              products.map((product, index) => {
                const serialNumber =
                  (page - 1) * (meta?.limit || 25) + index + 1;
                const isNegative = product.stock < 0;
                const isOutOfStock = product.stock === 0;

                return (
                  <TableRow
                    key={product.id}
                    index={index}
                    className={cn(
                      isFetching && "opacity-60",
                      isNegative && "bg-rose-500/5 hover:bg-rose-500/10",
                      isOutOfStock && "bg-rose-500/2",
                    )}
                  >
                    {/* Index / Serial Number */}
                    <TableCell className="text-center text-xs font-mono text-muted-foreground w-12">
                      {serialNumber}
                    </TableCell>

                    {/* Product Name & Details */}
                    <TableCell className="min-w-[200px] max-w-[360px]">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground text-xs sm:text-sm wrap-break-word">
                            {product.name}
                          </span>
                          <span className="font-medium bg-muted px-1.5 py-0.5 rounded text-[10px] text-muted-foreground shrink-0">
                            {product.unit}
                          </span>
                        </div>

                        {product.description && (
                          <div className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                            {product.description.length > 55 ? (
                              <span>
                                <span className="wrap-break-word">
                                  {expandedDescriptions[product.id]
                                    ? product.description
                                    : `${product.description.slice(0, 55)}...`}
                                </span>{" "}
                                <button
                                  type="button"
                                  onClick={() => toggleDescription(product.id)}
                                  className="font-medium text-primary hover:underline inline-flex items-center text-[10px] cursor-pointer"
                                >
                                  {expandedDescriptions[product.id]
                                    ? "See less"
                                    : "See more"}
                                </button>
                              </span>
                            ) : (
                              <span className="wrap-break-word">
                                {product.description}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Stock Level Badge */}
                    <TableCell>
                      {isNegative ? (
                        <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 text-xs font-semibold py-0.5 px-2.5">
                          Negative ({product.stock} {product.unit})
                        </Badge>
                      ) : isOutOfStock ? (
                        <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-xs font-semibold py-0.5 px-2.5">
                          Out of stock (0)
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs font-semibold py-0.5 px-2.5">
                          Low stock ({product.stock} {product.unit})
                        </Badge>
                      )}
                    </TableCell>

                    {/* Price */}
                    <TableCell className="text-xs sm:text-sm">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          ৳{product.sellingPrice}
                        </span>
                        {product.buyingPrice != null ? (
                          <span className="text-[11px] text-muted-foreground font-mono">
                            Buy: ৳{product.buyingPrice}
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground/50 italic">
                            Buy: —
                          </span>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="View Activity Logs"
                          onClick={() => handleOpenActivity(product)}
                          className="size-7 text-muted-foreground hover:text-foreground"
                        >
                          <Activity className="size-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit Product / Restock"
                          onClick={() => handleOpenEdit(product)}
                          className="size-7 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {meta && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-border px-4 py-3 bg-muted/20">
            <p className="text-xs text-muted-foreground">
              {totalCount > 0 ? (
                <>
                  Showing{" "}
                  <span className="font-medium text-foreground font-mono">
                    {(meta.page - 1) * meta.limit + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-foreground font-mono">
                    {Math.min(meta.page * meta.limit, totalCount)}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-foreground font-mono">
                    {totalCount}
                  </span>{" "}
                  products
                </>
              ) : (
                "0 products found"
              )}
            </p>

            {meta.totalPage > 1 && (
              <div className="flex items-center gap-1 self-end sm:self-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isFetching}
                  className="h-8 px-2.5 text-xs"
                >
                  <ChevronLeft className="mr-1 size-3.5" />
                  Previous
                </Button>

                <div className="px-2 text-xs font-medium text-muted-foreground">
                  Page {meta.page} of {meta.totalPage}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= meta.totalPage || isFetching}
                  className="h-8 px-2.5 text-xs"
                >
                  Next
                  <ChevronRight className="ml-1 size-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit / Restock Modal */}
      <ProductFormModal
        open={formModalOpen}
        onOpenChange={(val) => {
          setFormModalOpen(val);
          if (!val) setProductToEdit(null);
        }}
        productToEdit={productToEdit}
      />

      {/* Activity Sheet */}
      <ProductActivitySheet
        open={activitySheetOpen}
        onOpenChange={(val) => {
          setActivitySheetOpen(val);
          if (!val) setSelectedProductForActivity(null);
        }}
        product={selectedProductForActivity}
      />
    </div>
  );
}
