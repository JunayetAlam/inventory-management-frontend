"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Receipt as Invoice,
  Search,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Phone,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Archive,
  AlertTriangle,
  Printer,
  FileText,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetAllInvoicesQuery,
  useConfirmDeleteInvoiceMutation,
  useRejectDeleteInvoiceMutation,
  useRestoreInvoiceMutation,
} from "@/redux/api/invoiceApi";
import useIsAdmin from "@/hooks/useIsAdmin";
import { TInvoice } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import InvoiceActivitySheet from "./InvoiceActivitySheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import ConfirmPopup from "../Global/ConfirmPopup";
import InvoiceDeleteModal from "./InvoiceDeleteModal";
import InvoiceStatusDropdown from "./InvoiceStatusDropdown";
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

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

type TabType = "ALL" | "PENDING" | "APPROVED" | "PENDING_DELETION" | "ARCHIVED";

const SORT_OPTIONS = [
  { label: "Newest First", sortBy: "createdAt", sortOrder: "desc" },
  { label: "Oldest First", sortBy: "createdAt", sortOrder: "asc" },
  { label: "Total: High to Low", sortBy: "totalAmount", sortOrder: "desc" },
  { label: "Total: Low to High", sortBy: "totalAmount", sortOrder: "asc" },
];

export default function InvoiceTable() {
  const [isAdmin] = useIsAdmin();

  // Filters & State
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modals

  const [selectedInvoiceForDelete, setSelectedInvoiceForDelete] =
    useState<TInvoice | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activitySheetOpen, setActivitySheetOpen] = useState(false);
  const [selectedInvoiceForActivity, setSelectedInvoiceForActivity] =
    useState<TInvoice | null>(null);

  // Mutations
  const [confirmDelete, { isLoading: isConfirming }] =
    useConfirmDeleteInvoiceMutation();
  const [rejectDelete, { isLoading: isRejecting }] =
    useRejectDeleteInvoiceMutation();
  const [restoreInvoice, { isLoading: isRestoring }] =
    useRestoreInvoiceMutation();

  // Query Params
  const queryParams: Record<string, unknown> = {
    page,
    limit,
    sortBy: sortOption.sortBy,
    sortOrder: sortOption.sortOrder,
  };

  if (searchTerm.trim()) {
    queryParams.searchTerm = searchTerm.trim();
  }

  // Tab Filtering
  if (activeTab === "ALL") {
    queryParams.isDeleted = false;
  } else if (activeTab === "PENDING") {
    queryParams.isDeleted = false;
    queryParams.status = "PENDING";
  } else if (activeTab === "APPROVED") {
    queryParams.isDeleted = false;
    queryParams.status = "APPROVED";
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
  } = useGetAllInvoicesQuery(queryParams);
  const invoices = response?.data || [];
  const meta = response?.meta;

  const handleOpenDelete = (r: TInvoice) => {
    setSelectedInvoiceForDelete(r);
    setDeleteModalOpen(true);
  };

  const handleAdminConfirmDelete = async (r: TInvoice) => {
    try {
      await confirmDelete(r.id).unwrap();
      toast.success(
        `Invoice ${r.invoiceNumber} deletion confirmed. Stock restored.`,
      );
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    }
  };

  const handleAdminRejectDelete = async (r: TInvoice) => {
    try {
      await rejectDelete(r.id).unwrap();
      toast.success(
        `Deletion request for Invoice ${r.invoiceNumber} rejected.`,
      );
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    }
  };

  const handleAdminRestore = async (r: TInvoice) => {
    try {
      const res: any = await restoreInvoice(r.id).unwrap();
      toast.success(`Invoice ${r.invoiceNumber} restored successfully.`);
      if (res?.data?.warnings && res.data.warnings.length > 0) {
        res.data.warnings.forEach((w: string) => toast.warning(w));
      }
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    }
  };

  const totalPages = meta?.totalPage || 1;

  return (
    <div className="space-y-4">
      {/* Top Header Controls: Search, Sort, Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice # or customer..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 text-xs"
            />
          </div>
          <Select
            value={sortOption.label}
            onValueChange={(val) => {
              const opt = SORT_OPTIONS.find((s) => s.label === val);
              if (opt) {
                setSortOption(opt);
                setPage(1);
              }
            }}
          >
            <SelectTrigger className="w-[160px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.label}
                  value={opt.label}
                  className="text-xs"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/invoices/create">
            <Button
              size="sm"
              className="gap-1.5 font-semibold text-xs shadow-xs"
            >
              <Plus className="size-4" /> Create Invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto text-xs font-medium">
        <button
          type="button"
          onClick={() => {
            setActiveTab("ALL");
            setPage(1);
          }}
          className={cn(
            "pb-2.5 px-3 border-b-2 transition-colors",
            activeTab === "ALL"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          All Invoices
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("PENDING");
            setPage(1);
          }}
          className={cn(
            "pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5",
            activeTab === "PENDING"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Clock className="size-3 text-amber-600" />
          Pending Approval
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("APPROVED");
            setPage(1);
          }}
          className={cn(
            "pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5",
            activeTab === "APPROVED"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <ShieldCheck className="size-3 text-emerald-600" />
          Approved
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("PENDING_DELETION");
            setPage(1);
          }}
          className={cn(
            "pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5",
            activeTab === "PENDING_DELETION"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <ShieldAlert className="size-3 text-rose-600" />
          Deletion Requests
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("ARCHIVED");
            setPage(1);
          }}
          className={cn(
            "pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5",
            activeTab === "ARCHIVED"
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground",
          )}
        >
          <Archive className="size-3" />
          Archived / Deleted
        </button>
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-border/70 overflow-hidden bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-40">Invoice Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total Bill</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx} index={idx}>
                  <TableCell className="min-w-40">
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-7 w-32 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-12 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Invoice className="size-8 text-muted-foreground/40" />
                    <p className="text-base font-medium text-foreground">
                      No invoices found
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activeTab === "PENDING_DELETION"
                        ? "No deletion requests pending admin confirmation."
                        : "Try adjusting your search filters or create a new invoice."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice, index) => {
                const isLockedForCashier =
                  !isAdmin && invoice.status === "APPROVED";
                const hasDue = invoice.dueAmount > 0;
                const formattedDate = formatDate(invoice.createdAt);

                return (
                  <TableRow
                    key={invoice.id}
                    index={index}
                    className={cn(
                      isFetching && "opacity-60",
                      invoice.isDeleteRequested &&
                        "bg-rose-500/5 hover:bg-rose-500/10",
                      invoice.isDeleted && "bg-muted/30 opacity-70",
                    )}
                  >
                    {/* Invoice Number & Date */}
                    <TableCell className="min-w-40 whitespace-nowrap">
                      <div className="flex flex-col min-w-0">
                        <span className="font-mono font-bold text-foreground text-xs">
                          {invoice.invoiceNumber}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formattedDate}
                        </span>
                      </div>
                    </TableCell>

                    {/* Customer Info */}
                    <TableCell>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-foreground truncate max-w-[150px]">
                          {invoice.customer?.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                          <Phone className="size-3 text-muted-foreground/70" />
                          {invoice.customer?.countryCode || "+880"}{" "}
                          {invoice.customer?.phoneNumber}
                        </span>
                      </div>
                    </TableCell>

                    {/* Items Count */}
                    <TableCell>
                      <span className="font-mono font-medium text-xs">
                        {invoice._count?.items ?? invoice.items?.length ?? 0}
                      </span>
                    </TableCell>

                    {/* Total Amount */}
                    <TableCell className="font-mono font-semibold text-foreground">
                      ৳{invoice.totalAmount}
                    </TableCell>

                    {/* Paid Amount */}
                    <TableCell className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                      ৳{invoice.paidAmount}
                    </TableCell>

                    {/* Due Amount */}
                    <TableCell>
                      {hasDue ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-500/10 text-destructive border border-destructive/20">
                          ৳{invoice.dueAmount}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          PAID
                        </span>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <InvoiceStatusDropdown invoice={invoice} />

                        {invoice.isDeleteRequested && (
                          <Badge
                            variant="secondary"
                            className="text-[9px] px-1.5 py-0 text-rose-600 bg-rose-500/10 border-rose-500/20"
                          >
                            Delete Req
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap sm:flex-nowrap">
                        {/* Invoice Actions */}
                        <Link href={`/invoices/${invoice.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            title="View Details / Edit"
                            className="h-7 px-2.5 text-xs font-medium text-foreground hover:bg-muted"
                          >
                            Details/Edit
                          </Button>
                        </Link>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          title="Activity Log"
                          onClick={() => {
                            setSelectedInvoiceForActivity(invoice);
                            setActivitySheetOpen(true);
                          }}
                        >
                          <Activity className="size-3.5 text-muted-foreground hover:text-foreground" />
                        </Button>

                        {!invoice.isDeleted && (
                          <>
                            <Link href={`/invoices/${invoice.id}/invoice`}>
                              <Button
                                variant="outline"
                                size="sm"
                                title="View Invoice"
                                className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground gap-1"
                              >
                                <FileText className="size-3.5" /> View Invoice
                              </Button>
                            </Link>
                            <Link href={`/invoices/${invoice.id}/invoice?print=1`}>
                              <Button
                                variant="outline"
                                size="sm"
                                title="Print Invoice"
                                className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground gap-1"
                              >
                                <Printer className="size-3.5" /> Print Invoice
                              </Button>
                            </Link>
                          </>
                        )}

                        {/* Admin Restore Button */}
                        {invoice.isDeleted
                          ? isAdmin && (
                              <ConfirmPopup
                                title="Restore Invoice?"
                                description={`Restore Invoice "${invoice.invoiceNumber}"? Stock will be re-deducted.`}
                                confirmLabel="Restore"
                                destructive={false}
                                loading={isRestoring}
                                onConfirm={() => handleAdminRestore(invoice)}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 px-2.5 text-xs font-medium text-primary border-primary/40 hover:bg-primary/10"
                                  title="Restore Invoice"
                                >
                                  Restore
                                </Button>
                              </ConfirmPopup>
                            )
                          : /* Normal Delete / Request Delete */
                            !invoice.isDeleted &&
                            (invoice.isDeleteRequested && !isAdmin ? (
                              <Badge
                                variant="secondary"
                                className="h-7 px-2.5 text-[10px] text-amber-600 bg-amber-500/10 cursor-not-allowed"
                                title="Deletion request pending admin review"
                              >
                                Delete Requested
                              </Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                title={
                                  isAdmin ? "Delete Invoice" : "Request Delete"
                                }
                                onClick={() => handleOpenDelete(invoice)}
                                className="h-7 px-2.5 text-xs font-medium text-destructive border-destructive/30 hover:bg-destructive/10"
                              >
                                {isAdmin ? "Delete" : "Request Delete"}
                              </Button>
                            ))}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {meta && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 text-xs">
            <span className="text-muted-foreground">
              Showing {(page - 1) * limit + 1} to{" "}
              {Math.min(page * limit, meta.total)} of {meta.total} invoices
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs gap-1"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-3.5" /> Previous
              </Button>
              <span className="font-mono text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs gap-1"
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}

      <InvoiceDeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        invoice={selectedInvoiceForDelete}
      />

      <InvoiceActivitySheet
        open={activitySheetOpen}
        onOpenChange={setActivitySheetOpen}
        invoice={selectedInvoiceForActivity}
      />
    </div>
  );
}
