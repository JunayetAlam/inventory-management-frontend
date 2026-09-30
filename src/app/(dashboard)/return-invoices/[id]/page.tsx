"use client";

import { Suspense, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, File02Icon, PrinterIcon, PencilEdit02Icon, Delete02Icon, RotateLeft01Icon, Tick02Icon, Cancel01Icon, Activity01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import {
  useGetReturnInvoiceByIdQuery,
  useConfirmDeleteReturnInvoiceMutation,
  useRejectDeleteReturnInvoiceMutation,
  useRestoreReturnInvoiceMutation,
} from "@/redux/api/returnInvoiceApi";
import useIsAdmin from "@/hooks/useIsAdmin";
import ReturnInvoiceForm from "@/components/ReturnInvoices/ReturnInvoiceForm";
import ReturnInvoiceStatusDropdown from "@/components/ReturnInvoices/ReturnInvoiceStatusDropdown";
import ReturnInvoiceDeleteModal from "@/components/ReturnInvoices/ReturnInvoiceDeleteModal";
import ReturnInvoiceActivitySheet from "@/components/ReturnInvoices/ReturnInvoiceActivitySheet";
import ConfirmPopup from "@/components/Global/ConfirmPopup";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { errorMessageGenerator } from "@/utils/errorMessageGenerator";

export default function ReturnInvoiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [isAdmin] = useIsAdmin();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activitySheetOpen, setActivitySheetOpen] = useState(false);

  const { data, isLoading, isError } = useGetReturnInvoiceByIdQuery(id, {
    skip: !id,
  });
  const returnInvoice = data?.data;

  const [confirmDelete, { isLoading: isConfirming }] =
    useConfirmDeleteReturnInvoiceMutation();
  const [rejectDelete, { isLoading: isRejecting }] =
    useRejectDeleteReturnInvoiceMutation();
  const [restoreReturn, { isLoading: isRestoring }] =
    useRestoreReturnInvoiceMutation();

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !returnInvoice) {
    return (
      <div className="p-6 max-w-md mx-auto text-center space-y-3">
        <p className="text-destructive font-semibold">
          Return invoice not found
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
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto relative">
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
              Manage Return Invoices
            </h1>
            <span className="font-mono text-xs text-muted-foreground">
              Return Invoice #{returnInvoice.returnNumber}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Change Dropdown */}
          <ReturnInvoiceStatusDropdown returnInvoice={returnInvoice} />

          {/* View Invoice / Print Invoice */}
          {!returnInvoice.isDeleted && (
            <>
              <Link href={`/return-invoices/${returnInvoice.id}/invoice`}>
                <Button
                  variant="outline"
                  size="sm"
                  title="View Invoice"
                  className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <HugeiconsIcon icon={File02Icon} strokeWidth={2} className="size-3.5" /> View Invoice
                </Button>
              </Link>
              <Link
                href={`/return-invoices/${returnInvoice.id}/invoice?print=1`}
              >
                <Button
                  variant="outline"
                  size="sm"
                  title="Print Invoice"
                  className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <HugeiconsIcon icon={PrinterIcon} strokeWidth={2} className="size-3.5" /> Print Invoice
                </Button>
              </Link>
            </>
          )}

          {/* Activity Log Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActivitySheetOpen(true)}
            className="h-8 gap-1.5 text-xs font-medium cursor-pointer"
            title="Return Invoice Activity Log"
          >
            <HugeiconsIcon icon={Activity01Icon} strokeWidth={2} className="size-3.5" />
            Activity Log
          </Button>

          {/* Edit return invoice if allowed */}
          {!returnInvoice.isDeleted &&
            (isAdmin || returnInvoice.status !== "APPROVED") &&
            returnInvoice.isLatest !== false && (
              <Link href={`/return-invoices/${returnInvoice.id}/edit`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs font-medium"
                >
                  <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} className="size-3.5" /> Edit
                </Button>
              </Link>
            )}

          {/* Deletion & Restoration Actions */}
          {isAdmin && returnInvoice.isDeleteRequested ? (
            <div className="flex items-center gap-1.5 border-l border-border pl-1.5 ml-1">
              <ConfirmPopup
                title="Approve Deletion Request?"
                description={`Confirm deletion of Return Invoice "${returnInvoice.returnNumber}"? Stock will be adjusted.`}
                confirmLabel="Confirm Delete"
                destructive={true}
                loading={isConfirming}
                onConfirm={async () => {
                  try {
                    await confirmDelete(returnInvoice.id).unwrap();
                    toast.success("Return invoice deletion confirmed");
                    router.push("/return-invoices");
                  } catch (err) {
                    toast.error(errorMessageGenerator(err));
                  }
                }}
              >
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 px-2.5 text-xs font-medium gap-1"
                >
                  <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3.5" /> Delete
                </Button>
              </ConfirmPopup>
              <ConfirmPopup
                title="Reject Deletion Request?"
                description={`Reject deletion request for "${returnInvoice.returnNumber}"?`}
                confirmLabel="Reject"
                destructive={false}
                loading={isRejecting}
                onConfirm={async () => {
                  try {
                    await rejectDelete(returnInvoice.id).unwrap();
                    toast.success("Deletion request rejected");
                  } catch (err) {
                    toast.error(errorMessageGenerator(err));
                  }
                }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted gap-1"
                >
                  <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3.5" /> Reject
                </Button>
              </ConfirmPopup>
            </div>
          ) : returnInvoice.isDeleted && isAdmin ? (
            returnInvoice.canRestore !== false ? (
              <ConfirmPopup
                title="Restore Return Invoice?"
                description={`Restore deleted Return "${returnInvoice.returnNumber}"? Stock will be restored again.`}
                confirmLabel="Restore Return"
                destructive={false}
                loading={isRestoring}
                onConfirm={async () => {
                  try {
                    await restoreReturn(returnInvoice.id).unwrap();
                    toast.success("Return invoice restored successfully");
                  } catch (err) {
                    toast.error(errorMessageGenerator(err));
                  }
                }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs font-medium text-primary border-primary/40 hover:bg-primary/10 gap-1.5"
                >
                  <HugeiconsIcon icon={RotateLeft01Icon} strokeWidth={2} className="size-3.5" /> Restore
                </Button>
              </ConfirmPopup>
            ) : (
              <span
                className="text-xs text-muted-foreground italic px-2"
                title="Cannot restore: a newer return exists on this invoice"
              >
                Restore locked (newer return exists)
              </span>
            )
          ) : (
            !returnInvoice.isDeleted && (
              returnInvoice.isDeleteRequested && !isAdmin ? (
                <Badge
                  variant="secondary"
                  className="h-8 px-2.5 text-xs text-amber-600 bg-amber-500/10 cursor-not-allowed"
                >
                  Delete Requested
                </Badge>
              ) : (
                (isAdmin || returnInvoice.status !== "APPROVED") &&
                returnInvoice.isLatest !== false && (
                  <Button
                    variant="outline"
                    size="sm"
                    title={isAdmin ? "Delete Return Invoice" : "Request Delete"}
                    onClick={() => setDeleteModalOpen(true)}
                    className="h-8 gap-1.5 text-xs font-medium text-destructive border-destructive/30 hover:bg-destructive/10 cursor-pointer"
                  >
                    <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-3.5" />
                    {isAdmin ? "Delete" : "Request Delete"}
                  </Button>
                )
              )
            )
          )}
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <ReturnInvoiceForm initialData={returnInvoice} isDetails />
      </Suspense>

      <ReturnInvoiceDeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        returnInvoice={returnInvoice}
        onSuccess={() => router.push("/return-invoices")}
      />

      <ReturnInvoiceActivitySheet
        open={activitySheetOpen}
        onOpenChange={setActivitySheetOpen}
        returnInvoice={returnInvoice}
      />
    </div>
  );
}
