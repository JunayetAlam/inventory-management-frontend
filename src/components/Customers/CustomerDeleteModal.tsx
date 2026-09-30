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
import { useDeleteCustomerMutation } from "@/redux/api/customerApi";
import useIsAdmin from "@/hooks/useIsAdmin";
import { TCustomer } from "@/types";
import { errorMessageGenerator } from "@/utils/errorMessageGenerator";

interface CustomerDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: TCustomer | null;
  onSuccess?: () => void;
}

export default function CustomerDeleteModal({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerDeleteModalProps) {
  const [isAdmin] = useIsAdmin();
  const [reason, setReason] = useState("");
  const [deleteCustomer, { isLoading }] = useDeleteCustomerMutation();

  if (!customer) return null;

  const handleDelete = async () => {
    try {
      const res = await deleteCustomer({
        id: customer.id,
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
              {isAdmin ? "Delete Customer" : "Request Customer Deletion"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            {isAdmin ? (
              <>
                Are you sure you want to soft-delete <strong>{customer.name}</strong>?
                You can undo and restore this customer record anytime from the archived tab.
              </>
            ) : (
              <>
                As a cashier, deleting <strong>{customer.name}</strong> requires
                administrator confirmation. An alert will be sent to admins for approval.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {!isAdmin && (
          <div className="space-y-2 py-2">
            <label className="text-xs font-medium text-foreground">
              Reason for deletion (Optional):
            </label>
            <Textarea
              placeholder="e.g. Inactive customer, duplicate number, requested removal..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="text-xs"
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="text-xs"
          >
            {isLoading
              ? "Submitting..."
              : isAdmin
                ? "Confirm Delete"
                : "Submit Deletion Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
