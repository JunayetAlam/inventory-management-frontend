"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, ShieldAlert } from "lucide-react";
import { useDeleteInvoiceMutation } from "@/redux/api/invoiceApi";
import useIsAdmin from "@/hooks/useIsAdmin";
import { TInvoice } from "@/types";
import { errorMessageGenerator } from "@/utils/errorMessageGenerator";

interface InvoiceDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: TInvoice | null;
  onSuccess?: () => void;
}

export default function InvoiceDeleteModal({
  open,
  onOpenChange,
  invoice,
  onSuccess,
}: InvoiceDeleteModalProps) {
  const [isAdmin] = useIsAdmin();
  const [reason, setReason] = useState("");
  const [deleteInvoice, { isLoading }] = useDeleteInvoiceMutation();

  if (!invoice) return null;

  const handleDelete = async () => {
    try {
      const res = await deleteInvoice({
        id: invoice.id,
        reason: reason.trim() || undefined,
      }).unwrap();
      toast.success(res.message || "Action processed successfully");
      setReason("");
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <div className="flex items-center gap-2.5 text-destructive">
            <div className="flex size-9 items-center justify-center rounded-full bg-rose-500/10">
              {isAdmin ? (
                <Trash2 className="size-5 text-rose-600" />
              ) : (
                <ShieldAlert className="size-5 text-amber-600" />
              )}
            </div>
            <DialogTitle className="text-base font-semibold text-foreground">
              {isAdmin ? "Confirm Invoice Deletion" : "Request Invoice Deletion"}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-xs text-muted-foreground leading-relaxed">
            {isAdmin
              ? `Are you sure you want to delete Invoice "${invoice.invoiceNumber}"? This will soft-delete the invoice and automatically restore product stock.`
              : `You are submitting a deletion request for Invoice "${invoice.invoiceNumber}". An administrator will review and confirm this request.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {!isAdmin && (
            <div className="space-y-1.5">
              <label htmlFor="delete-reason" className="text-xs font-medium text-foreground">
                Reason for deletion request (Optional)
              </label>
              <Textarea
                id="delete-reason"
                placeholder="e.g. Mistake in bill / order canceled by customer"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="text-xs"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={isAdmin ? "destructive" : "default"}
              size="sm"
              disabled={isLoading}
              onClick={handleDelete}
            >
              {isLoading
                ? "Processing..."
                : isAdmin
                ? "Delete Invoice"
                : "Submit Deletion Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
