"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Printer,
  Pencil,
  Trash2,
  RotateCcw,
  Check,
  X,
  Save,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetInvoiceByIdQuery,
  useConfirmDeleteInvoiceMutation,
  useRejectDeleteInvoiceMutation,
  useRestoreInvoiceMutation,
} from "@/redux/api/invoiceApi";
import useIsAdmin from "@/hooks/useIsAdmin";
import InvoiceForm from "@/components/Invoices/InvoiceForm";
import InvoiceStatusDropdown from "@/components/Invoices/InvoiceStatusDropdown";
import InvoiceDeleteModal from "@/components/Invoices/InvoiceDeleteModal";
import InvoiceActivitySheet from "@/components/Invoices/InvoiceActivitySheet";
import ConfirmPopup from "@/components/Global/ConfirmPopup";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { errorMessageGenerator } from "@/utils/errorMessageGenerator";

export default function InvoiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [isAdmin] = useIsAdmin();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activitySheetOpen, setActivitySheetOpen] = useState(false);

  const { data, isLoading, isError } = useGetInvoiceByIdQuery(id, {
    skip: !id,
  });
  const invoice = data?.data;

  const [confirmDelete, { isLoading: isConfirming }] =
    useConfirmDeleteInvoiceMutation();
  const [rejectDelete, { isLoading: isRejecting }] =
    useRejectDeleteInvoiceMutation();
  const [restoreInvoice, { isLoading: isRestoring }] =
    useRestoreInvoiceMutation();

  const handleAdminConfirmDelete = async () => {
    if (!invoice) return;
    try {
      await confirmDelete(invoice.id).unwrap();
      toast.success(
        `Invoice ${invoice.invoiceNumber} deletion confirmed. Stock restored.`
      );
      router.push("/invoices");
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    }
  };

  const handleAdminRejectDelete = async () => {
    if (!invoice) return;
    try {
      await rejectDelete(invoice.id).unwrap();
      toast.success(
        `Deletion request for Invoice ${invoice.invoiceNumber} rejected.`
      );
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    }
  };

  const handleAdminRestore = async () => {
    if (!invoice) return;
    try {
      const res: any = await restoreInvoice(invoice.id).unwrap();
      toast.success(`Invoice ${invoice.invoiceNumber} restored successfully.`);
      if (res?.data?.warnings && res.data.warnings.length > 0) {
        res.data.warnings.forEach((w: string) => toast.warning(w));
      }
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto relative">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="size-8 cursor-pointer"
            title="Go Back"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Manage Invoices
            </h1>
            {invoice && (
              <span className="font-mono text-xs text-muted-foreground">
                Invoice #{invoice.invoiceNumber}
              </span>
            )}
          </div>
        </div>

        {invoice && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Change Dropdown */}
            <InvoiceStatusDropdown invoice={invoice} />

            {/* View Invoice / Print Invoice */}
            {!invoice.isDeleted && (
              <>
                <Link href={`/invoices/${invoice.id}/invoice`}>
                  <Button
                    variant="outline"
                    size="sm"
                    title="View Invoice"
                    className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    <FileText className="size-3.5" /> View Invoice
                  </Button>
                </Link>
                <Link href={`/invoices/${invoice.id}/invoice?print=1`}>
                  <Button
                    variant="outline"
                    size="sm"
                    title="Print Invoice"
                    className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    <Printer className="size-3.5" /> Print Invoice
                  </Button>
                </Link>
                <Link href={`/return-invoices/create?invoiceId=${invoice.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    title="Create Return Invoice"
                    className="h-8 gap-1.5 text-xs font-medium"
                  >
                    <RotateCcw className="size-3.5" /> Create Return
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
              title="Invoice Activity Log"
            >
              <Activity className="size-3.5" />
              Activity Log
            </Button>

            {/* Edit invoice if allowed */}
            {!invoice.isDeleted && (isAdmin || invoice.status !== "APPROVED") && (
              <Link href={`/invoices/${invoice.id}/edit`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs font-medium"
                >
                  <Pencil className="size-3.5" /> Edit
                </Button>
              </Link>
            )}

            {/* Deletion & Restoration Actions */}
            {isAdmin && invoice.isDeleteRequested ? (
              <div className="flex items-center gap-1.5 border-l border-border pl-1.5 ml-1">
                <ConfirmPopup
                  title="Approve Deletion Request?"
                  description={`Confirm deletion of Invoice "${invoice.invoiceNumber}"? Stock will be restored.`}
                  confirmLabel="Confirm Delete"
                  destructive={true}
                  loading={isConfirming}
                  onConfirm={handleAdminConfirmDelete}
                >
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 px-2.5 text-xs font-medium gap-1"
                  >
                    <Check className="size-3.5" /> Delete
                  </Button>
                </ConfirmPopup>
                <ConfirmPopup
                  title="Reject Deletion Request?"
                  description={`Reject deletion request for "${invoice.invoiceNumber}"?`}
                  confirmLabel="Reject"
                  destructive={false}
                  loading={isRejecting}
                  onConfirm={handleAdminRejectDelete}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted gap-1"
                  >
                    <X className="size-3.5" /> Reject
                  </Button>
                </ConfirmPopup>
              </div>
            ) : invoice.isDeleted && isAdmin ? (
              <ConfirmPopup
                title="Restore Invoice?"
                description={`Restore deleted Invoice "${invoice.invoiceNumber}"? Stock will be re-deducted.`}
                confirmLabel="Restore Invoice"
                destructive={false}
                loading={isRestoring}
                onConfirm={handleAdminRestore}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs font-medium text-primary border-primary/40 hover:bg-primary/10 gap-1.5"
                >
                  <RotateCcw className="size-3.5" /> Restore
                </Button>
              </ConfirmPopup>
            ) : (
              !invoice.isDeleted && (
                invoice.isDeleteRequested && !isAdmin ? (
                  <Badge
                    variant="secondary"
                    className="h-8 px-2.5 text-xs text-amber-600 bg-amber-500/10 cursor-not-allowed"
                  >
                    Delete Requested
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    title={isAdmin ? "Delete Invoice" : "Request Delete"}
                    onClick={() => setDeleteModalOpen(true)}
                    className="h-8 gap-1.5 text-xs font-medium text-destructive border-destructive/30 hover:bg-destructive/10 cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                    {isAdmin ? "Delete" : "Request Delete"}
                  </Button>
                )
              )
            )}
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : isError || !invoice ? (
        <div className="p-8 text-center space-y-4 rounded-xl border border-destructive/30 bg-destructive/5">
          <p className="text-destructive font-semibold">
            Invoice not found or failed to load
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="gap-2 cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Go Back</span>
          </Button>
        </div>
      ) : (
        <>
          <InvoiceForm initialData={invoice} isEditing={true} isDetails={true} />

          {(invoice.returnInvoices || []).filter((r) => !r.isDeleted).length >
            0 && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold">Return Invoices</h2>
                <Link
                  href={`/return-invoices/create?invoiceId=${invoice.id}`}
                  className="text-xs text-primary hover:underline"
                >
                  + New return
                </Link>
              </div>
              <div className="divide-y border rounded-lg overflow-hidden">
                {(invoice.returnInvoices || [])
                  .filter((r) => !r.isDeleted)
                  .map((ret) => (
                    <div
                      key={ret.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2.5 text-xs bg-background"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/return-invoices/${ret.id}`}
                          className="font-mono font-semibold text-primary hover:underline"
                        >
                          {ret.returnNumber}
                        </Link>
                        <p className="text-muted-foreground mt-0.5 truncate">
                          {(ret.items || [])
                            .map((it) => `${it.productName} × ${it.quantity}`)
                            .join(", ") || "No items"}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono font-semibold">
                          ৳{Number(ret.totalAmount).toFixed(2)}
                        </span>
                        <Link href={`/return-invoices/${ret.id}/invoice`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[11px]"
                          >
                            Invoice
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Delete / Request Delete Modal */}
      <InvoiceDeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        invoice={invoice ?? null}
        onSuccess={() => router.push("/invoices")}
      />

      <InvoiceActivitySheet
        open={activitySheetOpen}
        onOpenChange={setActivitySheetOpen}
        invoice={invoice ?? null}
      />
    </div>
  );
}
