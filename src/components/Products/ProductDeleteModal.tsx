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
import { useDeleteProductMutation } from "@/redux/api/productApi";
import useIsAdmin from "@/hooks/useIsAdmin";
import { TProduct } from "@/types";
import { errorMessageGenerator } from "@/utils/errorMessageGenerator";

interface ProductDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: TProduct | null;
}

export default function ProductDeleteModal({
  open,
  onOpenChange,
  product,
}: ProductDeleteModalProps) {
  const [isAdmin] = useIsAdmin();
  const [reason, setReason] = useState("");
  const [deleteProduct, { isLoading }] = useDeleteProductMutation();

  if (!product) return null;

  const handleDelete = async () => {
    try {
      const res = await deleteProduct({
        id: product.id,
        reason: reason.trim() || undefined,
      }).unwrap();
      toast.success(res.message || "Action processed successfully");
      setReason("");
      onOpenChange(false);
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
              {isAdmin ? "Delete Product" : "Request Product Deletion"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            {isAdmin ? (
              <>
                Are you sure you want to soft-delete <strong>{product.name}</strong>?
                You can undo and restore this product anytime from the archived tab.
              </>
            ) : (
              <>
                As a cashier, deleting <strong>{product.name}</strong> requires
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
              placeholder="e.g. Expired stock, duplicate item, discontinued..."
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
