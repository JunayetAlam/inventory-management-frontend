"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HugeiconsIcon } from "@hugeicons/react";
import { Money03Icon, PencilEdit02Icon, Loading03Icon, Calendar03Icon } from "@hugeicons/core-free-icons";
import {
  useAddPaymentMutation,
  useUpdatePaymentMutation,
} from "@/redux/api/invoiceApi";
import { toast } from "sonner";
import { errorMessageGenerator } from "@/utils/errorMessageGenerator";
import { TInvoice, TInvoicePayment } from "@/types";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentToEdit?: TInvoicePayment | null;
  onSuccess?: (updatedInvoice: TInvoice) => void;
}

// Format ISO string or Date to "YYYY-MM-DDTHH:mm" for datetime-local input
const toDateTimeLocalString = (isoString?: string | Date | null): string => {
  const d = isoString ? new Date(isoString) : new Date();
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function PaymentModal({
  open,
  onOpenChange,
  invoiceId,
  invoiceNumber,
  totalAmount,
  paidAmount,
  dueAmount,
  paymentToEdit,
  onSuccess,
}: PaymentModalProps) {
  const isEditingPayment = Boolean(paymentToEdit);
  const [addPayment, { isLoading: isAdding }] = useAddPaymentMutation();
  const [updatePayment, { isLoading: isUpdating }] = useUpdatePaymentMutation();
  const isSubmitting = isAdding || isUpdating;

  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Maximum allowed for the input
  const maxAllowed = isEditingPayment
    ? Math.round((dueAmount + (paymentToEdit?.amount || 0)) * 100) / 100
    : dueAmount;

  useEffect(() => {
    if (open) {
      if (paymentToEdit) {
        setAmount(String(paymentToEdit.amount));
        setDate(toDateTimeLocalString(paymentToEdit.createdAt));
        setNote(paymentToEdit.note || "");
      } else {
        setAmount(dueAmount > 0 ? String(dueAmount) : "");
        setDate(toDateTimeLocalString(new Date()));
        setNote("");
      }
      setError("");
    }
  }, [open, paymentToEdit, dueAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError("");

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid positive payment amount");
      return;
    }

    if (numAmount > maxAllowed) {
      setError(`Payment cannot exceed the maximum payable amount of ৳${maxAllowed}`);
      return;
    }

    try {
      let resultInvoice: TInvoice | undefined;

      if (isEditingPayment && paymentToEdit) {
        const res = await updatePayment({
          invoiceId,
          paymentId: paymentToEdit.id,
          amount: numAmount,
          note: note.trim() || null,
          date: date ? new Date(date).toISOString() : null,
        }).unwrap();
        toast.success(`Payment updated to ৳${numAmount} successfully!`);
        resultInvoice = res?.data?.invoice;
      } else {
        const res = await addPayment({
          id: invoiceId,
          amount: numAmount,
          note: note.trim() || null,
          date: date ? new Date(date).toISOString() : null,
        }).unwrap();
        toast.success(`Payment of ৳${numAmount} recorded successfully!`);
        resultInvoice = res?.data?.invoice;
      }

      if (resultInvoice && onSuccess) {
        onSuccess(resultInvoice);
      }
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            {isEditingPayment ? (
              <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} className="size-5 text-primary" />
            ) : (
              <HugeiconsIcon icon={Money03Icon} strokeWidth={2} className="size-5 text-primary" />
            )}
            {isEditingPayment ? "Edit Payment" : "Add Due Payment"}
          </DialogTitle>
        </DialogHeader>

        {/* Invoice Financial Overview */}
        <div className="rounded-xl border border-border/70 bg-muted/30 p-3.5 space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Invoice Number:</span>
            <span className="font-mono font-semibold text-foreground">{invoiceNumber}</span>
          </div>
          <div className="flex justify-between items-center border-t border-border/40 pt-2">
            <span className="text-muted-foreground">Total Bill:</span>
            <span className="font-medium text-foreground">৳{totalAmount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Currently Paid:</span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">৳{paidAmount}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-semibold border-t border-border/40 pt-2">
            <span className="text-destructive">Remaining Due:</span>
            <span className="font-mono text-destructive">৳{dueAmount}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Amount input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="modal-payment-amount">Payment Amount (৳) *</Label>
              <span className="text-[11px] text-muted-foreground">
                Max: ৳{maxAllowed}
              </span>
            </div>
            <Input
              id="modal-payment-amount"
              type="number"
              step="0.01"
              min="0.01"
              max={maxAllowed}
              placeholder={`e.g. ${maxAllowed}`}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError("");
              }}
              required
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          {/* Payment Date */}
          <div className="space-y-1.5">
            <Label htmlFor="modal-payment-date" className="flex items-center gap-1">
              <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5 text-muted-foreground" /> Payment Date & Time
            </Label>
            <Input
              id="modal-payment-date"
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Note input */}
          <div className="space-y-1.5">
            <Label htmlFor="modal-payment-note">Payment Note (Optional)</Label>
            <Textarea
              id="modal-payment-note"
              placeholder="e.g. Cash payment, bKash Ref #123, Bank deposit..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="text-xs"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="gap-1.5">
              {isSubmitting ? (
                <>
                  <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-4 animate-spin" />
                  {isEditingPayment ? "Updating..." : "Recording..."}
                </>
              ) : isEditingPayment ? (
                "Update Payment"
              ) : (
                "Record Payment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
