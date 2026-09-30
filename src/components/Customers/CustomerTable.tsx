"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserAdd01Icon, Search01Icon, FilterIcon, RotateLeft01Icon, Clock01Icon, PencilEdit02Icon, Delete02Icon, Tick02Icon, Cancel01Icon, ArrowLeft01Icon, ArrowRight01Icon, Activity01Icon, Archive01Icon, Call02Icon, Mail01Icon, Location01Icon, ContactBookIcon, FileDownloadIcon, GridViewIcon, ListViewIcon, MoreVerticalIcon, LinkSquare02Icon, ViewIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import {
  useGetAllCustomersQuery,
  useConfirmDeleteCustomerMutation,
  useRejectDeleteCustomerMutation,
  useRestoreCustomerMutation,
} from "@/redux/api/customerApi";
import useIsAdmin from "@/hooks/useIsAdmin";
import { TCustomer } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CustomerFormModal from "./CustomerFormModal";
import CustomerActivitySheet from "./CustomerActivitySheet";
import CustomerDeleteModal from "./CustomerDeleteModal";
import ConfirmPopup from "../Global/ConfirmPopup";
import { errorMessageGenerator } from "@/utils/errorMessageGenerator";
import { cn } from "@/lib/utils";
import { formatSignedDue } from "@/utils/formatInvoiceMoney";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

const getWhatsAppUrl = (
  number?: string | null,
  defaultCountryCode = "+880",
) => {
  if (!number) return null;
  let clean = number.replace(/[^\d+]/g, "");
  if (clean.startsWith("+")) {
    clean = clean.slice(1);
  } else if (clean.startsWith("01") && clean.length === 11) {
    clean = `88${clean}`;
  } else if (!clean.startsWith("880") && defaultCountryCode) {
    const cc = defaultCountryCode.replace(/\+/g, "");
    clean = `${cc}${clean}`;
  }
  return `https://wa.me/${clean}`;
};

type TabType = "ACTIVE" | "PENDING_DELETION" | "ARCHIVED";
type ViewMode = "list" | "grid";

const SORT_OPTIONS = [
  { label: "Newest First", sortBy: "createdAt", sortOrder: "desc" },
  { label: "Oldest First", sortBy: "createdAt", sortOrder: "asc" },
  { label: "Name: A to Z", sortBy: "name", sortOrder: "asc" },
  { label: "Name: Z to A", sortBy: "name", sortOrder: "desc" },
];

export default function CustomerTable() {
  const [isAdmin] = useIsAdmin();
  const [activeTab, setActiveTab] = useState<TabType>("ACTIVE");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortIndex, setSortIndex] = useState("0");

  // Modal States
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<TCustomer | null>(null);

  const [activitySheetOpen, setActivitySheetOpen] = useState(false);
  const [selectedCustomerForActivity, setSelectedCustomerForActivity] =
    useState<TCustomer | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<TCustomer | null>(
    null,
  );

  // Admin Mutations
  const [confirmDelete, { isLoading: isConfirming }] =
    useConfirmDeleteCustomerMutation();
  const [rejectDelete, { isLoading: isRejecting }] =
    useRejectDeleteCustomerMutation();
  const [restoreCustomer, { isLoading: isRestoring }] =
    useRestoreCustomerMutation();

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
  } = useGetAllCustomersQuery(queryParams);
  const customers = response?.data || [];
  const meta = response?.meta;

  const handleOpenCreate = () => {
    setCustomerToEdit(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (c: TCustomer) => {
    setCustomerToEdit(c);
    setFormModalOpen(true);
  };

  const handleOpenActivity = (c: TCustomer) => {
    setSelectedCustomerForActivity(c);
    setActivitySheetOpen(true);
  };

  const handleOpenDelete = (c: TCustomer) => {
    setCustomerToDelete(c);
    setDeleteModalOpen(true);
  };

  const handleAdminConfirmDelete = async (c: TCustomer) => {
    try {
      await confirmDelete(c.id).unwrap();
      toast.success(`Deletion of "${c.name}" approved.`);
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    }
  };

  const handleAdminRejectDelete = async (c: TCustomer) => {
    try {
      await rejectDelete(c.id).unwrap();
      toast.info(`Deletion request for "${c.name}" rejected.`);
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    }
  };

  const handleAdminRestore = async (c: TCustomer) => {
    try {
      await restoreCustomer(c.id).unwrap();
      toast.success(`Customer "${c.name}" restored successfully!`);
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSortIndex("0");
    setPage(1);
  };

  const exportHref = useMemo(() => {
    const params = new URLSearchParams();
    params.set("sortBy", selectedSort.sortBy);
    params.set("sortOrder", selectedSort.sortOrder);
    if (searchTerm.trim()) params.set("searchTerm", searchTerm.trim());
    if (activeTab === "ARCHIVED") params.set("isDeleted", "true");
    else params.set("isDeleted", "false");
    if (activeTab === "PENDING_DELETION") {
      params.set("isDeleteRequested", "true");
    }
    return `/customers/export?${params.toString()}`;
  }, [selectedSort, searchTerm, activeTab]);

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
              "rounded-md px-3 py-1.5 font-medium transition-colors cursor-pointer",
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
              "flex items-center gap-1 rounded-md px-3 py-1.5 font-medium transition-colors cursor-pointer",
              activeTab === "PENDING_DELETION"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-3 text-rose-500" />
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
                "flex items-center gap-1 rounded-md px-3 py-1.5 font-medium transition-colors cursor-pointer",
                activeTab === "ARCHIVED"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <HugeiconsIcon icon={Archive01Icon} strokeWidth={2} className="size-3 text-slate-500" />
              Archived
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* List / Grid View Toggle */}
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("list")}
              className={cn(
                "h-8 px-2.5 text-xs font-medium gap-1.5 cursor-pointer",
                viewMode === "list"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="List View"
            >
              <HugeiconsIcon icon={ListViewIcon} strokeWidth={2} className="size-3.5" />
              <span className="hidden sm:inline">List</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setViewMode("grid")}
              className={cn(
                "h-8 px-2.5 text-xs font-medium gap-1.5 cursor-pointer",
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title="Grid View"
            >
              <HugeiconsIcon icon={GridViewIcon} strokeWidth={2} className="size-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </Button>
          </div>

          <Button
            asChild
            variant="outline"
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <Link href={exportHref}>
              <HugeiconsIcon icon={FileDownloadIcon} strokeWidth={2} className="size-4" />
              Export List
            </Link>
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="h-9 gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} className="size-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Text Search */}
          <div className="relative lg:col-span-2">
            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search customer by name, phone number, email or address..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 text-xs"
            />
          </div>

          {/* Sort Option */}
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
                <SelectItem key={idx} value={String(idx)} className="text-xs">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reset Filter info */}
        {(searchTerm || sortIndex !== "0") && (
          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <HugeiconsIcon icon={FilterIcon} strokeWidth={2} className="size-3.5" />
              <span>Filters active</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              <HugeiconsIcon icon={RotateLeft01Icon} strokeWidth={2} className="mr-1.5 size-3.5" />
              Reset filters
            </Button>
          </div>
        )}
      </div>

      {/* Customers Content: List View or Grid View */}
      {viewMode === "list" ? (
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Contact & WhatsApp</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Total Due</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} index={i}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="size-8 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-36" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-24 ml-auto rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : customers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <HugeiconsIcon icon={ContactBookIcon} strokeWidth={2} className="size-8 text-muted-foreground/40" />
                      <p className="text-base font-medium text-foreground">
                        No customers found
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activeTab === "PENDING_DELETION"
                          ? "No customer deletion requests pending confirmation."
                          : "Try adjusting your filters or click 'Add Customer' to create one."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer, index) => {
                  const initials = customer.name
                    ? customer.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()
                    : "CU";
                  const due = Number(customer.totalDue) || 0;
                  const dueLabel = formatSignedDue(due);
                  const waUrl = getWhatsAppUrl(
                    customer.whatsappNumber || customer.phoneNumber,
                    customer.countryCode,
                  );

                  return (
                    <TableRow
                      key={customer.id}
                      index={index}
                      className={cn(
                        "hover:bg-muted/50 transition-colors",
                        isFetching && "opacity-60",
                        customer.isDeleteRequested &&
                          "bg-amber-500/5 hover:bg-amber-500/10",
                        customer.isDeleted && "bg-muted/30 opacity-70",
                      )}
                    >
                      {/* Customer Info */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Link
                            href={`/customers/${customer.id}`}
                            className="group flex items-center gap-2.5 min-w-0"
                          >
                            <Avatar className="size-8 border border-border group-hover:border-primary/50 transition-colors shrink-0">
                              {customer.image && (
                                <AvatarImage
                                  src={customer.image}
                                  alt={customer.name}
                                  className="object-cover"
                                />
                              )}
                              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-foreground text-xs sm:text-sm truncate max-w-xs group-hover:text-primary transition-colors">
                                  {customer.name}
                                </span>
                                <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={2} className="size-3 text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0" />
                                {customer.isDeleteRequested && (
                                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] py-0 px-1.5 font-normal">
                                    Pending Deletion
                                  </Badge>
                                )}
                                {customer.isDeleted && (
                                  <Badge
                                    variant="destructive"
                                    className="text-[10px] py-0 px-1.5 font-normal"
                                  >
                                    Deleted
                                  </Badge>
                                )}
                              </div>
                              {customer.isDeleteRequested &&
                                customer.deleteReason && (
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400 italic truncate max-w-xs">
                                    Reason: "{customer.deleteReason}"
                                  </span>
                                )}
                              {customer.createdBy && (
                                <span className="text-[10px] text-muted-foreground">
                                  Added by {customer.createdBy.firstName}
                                </span>
                              )}
                            </div>
                          </Link>
                        </div>
                      </TableCell>

                      {/* Phone & WhatsApp */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                            <HugeiconsIcon icon={Call02Icon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                            <span className="font-mono text-muted-foreground text-[11px]">
                              {customer.countryCode || "+880"}
                            </span>
                            <span>{customer.phoneNumber}</span>
                          </span>
                          {customer.whatsappNumber && waUrl && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title={`Chat with ${customer.name} on WhatsApp`}
                              className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-mono font-medium"
                            >
                              <WhatsAppIcon className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" />
                              <span>{customer.whatsappNumber}</span>
                            </a>
                          )}
                        </div>
                      </TableCell>

                      {/* Email */}
                      <TableCell className="text-xs text-muted-foreground">
                        {customer.email ? (
                          <span className="inline-flex items-center gap-1.5 truncate max-w-[160px]">
                            <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground/70 shrink-0" />
                            <span className="truncate">{customer.email}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>

                      {/* Address */}
                      <TableCell className="text-xs text-muted-foreground">
                        {customer.address ? (
                          <span className="inline-flex items-center gap-1.5 truncate max-w-[180px]">
                            <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-3.5 text-muted-foreground/70 shrink-0" />
                            <span className="truncate">{customer.address}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>

                      {/* Total Due */}
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border",
                            due > 0 &&
                              "bg-rose-500/10 text-destructive border-destructive/20",
                            due < 0 &&
                              "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                            due === 0 &&
                              "bg-muted text-muted-foreground border-border font-medium",
                          )}
                        >
                          {dueLabel}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Details Link Button */}
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs font-medium text-foreground hover:bg-muted gap-1 cursor-pointer"
                            title="View Details"
                          >
                            <Link href={`/customers/${customer.id}`}>
                              <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                              <span>Details</span>
                            </Link>
                          </Button>

                          {/* Right Sheet Activity Log Trigger */}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Customer Activity Log"
                            onClick={() => handleOpenActivity(customer)}
                            className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <HugeiconsIcon icon={Activity01Icon} strokeWidth={2} className="size-3.5" />
                          </Button>

                          {/* If Deleted (Admin Restore) */}
                          {customer.isDeleted ? (
                            isAdmin && (
                              <ConfirmPopup
                                title="Restore Customer?"
                                description={`Are you sure you want to restore customer record for "${customer.name}"?`}
                                confirmLabel="Restore"
                                destructive={false}
                                loading={isRestoring}
                                onConfirm={() => handleAdminRestore(customer)}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isRestoring}
                                  className="h-7 px-2 text-xs text-primary cursor-pointer"
                                >
                                  <HugeiconsIcon icon={RotateLeft01Icon} strokeWidth={2} className="mr-1 size-3" />
                                  Restore
                                </Button>
                              </ConfirmPopup>
                            )
                          ) : (
                            <>
                              {/* If Pending Deletion & Current User is Admin: Quick Confirm/Reject */}
                              {customer.isDeleteRequested && isAdmin ? (
                                <div className="flex items-center gap-1">
                                  <ConfirmPopup
                                    title="Confirm Deletion Request?"
                                    description={`A cashier requested deletion: "${customer.deleteReason || "No reason specified"}". Confirming will soft-delete this customer.`}
                                    confirmLabel="Confirm Delete"
                                    destructive={true}
                                    loading={isConfirming}
                                    onConfirm={() =>
                                      handleAdminConfirmDelete(customer)
                                    }
                                  >
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      disabled={isConfirming}
                                      className="h-7 px-2 text-xs cursor-pointer"
                                      title="Confirm deletion request"
                                    >
                                      <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="mr-1 size-3" />
                                      Approve
                                    </Button>
                                  </ConfirmPopup>

                                  <ConfirmPopup
                                    title="Reject Deletion Request?"
                                    description={`Reject cashier's request to delete "${customer.name}"?`}
                                    confirmLabel="Reject Request"
                                    destructive={false}
                                    loading={isRejecting}
                                    onConfirm={() =>
                                      handleAdminRejectDelete(customer)
                                    }
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={isRejecting}
                                      className="h-7 px-2 text-xs cursor-pointer"
                                      title="Reject deletion request"
                                    >
                                      <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="mr-1 size-3" />
                                    </Button>
                                  </ConfirmPopup>
                                </div>
                              ) : null}

                              {/* Normal Edit & Delete */}
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Edit Customer"
                                onClick={() => handleOpenEdit(customer)}
                                className="size-7 text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} className="size-3.5" />
                              </Button>

                              {customer.isDeleteRequested && !isAdmin ? (
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
                                      ? "Delete Customer"
                                      : "Request Delete"
                                  }
                                  onClick={() => handleOpenDelete(customer)}
                                  className="size-7 text-muted-foreground hover:text-destructive cursor-pointer"
                                >
                                  <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-3.5" />
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
        </div>
      ) : (
        /* Grid View */
        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="p-4 space-y-3.5 shadow-xs">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full shrink-0" />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-full rounded-md" />
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <div className="pt-2 border-t border-border/50 flex justify-between items-center">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </Card>
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground shadow-xs">
              <div className="flex flex-col items-center justify-center space-y-2">
                <HugeiconsIcon icon={ContactBookIcon} strokeWidth={2} className="size-10 text-muted-foreground/40" />
                <p className="text-base font-semibold text-foreground">
                  No customers found
                </p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  {activeTab === "PENDING_DELETION"
                    ? "No customer deletion requests pending confirmation."
                    : "Try adjusting your filters or click 'Add Customer' to create one."}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {customers.map((customer) => {
                const initials = customer.name
                  ? customer.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                  : "CU";
                const due = Number(customer.totalDue) || 0;
                const dueLabel = formatSignedDue(due);
                const waUrl = getWhatsAppUrl(
                  customer.whatsappNumber || customer.phoneNumber,
                  customer.countryCode,
                );

                return (
                  <Card
                    key={customer.id}
                    className={cn(
                      "overflow-hidden shadow-xs ring-border/60 hover:shadow-md hover:border-primary/50 transition-all flex flex-col justify-between border p-0",
                      isFetching && "opacity-60",
                      customer.isDeleteRequested &&
                        "bg-amber-500/5 border-amber-500/30",
                      customer.isDeleted && "bg-muted/30 opacity-70",
                    )}
                  >
                    <CardContent className="p-4 space-y-3.5 flex flex-col justify-between h-full">
                      {/* Card Top: Avatar, Name, Badges & Actions */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/customers/${customer.id}`}
                            className="group flex items-center gap-2.5 min-w-0 flex-1"
                          >
                            <Avatar className="size-9 border border-border shrink-0 group-hover:border-primary/50 transition-colors">
                              {customer.image && (
                                <AvatarImage
                                  src={customer.image}
                                  alt={customer.name}
                                  className="object-cover"
                                />
                              )}
                              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p
                                  className="font-semibold text-foreground text-sm truncate group-hover:text-primary transition-colors"
                                  title={customer.name}
                                >
                                  {customer.name}
                                </p>
                                <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={2} className="size-3 text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0" />
                              </div>
                              <div className="flex items-center gap-1 flex-wrap mt-0.5">
                                {customer.isDeleteRequested && (
                                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[9px] py-0 px-1 font-normal">
                                    Pending Delete
                                  </Badge>
                                )}
                                {customer.isDeleted && (
                                  <Badge
                                    variant="destructive"
                                    className="text-[9px] py-0 px-1 font-normal"
                                  >
                                    Deleted
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </Link>

                          <div className="flex gap-1.5 items-center shrink-0">
                            {waUrl && (
                              <Button asChild size="icon" variant="default" className="size-7">
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`Chat with ${customer.name} on WhatsApp`}
                                >
                                  <WhatsAppIcon className="size-3.5 shrink-0" />
                                </a>
                              </Button>
                            )}

                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs font-medium text-foreground hover:bg-muted gap-1 cursor-pointer"
                              title="View Details"
                            >
                              <Link href={`/customers/${customer.id}`}>
                                <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="size-3.5 text-muted-foreground" />
                                <span>Details</span>
                              </Link>
                            </Button>

                            {/* Three-Dot Menu Button with all customer actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
                                  title="Actions"
                                >
                                  <HugeiconsIcon icon={MoreVerticalIcon} strokeWidth={2} className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-48 text-xs"
                              >
                                <DropdownMenuItem
                                  asChild
                                  className="cursor-pointer"
                                >
                                  <Link
                                    href={`/customers/${customer.id}`}
                                    className="flex items-center w-full"
                                  >
                                    <HugeiconsIcon icon={ViewIcon} strokeWidth={2} className="mr-2 size-3.5" />
                                    <span>View Details</span>
                                  </Link>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => handleOpenActivity(customer)}
                                  className="cursor-pointer"
                                >
                                  <HugeiconsIcon icon={Activity01Icon} strokeWidth={2} className="mr-2 size-3.5" />
                                  <span>Activity Log</span>
                                </DropdownMenuItem>

                                {!customer.isDeleted && (
                                  <DropdownMenuItem
                                    onClick={() => handleOpenEdit(customer)}
                                    className="cursor-pointer"
                                  >
                                    <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} className="mr-2 size-3.5" />
                                    <span>Edit Customer</span>
                                  </DropdownMenuItem>
                                )}

                                <DropdownMenuSeparator />

                                {customer.isDeleted ? (
                                  isAdmin && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleAdminRestore(customer)
                                      }
                                      className="text-primary cursor-pointer"
                                    >
                                      <HugeiconsIcon icon={RotateLeft01Icon} strokeWidth={2} className="mr-2 size-3.5" />
                                      <span>Restore Customer</span>
                                    </DropdownMenuItem>
                                  )
                                ) : customer.isDeleteRequested && isAdmin ? (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleAdminConfirmDelete(customer)
                                      }
                                      className="text-destructive cursor-pointer"
                                    >
                                      <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="mr-2 size-3.5" />
                                      <span>Confirm Delete</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleAdminRejectDelete(customer)
                                      }
                                      className="cursor-pointer"
                                    >
                                      <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="mr-2 size-3.5" />
                                      <span>Reject Request</span>
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleOpenDelete(customer)}
                                    className="text-destructive cursor-pointer"
                                  >
                                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="mr-2 size-3.5" />
                                    <span>
                                      {isAdmin
                                        ? "Delete Customer"
                                        : "Request Delete"}
                                    </span>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Delete reason notice if pending */}
                        {customer.isDeleteRequested &&
                          customer.deleteReason && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 italic bg-amber-500/10 p-1.5 rounded-md truncate">
                              "{customer.deleteReason}"
                            </p>
                          )}
                      </div>

                      {/* Card Middle: Contact & WhatsApp Message Button */}
                      <div className="space-y-2 text-xs pt-1 border-t border-border/50">
                        {/* Primary Phone */}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <HugeiconsIcon icon={Call02Icon} strokeWidth={2} className="size-3.5 shrink-0 text-muted-foreground/70" />
                          <span className="font-mono text-[11px] text-foreground">
                            {customer.countryCode || "+880"}{" "}
                            {customer.phoneNumber}
                          </span>
                        </div>

                        {/* WhatsApp Message Action Button */}

                        {/* Email */}
                        {customer.email && (
                          <div className="flex items-center gap-2 text-muted-foreground truncate">
                            <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} className="size-3.5 shrink-0 text-muted-foreground/70" />
                            <span className="truncate">{customer.email}</span>
                          </div>
                        )}

                        {/* Address */}
                        {customer.address && (
                          <div className="flex items-center gap-2 text-muted-foreground truncate">
                            <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-3.5 shrink-0 text-muted-foreground/70" />
                            <span className="truncate">{customer.address}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Bottom: Financials & Audit */}
                      <div className="pt-2 border-t border-border/50 flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                            Total Due
                          </span>
                          <span
                            className={cn(
                              "font-mono font-bold text-xs mt-0.5",
                              due > 0 && "text-rose-600 dark:text-rose-400",
                              due < 0 &&
                                "text-emerald-600 dark:text-emerald-400",
                              due === 0 && "text-muted-foreground",
                            )}
                          >
                            {dueLabel}
                          </span>
                        </div>
                        {customer.createdBy && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-[120px] text-right">
                            by {customer.createdBy.firstName}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Shared Pagination Footer */}
      {meta && meta.totalPage > 1 && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-xs">
          <p className="text-xs text-muted-foreground">
            Showing {(meta.page - 1) * meta.limit + 1} to{" "}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}{" "}
            customers
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isFetching}
              className="h-8 px-2.5 text-xs cursor-pointer"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} className="mr-1 size-3.5" />
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
              className="h-8 px-2.5 text-xs cursor-pointer"
            >
              Next
              <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} className="ml-1 size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals and Sheets */}
      <CustomerFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        customerToEdit={customerToEdit}
      />

      <CustomerActivitySheet
        open={activitySheetOpen}
        onOpenChange={setActivitySheetOpen}
        customer={selectedCustomerForActivity}
      />

      <CustomerDeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        customer={customerToDelete}
      />
    </div>
  );
}
