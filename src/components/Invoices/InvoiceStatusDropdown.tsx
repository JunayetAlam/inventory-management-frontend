"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, Loading03Icon, Alert02Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTrigger,
} from "@/components/ui/popover";
import useIsAdmin from "@/hooks/useIsAdmin";
import { useUpdateInvoiceStatusMutation } from "@/redux/api/invoiceApi";
import { TInvoice } from "@/types";
import { errorMessageGenerator } from "@/utils/errorMessageGenerator";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: ("PENDING" | "APPROVED" | "REJECTED")[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
];

interface InvoiceStatusDropdownProps {
  invoice: TInvoice;
  disabled?: boolean;
  className?: string;
  onStatusUpdated?: (newStatus: "PENDING" | "APPROVED" | "REJECTED") => void;
}

export default function InvoiceStatusDropdown({
  invoice,
  disabled = false,
  className,
  onStatusUpdated,
}: InvoiceStatusDropdownProps) {
  const [isAdmin] = useIsAdmin();
  const [updateInvoiceStatus, { isLoading: isUpdatingStatus }] =
    useUpdateInvoiceStatusMutation();
  const [openStatusPopover, setOpenStatusPopover] = useState<
    "PENDING" | "APPROVED" | "REJECTED" | null
  >(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleConfirmStatusChange = async (
    newStatus: "PENDING" | "APPROVED" | "REJECTED"
  ) => {
    try {
      setIsUpdating(true);
      await updateInvoiceStatus({ id: invoice.id, status: newStatus }).unwrap();
      toast.success(
        `Invoice ${invoice.invoiceNumber} status updated to ${newStatus}`
      );
      setOpenStatusPopover(null);
      onStatusUpdated?.(newStatus);
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isAdmin || invoice.isDeleted) {
    return (
      <Badge
        variant="outline"
        className={cn(
          invoice.status === "APPROVED"
            ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 text-[10px]"
            : invoice.status === "REJECTED"
            ? "bg-destructive/15 text-destructive border-destructive/30 text-[10px]"
            : "bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px]",
          className
        )}
      >
        {invoice.status}
      </Badge>
    );
  }

  const isCurrentUpdating = isUpdating || isUpdatingStatus;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isCurrentUpdating}
          className={cn(
            "h-7 w-[115px] justify-between text-[11px] font-semibold border rounded-lg px-2.5 shadow-none focus:ring-1 focus:ring-ring transition-colors cursor-pointer",
            invoice.status === "APPROVED" &&
              "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400 hover:bg-emerald-500/25",
            invoice.status === "REJECTED" &&
              "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/25",
            invoice.status === "PENDING" &&
              "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400 hover:bg-amber-500/25",
            className
          )}
        >
          {isCurrentUpdating ? (
            <span className="flex items-center gap-1 mx-auto">
              <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-3 animate-spin" /> Updating...
            </span>
          ) : (
            <>
              <span>{invoice.status}</span>
              <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} className="size-3 opacity-60 ml-1" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[130px] p-1 text-xs"
        onFocusOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => {
          const target = e.target as HTMLElement | null;
          if (target?.closest('[data-slot="popover-content"]')) {
            e.preventDefault();
          }
        }}
      >
        {STATUS_OPTIONS.map((statusOption) => {
          const isCurrent = invoice.status === statusOption;
          if (isCurrent) {
            return (
              <DropdownMenuItem
                key={statusOption}
                disabled
                className="font-semibold text-xs opacity-60 bg-muted/50 cursor-default"
              >
                {statusOption} (Current)
              </DropdownMenuItem>
            );
          }

          const isPopoverOpenForThis = openStatusPopover === statusOption;
          const isOtherPopoverOpen =
            openStatusPopover !== null && openStatusPopover !== statusOption;

          return (
            <Popover
              key={statusOption}
              open={isPopoverOpenForThis}
              onOpenChange={(isOpen) => {
                if (isOpen) {
                  setOpenStatusPopover(statusOption);
                } else if (!isCurrentUpdating) {
                  setOpenStatusPopover(null);
                }
              }}
            >
              <PopoverTrigger asChild>
                <DropdownMenuItem
                  disabled={isOtherPopoverOpen}
                  onSelect={(e) => {
                    e.preventDefault();
                    setOpenStatusPopover(statusOption);
                  }}
                  className={cn(
                    "font-medium cursor-pointer rounded-lg px-2 py-1.5 text-xs transition-colors",
                    isPopoverOpenForThis && "bg-accent font-semibold",
                    statusOption === "APPROVED" &&
                      "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10",
                    statusOption === "REJECTED" &&
                      "text-destructive hover:bg-destructive/10",
                    statusOption === "PENDING" &&
                      "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                  )}
                >
                  {statusOption}
                </DropdownMenuItem>
              </PopoverTrigger>
              <PopoverContent
                side="right"
                align="start"
                sideOffset={8}
                collisionPadding={16}
                className="w-72 gap-2.5 p-3.5 rounded-2xl shadow-xl border border-border bg-popover text-popover-foreground z-50"
                onCloseAutoFocus={(e) => e.preventDefault()}
                onFocusOutside={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => {
                  const target = e.target as HTMLElement | null;
                  if (target?.closest('[data-slot="dropdown-menu-content"]')) {
                    e.preventDefault();
                  }
                }}
              >
                <PopoverHeader className="gap-1.5 text-left">
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                    <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-3.5 shrink-0" />
                    <span>Confirm Status Change</span>
                  </div>
                  <PopoverDescription className="text-xs text-muted-foreground leading-relaxed">
                    Change status of{" "}
                    <span className="font-mono font-medium text-foreground">
                      {invoice.invoiceNumber}
                    </span>{" "}
                    from{" "}
                    <strong className="text-foreground">{invoice.status}</strong> to{" "}
                    <strong className="text-foreground">{statusOption}</strong>?
                    <span className="block text-[11px] text-muted-foreground/80 mt-1.5 bg-muted/60 p-1.5 rounded-lg border border-border/40">
                      💡 <strong>Note:</strong> You can change this status again later at any time.
                    </span>
                  </PopoverDescription>
                </PopoverHeader>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2.5 text-xs font-medium"
                    onClick={() => setOpenStatusPopover(null)}
                    disabled={isCurrentUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className={cn(
                      "h-7 px-2.5 text-xs font-medium !text-white text-white shadow-xs cursor-pointer",
                      statusOption === "APPROVED" &&
                        "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800",
                      statusOption === "REJECTED" &&
                        "bg-destructive hover:bg-destructive/90 active:bg-destructive/95",
                      statusOption === "PENDING" &&
                        "bg-amber-600 hover:bg-amber-700 active:bg-amber-800"
                    )}
                    onClick={() => handleConfirmStatusChange(statusOption)}
                    disabled={isCurrentUpdating}
                  >
                    {isCurrentUpdating ? (
                      <span className="flex items-center gap-1 text-white">
                        <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-3 animate-spin text-white" /> Updating...
                      </span>
                    ) : (
                      <span className="text-white font-semibold">Confirm</span>
                    )}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
