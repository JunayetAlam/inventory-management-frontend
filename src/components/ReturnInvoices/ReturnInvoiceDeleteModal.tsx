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
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, SecurityWarningIcon } from "@hugeicons/core-free-icons";
import { useDeleteReturnInvoiceMutation } from "@/redux/api/returnInvoiceApi";
import useIsAdmin from "@/hooks/useIsAdmin";
import { TReturnInvoice } from "@/types";
import { errorMessageGenerator } from "@/utils/errorMessageGenerator";

interface ReturnInvoiceDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnInvoice: TReturnInvoice | null;
  onSuccess?: () => void;
}

export default function ReturnInvoiceDeleteModal({
  open,
  onOpenChange,
  returnInvoice,
  onSuccess,
}: ReturnInvoiceDeleteModalProps) {
  const [isAdmin] = useIsAdmin();
  const [reason, setReason] = useState("");
  const [deleteReturnInvoice, { isLoading }] = useDeleteReturnInvoiceMutation();

  if (!returnInvoice) return null;

  const handleDelete = async () => {
    try {
      const res = await deleteReturnInvoice({
        id: returnInvoice.id,
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
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="size-5 text-rose-600" />
              ) : (
                <HugeiconsIcon icon={SecurityWarningIcon} strokeWidth={2} className="size-5 text-amber-600" />
              )}
            </div>
            <DialogTitle className="text-base font-semibold text-foreground">
              {isAdmin
                ? "Confirm Return Invoice Deletion"
                : "Request Return Invoice Deletion"}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-xs text-muted-foreground leading-relaxed">
            {isAdmin
              ? `Delete Return "${returnInvoice.returnNumber}"? Inventory will be adjusted (returned stock deducted back).`
              : `Submit a deletion request for Return "${returnInvoice.returnNumber}". An administrator will review it.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {!isAdmin && (
            <div className="space-y-1.5">
              <label
                htmlFor="return-delete-reason"
                className="text-xs font-medium text-foreground"
              >
                Reason (optional)
              </label>
              <Textarea
                id="return-delete-reason"
                placeholder="e.g. Created by mistake"
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
                  ? "Delete Return Invoice"
                  : "Submit Deletion Request"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
