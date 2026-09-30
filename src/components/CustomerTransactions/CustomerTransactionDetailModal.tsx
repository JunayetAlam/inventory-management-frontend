"use client";

import React from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { File02Icon, Wallet01Icon, Undo02Icon, Calendar03Icon, UserIcon, Call02Icon, LinkSquare02Icon, DollarCircleIcon, AlertCircleIcon, FileValidationIcon } from "@hugeicons/core-free-icons";
import { TCustomerTransaction } from "@/types";
import { formatInvoiceMoney, formatSignedDue } from "@/utils/formatInvoiceMoney";

interface CustomerTransactionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: TCustomerTransaction | null;
}

export default function CustomerTransactionDetailModal({
  open,
  onOpenChange,
  transaction,
}: CustomerTransactionDetailModalProps) {
  if (!transaction) return null;

  const isInvoice = transaction.type === "INVOICE";
  const isPayment = transaction.type === "PAYMENT";
  const isReturn = transaction.type === "RETURN_INVOICE";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              {isInvoice && <HugeiconsIcon icon={File02Icon} strokeWidth={2} className="size-5 text-blue-500" />}
              {isPayment && <HugeiconsIcon icon={Wallet01Icon} strokeWidth={2} className="size-5 text-emerald-500" />}
              {isReturn && <HugeiconsIcon icon={Undo02Icon} strokeWidth={2} className="size-5 text-amber-500" />}
              <span>Transaction Details</span>
            </DialogTitle>
            <Badge
              variant="outline"
              className={
                isInvoice
                  ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-semibold"
                  : isPayment
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold"
              }
            >
              {isInvoice ? "Invoice / Sale" : isPayment ? "Cash Payment" : "Return Invoice"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Top Info Grid */}
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/60 bg-muted/20 p-3 text-xs">
            <div className="space-y-1">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3.5" /> Date & Time
              </span>
              <p className="font-medium text-foreground">
                {formatDateTime(transaction.createdAt)}
              </p>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <HugeiconsIcon icon={FileValidationIcon} strokeWidth={2} className="size-3.5" /> Reference
              </span>
              <p className="font-semibold text-foreground font-mono">
                {transaction.referenceNumber || "N/A"}
              </p>
            </div>
          </div>

          {/* Customer Info Card */}
          <div className="rounded-lg border border-border/60 p-3.5 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-3.5" /> Customer Details
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-foreground font-medium">{transaction.customer?.name}</p>
                <p className="text-muted-foreground flex items-center gap-1 mt-0.5">
                  <HugeiconsIcon icon={Call02Icon} strokeWidth={2} className="size-3" />
                  {transaction.customer?.countryCode || "+880"}{" "}
                  {transaction.customer?.phoneNumber}
                </p>
              </div>
              {transaction.customer?.email && (
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="text-foreground truncate">{transaction.customer.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="rounded-lg border border-border/60 p-3.5 space-y-3">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <HugeiconsIcon icon={DollarCircleIcon} strokeWidth={2} className="size-3.5" /> Financial Summary
            </span>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-amber-500/10 p-2.5">
                <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                  Due
                </p>
                <p className="text-sm font-bold text-amber-700 dark:text-amber-300 font-mono mt-1">
                  {transaction.due > 0 ? formatInvoiceMoney(transaction.due) : "—"}
                </p>
              </div>

              <div className="rounded-md bg-emerald-500/10 p-2.5">
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                  Cash
                </p>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 font-mono mt-1">
                  {transaction.cash > 0 ? formatInvoiceMoney(transaction.cash) : "—"}
                </p>
              </div>

              <div className="rounded-md bg-muted/40 p-2.5">
                <p className="text-[11px] text-muted-foreground font-medium">
                  Balance
                </p>
                <p
                  className={`text-sm font-bold font-mono mt-1 ${
                    transaction.balance > 0
                      ? "text-rose-600 dark:text-rose-400"
                      : transaction.balance < 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-foreground"
                  }`}
                >
                  {formatSignedDue(transaction.balance)}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {(transaction.note || transaction.payment?.note || transaction.invoice?.note) && (
            <div className="rounded-lg border border-border/60 bg-muted/10 p-3 text-xs space-y-1">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-3.5" /> Note
              </span>
              <p className="text-foreground whitespace-pre-wrap break-words leading-relaxed">
                {transaction.note || transaction.payment?.note || transaction.invoice?.note}
              </p>
            </div>
          )}

          {/* Staff Info */}
          {transaction.createdBy && (
            <div className="text-[11px] text-muted-foreground text-right">
              Processed by:{" "}
              <span className="font-medium text-foreground">
                {transaction.createdBy.firstName} {transaction.createdBy.lastName}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {/* Link to exact Invoice */}
          {isReturn && (transaction.returnInvoiceId || transaction.returnInvoice?.id) && (
            <Button asChild variant="outline" size="sm" className="text-xs gap-1.5">
              <Link
                href={`/return-invoices/${
                  transaction.returnInvoiceId || transaction.returnInvoice?.id
                }/invoice`}
              >
                <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={2} className="size-3.5" />
                View Invoice
              </Link>
            </Button>
          )}

          {!isReturn &&
            (transaction.invoiceId ||
              transaction.payment?.invoiceId ||
              transaction.invoice?.id) && (
              <Button asChild variant="outline" size="sm" className="text-xs gap-1.5">
                <Link
                  href={`/invoices/${
                    transaction.invoiceId ||
                    transaction.payment?.invoiceId ||
                    transaction.invoice?.id
                  }/invoice`}
                >
                  <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={2} className="size-3.5" />
                  View Invoice
                </Link>
              </Button>
            )}
          <Button
            variant="default"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
