"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon, Add01Icon, ArrowLeft01Icon, ArrowRight01Icon, Clock01Icon, SecurityCheckIcon, SecurityWarningIcon, Archive01Icon, PrinterIcon, File02Icon, Undo02Icon, Activity01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import {
  useGetAllReturnInvoicesQuery,
  useConfirmDeleteReturnInvoiceMutation,
  useRejectDeleteReturnInvoiceMutation,
  useRestoreReturnInvoiceMutation,
} from "@/redux/api/returnInvoiceApi";
import useIsAdmin from "@/hooks/useIsAdmin";
import { TReturnInvoice } from "@/types";
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
import ConfirmPopup from "../Global/ConfirmPopup";
import ReturnInvoiceDeleteModal from "./ReturnInvoiceDeleteModal";
import ReturnInvoiceStatusDropdown from "./ReturnInvoiceStatusDropdown";
import ReturnInvoiceActivitySheet from "./ReturnInvoiceActivitySheet";
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
  { label: "Refunded: High to Low", sortBy: "refundedAmount", sortOrder: "desc" },
  { label: "Refunded: Low to High", sortBy: "refundedAmount", sortOrder: "asc" },
];

export default function ReturnInvoiceTable() {
  const [isAdmin] = useIsAdmin();
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState(SORT_OPTIONS[0]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedForDelete, setSelectedForDelete] =
    useState<TReturnInvoice | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activitySheetOpen, setActivitySheetOpen] = useState(false);
  const [selectedForActivity, setSelectedForActivity] =
    useState<TReturnInvoice | null>(null);

  const [confirmDelete, { isLoading: isConfirming }] =
    useConfirmDeleteReturnInvoiceMutation();
  const [rejectDelete, { isLoading: isRejecting }] =
    useRejectDeleteReturnInvoiceMutation();
  const [restoreReturn, { isLoading: isRestoring }] =
    useRestoreReturnInvoiceMutation();

  const queryParams: Record<string, unknown> = {
    page,
    limit,
    sortBy: sortOption.sortBy,
    sortOrder: sortOption.sortOrder,
  };
  if (searchTerm.trim()) queryParams.searchTerm = searchTerm.trim();

  if (activeTab === "ALL") queryParams.isDeleted = false;
  else if (activeTab === "PENDING") {
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

  const { data: response, isLoading } =
    useGetAllReturnInvoicesQuery(queryParams);
  const rows = response?.data || [];
  const meta = response?.meta;
  const totalPages = meta?.totalPage || 1;

  const tabs: { key: TabType; label: string; icon?: React.ReactNode }[] = [
    { key: "ALL", label: "All Returns" },
    {
      key: "PENDING",
      label: "Pending",
      icon: <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3 text-amber-600" />,
    },
    {
      key: "APPROVED",
      label: "Approved",
      icon: <HugeiconsIcon icon={SecurityCheckIcon} strokeWidth={2} className="size-3 text-emerald-600" />,
    },
    {
      key: "PENDING_DELETION",
      label: "Deletion Requests",
      icon: <HugeiconsIcon icon={SecurityWarningIcon} strokeWidth={2} className="size-3 text-rose-600" />,
    },
    {
      key: "ARCHIVED",
      label: "Archived",
      icon: <HugeiconsIcon icon={Archive01Icon} strokeWidth={2} className="size-3" />,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by return #..."
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
                <SelectItem key={opt.label} value={opt.label} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Link href="/return-invoices/create">
          <Button size="sm" className="gap-1.5 font-semibold text-xs shadow-xs">
            <HugeiconsIcon icon={Add01Icon} strokeWidth={2} className="size-4" /> Create Return Invoice
          </Button>
        </Link>
      </div>

      <div className="flex items-center gap-1 border-b border-border overflow-x-auto text-xs font-medium">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              setActiveTab(tab.key);
              setPage(1);
            }}
            className={cn(
              "pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap",
              activeTab === tab.key
                ? "border-primary text-primary font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-border/70 overflow-hidden bg-card shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Return #</TableHead>
              <TableHead>Source Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Credit</TableHead>
              <TableHead>Refund Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <TableRow key={idx} index={idx}>
                  {Array.from({ length: 8 }).map((__, c) => (
                    <TableCell key={c}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-12 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center gap-2">
                    <HugeiconsIcon icon={Undo02Icon} strokeWidth={2} className="size-8 text-muted-foreground/40" />
                    <p className="text-base font-medium text-foreground">
                      No return invoices found
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow key={row.id} index={index}>
                  <TableCell>
                    <div className="flex flex-col">
                      <Link
                        href={`/return-invoices/${row.id}`}
                        className="font-mono text-xs font-semibold text-primary hover:underline"
                      >
                        {row.returnNumber}
                      </Link>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDate(row.createdAt)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {row.invoice ? (
                      <Link
                        href={`/invoices/${row.invoiceId}`}
                        className="font-mono text-xs hover:underline"
                      >
                        {row.invoice.invoiceNumber}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {row.invoice?.customer?.name || "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {row._count?.items ?? row.items?.length ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs font-mono font-semibold">
                    ৳{Number(row.totalAmount).toFixed(2)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-xs font-mono",
                      row.dueRefundAmount > 0 && "text-rose-600 font-semibold",
                    )}
                  >
                    ৳{Number(row.dueRefundAmount).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      <ReturnInvoiceStatusDropdown returnInvoice={row} />
                      {row.isDeleteRequested && (
                        <Badge
                          variant="secondary"
                          className="text-[9px] px-1.5 py-0 text-rose-600 bg-rose-500/10 border-rose-500/20"
                        >
                          Delete Req
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap sm:flex-nowrap">
                      {/* Details / Edit */}
                      <Link href={`/return-invoices/${row.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          title="View Details / Edit"
                          className="h-7 px-2.5 text-xs font-medium text-foreground hover:bg-muted"
                        >
                          Details/Edit
                        </Button>
                      </Link>

                      {/* Activity Log */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        title="Activity Log"
                        onClick={() => {
                          setSelectedForActivity(row);
                          setActivitySheetOpen(true);
                        }}
                      >
                        <HugeiconsIcon icon={Activity01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground hover:text-foreground" />
                      </Button>

                      {!row.isDeleted && (
                        <>
                          <Link href={`/return-invoices/${row.id}/invoice`}>
                            <Button
                              variant="outline"
                              size="sm"
                              title="View Invoice"
                              className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground gap-1"
                            >
                              <HugeiconsIcon icon={File02Icon} strokeWidth={2} className="size-3.5" /> View Invoice
                            </Button>
                          </Link>
                          <Link
                            href={`/return-invoices/${row.id}/invoice?print=1`}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              title="Print Invoice"
                              className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground gap-1"
                            >
                              <HugeiconsIcon icon={PrinterIcon} strokeWidth={2} className="size-3.5" /> Print Invoice
                            </Button>
                          </Link>
                        </>
                      )}

                      {/* Admin Restore Button */}
                      {row.isDeleted
                        ? isAdmin &&
                          (row.canRestore !== false ? (
                            <ConfirmPopup
                              title="Restore return invoice?"
                              description={`Restore ${row.returnNumber}? Stock will be restored again. Not allowed if a newer return already exists.`}
                              confirmLabel="Restore"
                              destructive={false}
                              loading={isRestoring}
                              onConfirm={async () => {
                                try {
                                  await restoreReturn(row.id).unwrap();
                                  toast.success("Return invoice restored");
                                } catch (err) {
                                  toast.error(errorMessageGenerator(err));
                                }
                              }}
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2.5 text-xs font-medium text-primary border-primary/40 hover:bg-primary/10"
                                title="Restore Return Invoice"
                              >
                                Restore
                              </Button>
                            </ConfirmPopup>
                          ) : (
                            <span
                              className="text-[11px] text-muted-foreground italic px-1"
                              title="Cannot restore: a newer return exists on this invoice"
                            >
                              Locked
                            </span>
                          ))
                        : /* Not deleted */
                          !row.isDeleted &&
                          (isAdmin && row.isDeleteRequested && row.isLatest !== false ? (
                            <div className="flex items-center gap-1">
                              <ConfirmPopup
                                title="Confirm deletion?"
                                description={`Delete ${row.returnNumber}? Stock will be adjusted. Only the latest return can be deleted.`}
                                confirmLabel="Confirm"
                                destructive
                                loading={isConfirming}
                                onConfirm={async () => {
                                  try {
                                    await confirmDelete(row.id).unwrap();
                                    toast.success("Return invoice deleted");
                                  } catch (err) {
                                    toast.error(errorMessageGenerator(err));
                                  }
                                }}
                              >
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 px-2 text-xs font-medium"
                                >
                                  Confirm
                                </Button>
                              </ConfirmPopup>
                              <ConfirmPopup
                                title="Reject deletion?"
                                description={`Reject delete request for ${row.returnNumber}?`}
                                confirmLabel="Reject"
                                loading={isRejecting}
                                onConfirm={async () => {
                                  try {
                                    await rejectDelete(row.id).unwrap();
                                    toast.success("Deletion request rejected");
                                  } catch (err) {
                                    toast.error(errorMessageGenerator(err));
                                  }
                                }}
                              >
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                                >
                                  Reject
                                </Button>
                              </ConfirmPopup>
                            </div>
                          ) : row.isDeleteRequested && !isAdmin ? (
                            <Badge
                              variant="secondary"
                              className="h-7 px-2.5 text-[10px] text-amber-600 bg-amber-500/10 cursor-not-allowed"
                              title="Deletion request pending admin review"
                            >
                              Delete Requested
                            </Badge>
                          ) : (
                            (isAdmin || row.status !== "APPROVED") &&
                            row.isLatest !== false && (
                              <Button
                                variant="outline"
                                size="sm"
                                title={
                                  isAdmin
                                    ? "Delete Return Invoice"
                                    : "Request Delete"
                                }
                                onClick={() => {
                                  setSelectedForDelete(row);
                                  setDeleteModalOpen(true);
                                }}
                                className="h-7 px-2.5 text-xs font-medium text-destructive border-destructive/30 hover:bg-destructive/10"
                              >
                                {isAdmin ? "Delete" : "Request Delete"}
                              </Button>
                            )
                          ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Rows</span>
          <Select
            value={String(limit)}
            onValueChange={(v) => {
              setLimit(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-16 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50].map((n) => (
                <SelectItem key={n} value={String(n)} className="text-xs">
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="size-4" />
          </Button>
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="size-4" />
          </Button>
        </div>
      </div>

      <ReturnInvoiceDeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        returnInvoice={selectedForDelete}
      />

      <ReturnInvoiceActivitySheet
        open={activitySheetOpen}
        onOpenChange={setActivitySheetOpen}
        returnInvoice={selectedForActivity}
      />
    </div>
  );
}
