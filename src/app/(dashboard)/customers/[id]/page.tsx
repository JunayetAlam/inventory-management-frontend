"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, PencilEdit02Icon, Delete02Icon, RotateLeft01Icon, Activity01Icon, FileDownloadIcon, Tick02Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import {
  useGetCustomerByIdQuery,
  useConfirmDeleteCustomerMutation,
  useRejectDeleteCustomerMutation,
  useRestoreCustomerMutation,
} from "@/redux/api/customerApi";
import useIsAdmin from "@/hooks/useIsAdmin";
import CustomerPersonalInfoCard from "@/components/Customers/CustomerProfile/CustomerPersonalInfoCard";
import CustomerProfileStatsCards from "@/components/Customers/CustomerProfile/CustomerProfileStatsCards";
import CustomerProfileTransactions from "@/components/Customers/CustomerProfile/CustomerProfileTransactions";
import CustomerFormModal from "@/components/Customers/CustomerFormModal";
import CustomerActivitySheet from "@/components/Customers/CustomerActivitySheet";
import CustomerDeleteModal from "@/components/Customers/CustomerDeleteModal";
import ConfirmPopup from "@/components/Global/ConfirmPopup";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessageGenerator } from "@/utils/errorMessageGenerator";

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [isAdmin] = useIsAdmin();

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activitySheetOpen, setActivitySheetOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Queries & Mutations
  const { data, isLoading, isError } = useGetCustomerByIdQuery(id, {
    skip: !id,
  });
  const customer = data?.data;

  const [confirmDelete, { isLoading: isConfirming }] =
    useConfirmDeleteCustomerMutation();
  const [rejectDelete, { isLoading: isRejecting }] =
    useRejectDeleteCustomerMutation();
  const [restoreCustomer, { isLoading: isRestoring }] =
    useRestoreCustomerMutation();

  const handleAdminConfirmDelete = async () => {
    if (!customer) return;
    try {
      await confirmDelete(customer.id).unwrap();
      toast.success(`Customer "${customer.name}" deletion confirmed.`);
      router.push("/customers");
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    }
  };

  const handleAdminRejectDelete = async () => {
    if (!customer) return;
    try {
      await rejectDelete(customer.id).unwrap();
      toast.success(
        `Deletion request for customer "${customer.name}" was rejected.`
      );
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    }
  };

  const handleAdminRestore = async () => {
    if (!customer) return;
    try {
      await restoreCustomer(customer.id).unwrap();
      toast.success(`Customer "${customer.name}" restored successfully.`);
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="size-8 cursor-pointer"
            title="Go Back"
            onClick={() => router.back()}
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Manage Customers
            </h1>
            {customer && (
              <span className="text-xs text-muted-foreground font-mono">
                Customer Profile • {customer.name}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        {customer && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Customer Activity Log */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActivitySheetOpen(true)}
              className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
              title="Customer Activity Log"
            >
              <HugeiconsIcon icon={Activity01Icon} strokeWidth={2} className="size-3.5" />
              Activity Log
            </Button>

            {/* Export Transactions */}
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
              title="Export Customer Transactions"
            >
              <Link href={`/customer-transactions/export?customerId=${customer.id}`}>
                <HugeiconsIcon icon={FileDownloadIcon} strokeWidth={2} className="size-3.5" />
                Export Transactions
              </Link>
            </Button>

            {/* Edit Customer */}
            {!customer.isDeleted && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(true)}
                className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
              >
                <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} className="size-3.5" />
                Edit
              </Button>
            )}

            {/* Deletion & Restoration Actions */}
            {customer.isDeleted ? (
              isAdmin && (
                <ConfirmPopup
                  title="Restore Customer?"
                  description={`Are you sure you want to restore "${customer.name}"?`}
                  confirmLabel="Restore"
                  destructive={false}
                  loading={isRestoring}
                  onConfirm={handleAdminRestore}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 text-xs font-medium text-primary border-primary/40 hover:bg-primary/10 cursor-pointer"
                  >
                    <HugeiconsIcon icon={RotateLeft01Icon} strokeWidth={2} className="size-3.5" />
                    Restore Customer
                  </Button>
                </ConfirmPopup>
              )
            ) : customer.isDeleteRequested ? (
              isAdmin ? (
                <div className="flex items-center gap-1.5 border-l border-border pl-1.5 ml-1">
                  <ConfirmPopup
                    title="Confirm Deletion Request?"
                    description={`Confirm deletion of customer "${customer.name}"? Reason: "${customer.deleteReason || "None"}"`}
                    confirmLabel="Confirm Delete"
                    destructive={true}
                    loading={isConfirming}
                    onConfirm={handleAdminConfirmDelete}
                  >
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 px-2.5 text-xs font-medium gap-1 cursor-pointer"
                    >
                      <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3.5" /> Confirm Delete
                    </Button>
                  </ConfirmPopup>
                  <ConfirmPopup
                    title="Reject Deletion Request?"
                    description={`Reject deletion request for "${customer.name}"?`}
                    confirmLabel="Reject"
                    destructive={false}
                    loading={isRejecting}
                    onConfirm={handleAdminRejectDelete}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer gap-1"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3.5" /> Reject
                    </Button>
                  </ConfirmPopup>
                </div>
              ) : (
                <Badge
                  variant="secondary"
                  className="h-8 px-2.5 text-xs text-amber-600 bg-amber-500/10 cursor-not-allowed"
                >
                  Delete Requested
                </Badge>
              )
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteModalOpen(true)}
                className="h-8 gap-1.5 text-xs font-medium text-destructive border-destructive/30 hover:bg-destructive/10 cursor-pointer"
              >
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-3.5" />
                {isAdmin ? "Delete" : "Request Delete"}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        </div>
      ) : isError || !customer ? (
        <div className="p-12 text-center space-y-4 rounded-xl border border-destructive/30 bg-destructive/5">
          <p className="text-destructive font-semibold text-base">
            Customer not found or failed to load
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="gap-2 cursor-pointer"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} className="size-4" />
            <span className="hidden sm:inline">Go Back</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Section: Customer Personal Details */}
          <CustomerPersonalInfoCard customer={customer} />

          {/* 4 Financial Stat Cards */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Financial Overview & Transaction Stats
            </h3>
            <CustomerProfileStatsCards customerId={customer.id} />
          </div>

          {/* Customer Transactions (Timeline & Table Views with Toggler) */}
          <CustomerProfileTransactions customerId={customer.id} />
        </div>
      )}

      {/* Edit Customer Modal */}
      {customer && (
        <CustomerFormModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          customerToEdit={customer}
        />
      )}

      {/* Activity Log Sheet */}
      {customer && (
        <CustomerActivitySheet
          open={activitySheetOpen}
          onOpenChange={setActivitySheetOpen}
          customer={customer}
        />
      )}

      {/* Delete / Request Delete Modal */}
      {customer && (
        <CustomerDeleteModal
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          customer={customer}
          onSuccess={() => router.push("/customers")}
        />
      )}
    </div>
  );
}
