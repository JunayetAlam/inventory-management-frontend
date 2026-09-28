"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Clock,
  Pencil,
  Trash2,
  Check,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Activity,
  Archive,
  FileSpreadsheet,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetAllProductsQuery,
  useConfirmDeleteProductMutation,
  useRejectDeleteProductMutation,
  useRestoreProductMutation,
} from "@/redux/api/productApi";
import useIsAdmin from "@/hooks/useIsAdmin";
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
import { Skeleton } from "@/components/ui/skeleton";
import ProductFormModal from "./ProductFormModal";
import ProductBulkModal from "./ProductBulkModal";
import ProductActivitySheet from "./ProductActivitySheet";
import ProductDeleteModal from "./ProductDeleteModal";
import ConfirmPopup from "../Global/ConfirmPopup";
import { errorMessageGenerator } from "@/utils/errorMessageGenerator";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TabType = "ACTIVE" | "PENDING_DELETION" | "ARCHIVED";

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
  { label: "Newest First", sortBy: "createdAt", sortOrder: "desc" },
  { label: "Oldest First", sortBy: "createdAt", sortOrder: "asc" },
  { label: "Price: Low to High", sortBy: "sellingPrice", sortOrder: "asc" },
  { label: "Price: High to Low", sortBy: "sellingPrice", sortOrder: "desc" },
  { label: "Stock: Low to High", sortBy: "stock", sortOrder: "asc" },
  { label: "Stock: High to Low", sortBy: "stock", sortOrder: "desc" },
  { label: "Name: A to Z", sortBy: "name", sortOrder: "asc" },
];

export default function ProductTable() {
  const [isAdmin] = useIsAdmin();
  const [activeTab, setActiveTab] = useState<TabType>("ACTIVE");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("ALL");
  const [sortIndex, setSortIndex] = useState("0");

  // Modal States
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<TProduct | null>(null);

  const [activitySheetOpen, setActivitySheetOpen] = useState(false);
  const [selectedProductForActivity, setSelectedProductForActivity] =
    useState<TProduct | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<TProduct | null>(null);

  // Description expansion state
  const [expandedDescriptions, setExpandedDescriptions] = useState<
    Record<string, boolean>
  >({});
  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Admin Mutations
  const [confirmDelete, { isLoading: isConfirming }] =
    useConfirmDeleteProductMutation();
  const [rejectDelete, { isLoading: isRejecting }] =
    useRejectDeleteProductMutation();
  const [restoreProduct, { isLoading: isRestoring }] =
    useRestoreProductMutation();

  // Query Params Construction
  const selectedSort = SORT_OPTIONS[Number(sortIndex)] || SORT_OPTIONS[0];
  const queryParams: Record<string, unknown> = {
    page,
    limit: 25,
    sortBy: selectedSort.sortBy,
    sortOrder: selectedSort.sortOrder,
  };

  if (searchTerm.trim()) {
    queryParams.searchTerm = searchTerm.trim();
  }
  if (selectedUnit !== "ALL") {
    queryParams.unit = selectedUnit;
  }

  // Tab Filtering logic
  if (activeTab === "ACTIVE") {
    queryParams.isDeleted = false;
  } else if (activeTab === "PENDING_DELETION") {
    queryParams.isDeleted = false;
    queryParams.isDeleteRequested = true;
  } else if (activeTab === "ARCHIVED") {
    queryParams.isDeleted = true;
  }

  const {
    data: response,
    isLoading,
    isFetching,
  } = useGetAllProductsQuery(queryParams);
  let products = response?.data || [];
  const meta = response?.meta;

  const totalCount = meta?.total ?? 0;

  const handleOpenCreate = () => {
    setProductToEdit(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (p: TProduct) => {
    setProductToEdit(p);
    setFormModalOpen(true);
  };

  const handleOpenActivity = (p: TProduct) => {
    setSelectedProductForActivity(p);
    setActivitySheetOpen(true);
  };

  const handleOpenDelete = (p: TProduct) => {
    setProductToDelete(p);
    setDeleteModalOpen(true);
  };

  const handleAdminConfirmDelete = async (p: TProduct) => {
    try {
      await confirmDelete(p.id).unwrap();
      toast.success(`Deletion of "${p.name}" approved.`);
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    }
  };

  const handleAdminRejectDelete = async (p: TProduct) => {
    try {
      await rejectDelete(p.id).unwrap();
      toast.info(`Deletion request for "${p.name}" rejected.`);
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    }
  };

  const handleAdminRestore = async (p: TProduct) => {
    try {
      await restoreProduct(p.id).unwrap();
      toast.success(`Product "${p.name}" restored successfully!`);
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedUnit("ALL");
    setSortIndex("0");
    setPage(1);
  };

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("sortBy", selectedSort.sortBy);
    params.set("sortOrder", selectedSort.sortOrder);
    if (searchTerm.trim()) params.set("searchTerm", searchTerm.trim());
    if (selectedUnit !== "ALL") params.set("unit", selectedUnit);
    if (activeTab === "ARCHIVED") params.set("isDeleted", "true");
    else params.set("isDeleted", "false");
    if (activeTab === "PENDING_DELETION") {
      params.set("isDeleteRequested", "true");
    }
    return `/products/export?${params.toString()}`;
  }, [selectedSort, searchTerm, selectedUnit, activeTab]);

  return (
    <div className="space-y-4">
      {/* Top Header Controls: Tabs & Add Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Navigation Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-muted/40 p-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab("ACTIVE");
              setPage(1);
            }}
            className={cn(
              "rounded-md px-3 py-1.5 font-medium transition-colors",
              activeTab === "ACTIVE"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            All Active
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("PENDING_DELETION");
              setPage(1);
            }}
            className={cn(
              "flex items-center gap-1 rounded-md px-3 py-1.5 font-medium transition-colors",
              activeTab === "PENDING_DELETION"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Clock className="size-3 text-rose-500" />
            Pending Deletion
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setActiveTab("ARCHIVED");
                setPage(1);
              }}
              className={cn(
                "flex items-center gap-1 rounded-md px-3 py-1.5 font-medium transition-colors",
                activeTab === "ARCHIVED"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Archive className="size-3 text-slate-500" />
              Archived
            </button>
          )}
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2">
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

          <Button
            variant="outline"
            onClick={() => setBulkModalOpen(true)}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <FileSpreadsheet className="size-4 text-emerald-600 dark:text-emerald-400" />
            Bulk Import
          </Button>

          <Button
            onClick={handleOpenCreate}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <Plus className="size-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          {/* Text Search */}
          <div className="relative lg:col-span-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search product by name or description..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 text-xs"
            />
          </div>

          {/* Unit & Sort Selectors together with gap-5 */}
          <div className="flex items-center gap-5 lg:col-span-6">
            <div className="flex-1 flex gap-4">
              <Select
                value={selectedUnit}
                onValueChange={(val) => {
                  setSelectedUnit(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Filter by Unit" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_UNITS.map((u) => (
                    <SelectItem
                      key={u.value}
                      value={u.value}
                      className="text-xs"
                    >
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={sortIndex}
                onValueChange={(val) => {
                  setSortIndex(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((s, idx) => (
                    <SelectItem
                      key={idx}
                      value={String(idx)}
                      className="text-xs"
                    >
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Reset Filter info */}
        {(searchTerm || selectedUnit !== "ALL" || sortIndex !== "0") && (
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="size-3.5" />
              <span>Filters active</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="mr-1.5 size-3.5" />
              Reset filters
            </Button>
          </div>
        )}
      </div>

      {/* Products Table */}
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
                        No products found
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activeTab === "PENDING_DELETION"
                          ? "No deletion requests pending confirmation."
                          : "Try adjusting your filters or click 'Add Product' to create one."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product, index) => {
                  const serialNumber =
                    (page - 1) * (meta?.limit || 25) + index + 1;
                  return (
                    <TableRow
                      key={product.id}
                      index={index}
                      className={cn(
                        isFetching && "opacity-60",
                        product.isDeleteRequested &&
                          "bg-amber-500/5 hover:bg-amber-500/10",
                        product.isDeleted && "bg-muted/30 opacity-70",
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
                            {product.isDeleteRequested && (
                              <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] py-0 px-1.5 font-normal">
                                Pending Deletion
                              </Badge>
                            )}
                          </div>

                          {product.deleteReason && (
                            <span className="mt-0.5 text-[10px] text-amber-600 dark:text-amber-400 italic">
                              Reason: "{product.deleteReason}"
                            </span>
                          )}

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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleDescription(product.id);
                                    }}
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

                      {/* Stock */}
                      <TableCell>
                        {product.stock < 0 ? (
                          <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 text-xs font-semibold">
                            Negative ({product.stock} {product.unit})
                          </Badge>
                        ) : product.stock === 0 ? (
                          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 text-xs font-semibold">
                            Out of stock (0)
                          </Badge>
                        ) : product.stock <= 20 ? (
                          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs font-semibold">
                            Low stock ({product.stock} {product.unit})
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs font-medium">
                            {product.stock} {product.unit}
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
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Right Sheet Activity Log Trigger */}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Product Activity Log"
                            onClick={() => handleOpenActivity(product)}
                            className="size-7 text-muted-foreground hover:text-foreground"
                          >
                            <Activity className="size-3.5" />
                          </Button>

                          {/* If Deleted (Admin Restore) */}
                          {product.isDeleted ? (
                            isAdmin && (
                              <ConfirmPopup
                                title="Restore Product?"
                                description={`Are you sure you want to restore "${product.name}" back to active stock?`}
                                confirmLabel="Restore"
                                destructive={false}
                                loading={isRestoring}
                                onConfirm={() => handleAdminRestore(product)}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isRestoring}
                                  className="h-7 px-2 text-xs text-primary"
                                >
                                  <RotateCcw className="mr-1 size-3" />
                                  Restore
                                </Button>
                              </ConfirmPopup>
                            )
                          ) : (
                            <>
                              {/* If Pending Deletion & Current User is Admin: Show Quick Confirm/Reject */}
                              {product.isDeleteRequested && isAdmin ? (
                                <div className="flex items-center gap-1">
                                  <ConfirmPopup
                                    title="Confirm Deletion Request?"
                                    description={`A cashier requested deletion: "${product.deleteReason || "No reason specified"}". Confirming will soft-delete this product.`}
                                    confirmLabel="Confirm Delete"
                                    destructive={true}
                                    loading={isConfirming}
                                    onConfirm={() =>
                                      handleAdminConfirmDelete(product)
                                    }
                                  >
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="h-7 px-2 text-xs"
                                      title="Confirm deletion request"
                                    >
                                      <Check className="mr-1 size-3" />
                                      Approve
                                    </Button>
                                  </ConfirmPopup>

                                  <ConfirmPopup
                                    title="Reject Deletion Request?"
                                    description={`Reject cashier's request to delete "${product.name}"?`}
                                    confirmLabel="Reject Request"
                                    destructive={false}
                                    loading={isRejecting}
                                    onConfirm={() =>
                                      handleAdminRejectDelete(product)
                                    }
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 px-2 text-xs"
                                      title="Reject deletion request"
                                    >
                                      <X className="mr-1 size-3" />
                                      Reject
                                    </Button>
                                  </ConfirmPopup>
                                </div>
                              ) : null}

                              {/* Normal Edit & Delete */}
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Edit Product"
                                onClick={() => handleOpenEdit(product)}
                                className="size-7 text-muted-foreground hover:text-foreground"
                              >
                                <Pencil className="size-3.5" />
                              </Button>

                              {product.isDeleteRequested && !isAdmin ? (
                                <Badge
                                  variant="secondary"
                                  className="h-7 px-2 text-[10px] text-amber-600 bg-amber-500/10 cursor-not-allowed"
                                  title="A deletion request is currently under review by admin"
                                >
                                  Pending Approval
                                </Badge>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title={
                                    isAdmin
                                      ? "Delete Product"
                                      : "Request Delete"
                                  }
                                  onClick={() => handleOpenDelete(product)}
                                  className="size-7 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              )}
                            </>
                          )}
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

      {/* Modals and Sheets */}
      <ProductFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        productToEdit={productToEdit}
        onOpenBulk={() => setBulkModalOpen(true)}
      />

      <ProductBulkModal open={bulkModalOpen} onOpenChange={setBulkModalOpen} />

      <ProductActivitySheet
        open={activitySheetOpen}
        onOpenChange={setActivitySheetOpen}
        product={selectedProductForActivity}
      />

      <ProductDeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        product={productToDelete}
      />
    </div>
  );
}
