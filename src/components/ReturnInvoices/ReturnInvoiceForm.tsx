"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Loader2,
  Package,
  Plus,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useCreateReturnInvoiceMutation,
  useGetReturnableItemsByInvoiceQuery,
  useUpdateReturnInvoiceMutation,
} from "@/redux/api/returnInvoiceApi";
import { useGetAllInvoicesQuery, useGetInvoiceByIdQuery } from "@/redux/api/invoiceApi";
import { TReturnInvoice } from "@/types";
import { errorMessageGenerator } from "@/utils/errorMessageGenerator";
import { derivePositionAfterReturn } from "@/utils/deriveInvoiceSettlement";
import { cn } from "@/lib/utils";
import InvoiceSelect from "./InvoiceSelect";

interface LineState {
  selected: boolean;
  quantity: number;
  sellingPrice: number;
  discounts: (number | string)[];
}

interface ReturnInvoiceFormProps {
  initialData?: TReturnInvoice;
  isEditing?: boolean;
  isDetails?: boolean;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function getEffectiveDiscountPercent(discounts: (number | string)[]): number {
  const active = (discounts || [])
    .map((d) => (d === "" || d === null || d === undefined ? 0 : Number(d)))
    .filter((d) => !isNaN(d) && d > 0 && d <= 100);
  if (active.length <= 1) return active[0] || 0;
  let cur = 1;
  for (const d of active) {
    cur *= 1 - d / 100;
  }
  return Math.round((1 - cur) * 10000) / 100;
}

function lineTotal(qty: number, sellingPrice: number, discounts?: (number | string)[] | number) {
  const sub = qty * sellingPrice;
  if (Array.isArray(discounts)) {
    let cur = sub;
    for (const d of discounts) {
      if (d === "" || d === null || d === undefined) continue;
      const p = Math.max(0, Math.min(100, Number(d) || 0));
      cur = Math.round(cur * (1 - p / 100) * 100) / 100;
    }
    return round2(Math.max(0, cur));
  }
  const disc = (sub * (discounts || 0)) / 100;
  return round2(Math.max(0, sub - disc));
}

export default function ReturnInvoiceForm({
  initialData,
  isEditing = false,
  isDetails = false,
}: ReturnInvoiceFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedInvoiceId =
    searchParams.get("invoiceId") || initialData?.invoiceId || "";

  const readOnly = isDetails;

  const [invoiceId, setInvoiceId] = useState(preselectedInvoiceId);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const invoiceSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [lines, setLines] = useState<Record<string, LineState>>({});
  const [discount, setDiscount] = useState(
    initialData ? String(initialData.discount || 0) : "0",
  );
  const [refundedAmount, setRefundedAmount] = useState(
    initialData ? String(initialData.refundedAmount ?? 0) : "0",
  );
  const [note, setNote] = useState(initialData?.note || "");
  const refundTouchedRef = useRef(!!isEditing || !!isDetails);

  const handleInvoiceSearch = (term: string) => {
    if (invoiceSearchTimer.current) clearTimeout(invoiceSearchTimer.current);
    invoiceSearchTimer.current = setTimeout(() => {
      setInvoiceSearch(term);
    }, 300);
  };

  const [createReturn, { isLoading: isCreating }] =
    useCreateReturnInvoiceMutation();
  const [updateReturn, { isLoading: isUpdating }] =
    useUpdateReturnInvoiceMutation();

  const { data: invoicesRes, isLoading: isInvoicesLoading } =
    useGetAllInvoicesQuery(
      {
        isDeleted: false,
        limit: 50,
        ...(invoiceSearch.trim()
          ? { searchTerm: invoiceSearch.trim() }
          : {}),
      },
      { skip: !!isEditing || !!isDetails || !!preselectedInvoiceId },
    );

  const { data: selectedInvoiceRes } = useGetInvoiceByIdQuery(invoiceId, {
    skip: !invoiceId || isEditing || isDetails,
  });

  const {
    data: returnableRes,
    isLoading: isReturnableLoading,
    isFetching: isReturnableFetching,
  } = useGetReturnableItemsByInvoiceQuery(
    {
      invoiceId,
      excludeReturnInvoiceId: isEditing ? initialData?.id : undefined,
    },
    { skip: !invoiceId || readOnly },
  );

  const returnableItems = returnableRes?.data?.items || [];
  const returnableInvoice = returnableRes?.data?.invoice;
  const previousReturn =
    returnableRes?.data?.previousReturn ||
    initialData?.previousReturnInvoice ||
    null;
  const selectedInvoice = selectedInvoiceRes?.data;

  const previousDue = useMemo(() => {
    if (readOnly || isEditing) {
      return round2(Number(initialData?.previousDueAmount) || 0);
    }
    return round2(
      Number(
        returnableRes?.data?.previousDueAmount ??
          previousReturn?.dueRefundAmount ??
          0,
      ) || 0,
    );
  }, [
    readOnly,
    isEditing,
    initialData?.previousDueAmount,
    returnableRes?.data?.previousDueAmount,
    previousReturn?.dueRefundAmount,
  ]);

  // Hydrate lines when returnable items load (create/edit)
  useEffect(() => {
    if (readOnly || !returnableItems.length) return;

    setLines((prev) => {
      const next: Record<string, LineState> = {};
      for (const item of returnableItems) {
        const existingInitial = initialData?.items?.find(
          (it) => it.invoiceItemId === item.invoiceItemId,
        );
        const prevLine = prev[item.invoiceItemId];
        const maxQty = item.remainingReturnable;

        const defaultDiscounts = (raw: any): (number | string)[] => {
          if (Array.isArray(raw) && raw.length > 0) return raw;
          if (typeof raw === "number" && raw > 0) return [raw];
          return [""];
        };

        if (existingInitial && isEditing) {
          next[item.invoiceItemId] = {
            selected: true,
            quantity: Math.min(
              existingInitial.quantity,
              maxQty || existingInitial.quantity,
            ),
            sellingPrice: existingInitial.sellingPrice,
            discounts: defaultDiscounts(existingInitial.discounts ?? existingInitial.discount),
          };
        } else if (prevLine) {
          next[item.invoiceItemId] = {
            selected: prevLine.selected && maxQty > 0,
            quantity: Math.min(prevLine.quantity || 1, Math.max(maxQty, 0)),
            sellingPrice: prevLine.sellingPrice ?? item.sellingPrice,
            discounts: prevLine.discounts?.length ? prevLine.discounts : defaultDiscounts(item.discounts ?? item.discount),
          };
        } else {
          next[item.invoiceItemId] = {
            selected: false,
            quantity: maxQty > 0 ? 1 : 0,
            sellingPrice: item.sellingPrice,
            discounts: defaultDiscounts(item.discounts ?? item.discount),
          };
        }
      }
      return next;
    });
  }, [returnableItems, readOnly, isEditing, initialData]);

  useEffect(() => {
    if (preselectedInvoiceId) setInvoiceId(preselectedInvoiceId);
  }, [preselectedInvoiceId]);

  // Reset refund default when switching source invoice on create
  useEffect(() => {
    if (isEditing || readOnly) return;
    refundTouchedRef.current = false;
  }, [invoiceId, isEditing, readOnly]);

  const handleAddLineDiscount = (invoiceItemId: string) => {
    setLines((prev) => {
      const current = prev[invoiceItemId];
      if (!current) return prev;
      if (current.discounts.length >= 4) {
        toast.info("Maximum 4 discounts allowed per product");
        return prev;
      }
      return {
        ...prev,
        [invoiceItemId]: {
          ...current,
          discounts: [...current.discounts, ""],
        },
      };
    });
  };

  const handleRemoveLineDiscount = (invoiceItemId: string, discIndex: number) => {
    setLines((prev) => {
      const current = prev[invoiceItemId];
      if (!current) return prev;
      if (current.discounts.length <= 1) {
        return {
          ...prev,
          [invoiceItemId]: {
            ...current,
            discounts: [""],
          },
        };
      }
      return {
        ...prev,
        [invoiceItemId]: {
          ...current,
          discounts: current.discounts.filter((_, idx) => idx !== discIndex),
        },
      };
    });
  };

  const handleLineDiscountChange = (
    invoiceItemId: string,
    discIndex: number,
    val: string,
  ) => {
    setLines((prev) => {
      const current = prev[invoiceItemId];
      if (!current) return prev;
      const updated = [...current.discounts];
      updated[discIndex] = val;
      return {
        ...prev,
        [invoiceItemId]: {
          ...current,
          discounts: updated,
        },
      };
    });
  };

  const displayItems: Array<{
    invoiceItemId: string;
    productName: string;
    unit: string;
    sellingPrice: number;
    discounts: number[];
    originalQuantity?: number;
    alreadyReturned?: number;
    remainingReturnable?: number;
    quantity: number;
    totalPrice: number;
  }> = useMemo(() => {
    if (readOnly && initialData) {
      return initialData.items.map((it) => {
        const itemDiscounts = it.discounts ?? (it.discount ? [it.discount] : []);
        return {
          invoiceItemId: it.invoiceItemId,
          productName: it.productName,
          unit: it.unit,
          sellingPrice: it.sellingPrice,
          discounts: itemDiscounts,
          quantity: it.quantity,
          totalPrice: it.totalPrice,
        };
      });
    }

    return returnableItems
      .filter((it) => lines[it.invoiceItemId]?.selected)
      .map((it) => {
        const line = lines[it.invoiceItemId];
        const qty = line?.quantity || 0;
        const sellingPrice = line?.sellingPrice ?? it.sellingPrice;
        const rawDiscounts = line?.discounts ?? it.discounts ?? (it.discount ? [it.discount] : []);
        const activeDiscounts = (rawDiscounts || [])
          .map((d) => (d === "" || d === null || d === undefined ? 0 : Number(d)))
          .filter((d) => !isNaN(d) && d > 0);
        return {
          invoiceItemId: it.invoiceItemId,
          productName: it.productName,
          unit: it.unit,
          sellingPrice,
          discounts: activeDiscounts,
          originalQuantity: it.originalQuantity,
          alreadyReturned: it.alreadyReturned,
          remainingReturnable: it.remainingReturnable,
          quantity: qty,
          totalPrice: lineTotal(qty, sellingPrice, activeDiscounts),
        };
      });
  }, [readOnly, initialData, returnableItems, lines]);

  const subTotal = useMemo(
    () =>
      round2(displayItems.reduce((sum, it) => sum + it.totalPrice, 0)),
    [displayItems],
  );
  const discVal = Math.max(0, Number(discount) || 0);
  const totalAmount = round2(Math.max(0, subTotal - discVal));
  const maxRefundable = round2(previousDue + totalAmount);

  // Default refunded amount = this return's net credit (create flow)
  useEffect(() => {
    if (readOnly || isEditing || refundTouchedRef.current) return;
    setRefundedAmount(String(totalAmount));
  }, [totalAmount, readOnly, isEditing]);

  const refunded = Math.min(
    Math.max(0, Number(refundedAmount) || 0),
    maxRefundable,
  );

  const previousPosition = useMemo(() => {
    if (readOnly) {
      return (
        initialData?.previousPosition || { netDue: 0, netRefundable: 0 }
      );
    }
    return (
      returnableRes?.data?.previousPosition ||
      initialData?.previousPosition || {
        netDue: 0,
        netRefundable: 0,
      }
    );
  }, [
    readOnly,
    initialData?.previousPosition,
    returnableRes?.data?.previousPosition,
  ]);

  const currentPosition = useMemo(() => {
    if (readOnly && initialData?.currentPosition) {
      return initialData.currentPosition;
    }
    return derivePositionAfterReturn(previousPosition, totalAmount, refunded);
  }, [
    readOnly,
    initialData?.currentPosition,
    previousPosition,
    totalAmount,
    refunded,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    if (!invoiceId) {
      toast.error("Please select a source invoice");
      return;
    }

    const items = Object.entries(lines)
      .filter(([, v]) => v.selected && v.quantity > 0)
      .map(([invoiceItemId, v]) => {
        const activeDiscounts = (v.discounts || [])
          .map((d) => (d === "" || d === null || d === undefined ? 0 : Number(d)))
          .filter((d) => !isNaN(d) && d > 0 && d <= 100);

        return {
          invoiceItemId,
          quantity: Number(v.quantity),
          sellingPrice: Math.max(0, Number(v.sellingPrice) || 0),
          discounts: activeDiscounts,
          discount: activeDiscounts[0] ?? 0,
        };
      });

    if (items.length === 0) {
      toast.error("Select at least one product to return");
      return;
    }

    for (const item of items) {
      const meta = returnableItems.find(
        (r) => r.invoiceItemId === item.invoiceItemId,
      );
      if (!meta) continue;
      if (item.quantity > meta.remainingReturnable) {
        toast.error(
          `"${meta.productName}" quantity cannot exceed ${meta.remainingReturnable}`,
        );
        return;
      }
    }

    if (refunded > maxRefundable) {
      toast.error(
        `Refunded amount cannot exceed previous due + net credit (৳${maxRefundable.toFixed(2)})`,
      );
      return;
    }

    const payload = {
      ...(isEditing ? {} : { invoiceId }),
      items,
      discount: discVal,
      refundedAmount: refunded,
      note: note.trim() || null,
    };

    try {
      if (isEditing && initialData) {
        const res = await updateReturn({
          id: initialData.id,
          body: payload,
        }).unwrap();
        toast.success("Return invoice updated successfully");
        (res?.data?.warnings || []).forEach((w: string) => toast.warning(w));
        router.push(`/return-invoices/${initialData.id}`);
      } else {
        const res = await createReturn(payload).unwrap();
        toast.success("Return invoice created successfully");
        const id = res?.data?.returnInvoice?.id;
        router.push(id ? `/return-invoices/${id}` : "/return-invoices");
      }
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    }
  };

  const invoiceLabel =
    returnableInvoice?.invoiceNumber ||
    selectedInvoice?.invoiceNumber ||
    initialData?.invoice?.invoiceNumber ||
    "";

  const customerName =
    returnableInvoice?.customer?.name ||
    selectedInvoice?.customer?.name ||
    initialData?.invoice?.customer?.name ||
    "";

  const previousReturnNumber =
    previousReturn?.returnNumber ||
    initialData?.previousReturnInvoice?.returnNumber;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!readOnly && (
        <div className="sticky top-2 z-30 flex items-center justify-between gap-3 p-3 -mx-2 rounded-xl bg-background/95 backdrop-blur border border-border shadow-xs">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8 px-2 cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span className="hidden sm:inline">Go Back</span>
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => router.push("/return-invoices")}
            >
              <X className="size-3.5 mr-1" /> Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-8 text-xs gap-1.5"
              disabled={isCreating || isUpdating}
            >
              {isCreating || isUpdating ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Save className="size-3.5" />
              )}
              {isEditing ? "Update Return" : "Create Return"}
            </Button>
          </div>
        </div>
      )}

      {/* Source invoice */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Source Invoice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {readOnly || isEditing ? (
            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Invoice: </span>
                <Link
                  href={`/invoices/${invoiceId || initialData?.invoiceId}`}
                  className="font-mono font-semibold text-primary hover:underline"
                >
                  {invoiceLabel}
                </Link>
              </p>
              {customerName && (
                <p>
                  <span className="text-muted-foreground">Customer: </span>
                  <span className="font-medium">{customerName}</span>
                </p>
              )}
              {previousReturnNumber && (
                <p>
                  <span className="text-muted-foreground">Previous return: </span>
                  <Link
                    href={`/return-invoices/${previousReturn?.id || initialData?.previousReturnInvoiceId}`}
                    className="font-mono font-semibold text-primary hover:underline"
                  >
                    {previousReturnNumber}
                  </Link>
                  <span className="text-muted-foreground">
                    {" "}
                    · refund due ৳{previousDue.toFixed(2)}
                  </span>
                </p>
              )}
            </div>
          ) : preselectedInvoiceId ? (
            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Invoice: </span>
                <span className="font-mono font-semibold">
                  {invoiceLabel || "…"}
                </span>
              </p>
              {customerName && (
                <p>
                  <span className="text-muted-foreground">Customer: </span>
                  {customerName}
                </p>
              )}
              {previousReturnNumber && (
                <p>
                  <span className="text-muted-foreground">Previous return: </span>
                  <span className="font-mono font-semibold">
                    {previousReturnNumber}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    · refund due ৳{previousDue.toFixed(2)}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs">Select invoice *</Label>
              <InvoiceSelect
                invoices={invoicesRes?.data || []}
                selectedInvoiceId={invoiceId}
                selectedInvoice={selectedInvoice}
                isLoading={isInvoicesLoading}
                onSelect={(id) => setInvoiceId(id)}
                onClear={() => {
                  setInvoiceId("");
                  setInvoiceSearch("");
                }}
                onSearch={handleInvoiceSearch}
              />
              {invoiceId && customerName && (
                <p className="text-xs text-muted-foreground">
                  Customer:{" "}
                  <span className="font-medium text-foreground">
                    {customerName}
                  </span>
                </p>
              )}
              {invoiceId && previousReturnNumber && (
                <p className="text-xs text-muted-foreground">
                  Previous return{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {previousReturnNumber}
                  </span>{" "}
                  · refund due ৳{previousDue.toFixed(2)}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="size-4" /> Return Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!invoiceId && !readOnly ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              Select an invoice to load returnable products.
            </p>
          ) : isReturnableLoading || isReturnableFetching ? (
            <div className="space-y-2 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : readOnly ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground text-left">
                    <th className="py-2 pr-2 w-8">#</th>
                    <th className="py-2 pr-2">Product</th>
                    <th className="py-2 pr-2">Unit</th>
                    <th className="py-2 pr-2 text-right">Qty</th>
                    <th className="py-2 pr-2 text-right">Price</th>
                    <th className="py-2 pr-2 text-right">Disc %</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {displayItems.map((it, index) => (
                    <tr
                      key={it.invoiceItemId}
                      className="border-b border-border/50"
                    >
                      <td className="py-2 pr-2 font-mono text-muted-foreground">
                        {index + 1}
                      </td>
                      <td className="py-2 pr-2 font-medium">{it.productName}</td>
                      <td className="py-2 pr-2">{it.unit}</td>
                      <td className="py-2 pr-2 text-right font-mono">
                        {it.quantity}
                      </td>
                      <td className="py-2 pr-2 text-right font-mono">
                        ৳{it.sellingPrice}
                      </td>
                      <td className="py-2 pr-2 text-right font-mono">
                        {it.discounts && it.discounts.length > 0
                          ? it.discounts.map((d) => `${d}%`).join(", ")
                          : "—"}
                      </td>
                      <td className="py-2 text-right font-mono font-semibold">
                        ৳{it.totalPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : returnableItems.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              No returnable products left on this invoice.
            </p>
          ) : (
            <div className="space-y-2">
              <div className="hidden md:grid md:grid-cols-[2.75rem_minmax(0,2.6fr)_1.1fr_1.3fr_2.4fr_1.3fr] gap-2 px-3 py-1 text-xs font-semibold text-muted-foreground border-b border-border/40">
                <div className="text-center">#</div>
                <div>Product</div>
                <div className="text-right">Qty *</div>
                <div className="text-right">Price (৳) *</div>
                <div className="text-right">Disc (%)</div>
                <div className="text-right">Total (৳)</div>
              </div>
              {returnableItems.map((item, index) => {
                const line = lines[item.invoiceItemId] || {
                  selected: false,
                  quantity: item.remainingReturnable > 0 ? 1 : 0,
                  sellingPrice: item.sellingPrice,
                  discounts: [""],
                };
                const disabled = item.remainingReturnable <= 0;
                const fieldsDisabled = !line.selected || disabled || readOnly;
                const activeDiscounts = (line.discounts || [])
                  .map((d) => (d === "" || d === null || d === undefined ? 0 : Number(d)))
                  .filter((d) => !isNaN(d) && d > 0 && d <= 100);
                const effectiveDiscountPct = getEffectiveDiscountPercent(line.discounts);
                const rowTotal = lineTotal(
                  line.quantity,
                  line.sellingPrice,
                  activeDiscounts,
                );
                const patchLine = (patch: Partial<LineState>) => {
                  setLines((prev) => {
                    const current = prev[item.invoiceItemId] || line;
                    return {
                      ...prev,
                      [item.invoiceItemId]: { ...current, ...patch },
                    };
                  });
                };
                return (
                  <div
                    key={item.invoiceItemId}
                    className={cn(
                      "rounded-xl border p-2.5 space-y-2",
                      line.selected
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/70",
                      disabled && "opacity-50",
                    )}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-[2.75rem_minmax(0,2.6fr)_1.1fr_1.3fr_2.4fr_1.3fr] gap-2 items-center">
                      <div className="flex items-center gap-1.5 md:justify-center">
                        <input
                          type="checkbox"
                          className="size-4 accent-primary cursor-pointer"
                          checked={line.selected}
                          disabled={disabled || readOnly}
                          onChange={(e) => {
                            patchLine({
                              selected: e.target.checked,
                              quantity:
                                line.quantity > 0
                                   ? line.quantity
                                  : Math.min(1, item.remainingReturnable),
                            });
                          }}
                        />
                        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-mono font-semibold text-muted-foreground">
                          {index + 1}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.productName}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono">
                          Sold {item.originalQuantity} · Returned{" "}
                          {item.alreadyReturned} · Left{" "}
                          {item.remainingReturnable} {item.unit}
                        </p>
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground md:hidden block mb-1">
                          Qty *
                        </label>
                        <Input
                          type="number"
                          min={0}
                          max={item.remainingReturnable}
                          step="any"
                          disabled={fieldsDisabled}
                          value={line.quantity}
                          onChange={(e) => {
                            const qty = Math.min(
                              Math.max(0, Number(e.target.value) || 0),
                              item.remainingReturnable,
                            );
                            patchLine({
                              quantity: qty,
                              selected: qty > 0 ? true : line.selected,
                            });
                          }}
                          className="h-8 text-xs font-mono text-right"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground md:hidden block mb-1">
                          Price (৳) *
                        </label>
                        <Input
                          type="number"
                          min={0}
                          step="0.01"
                          disabled={fieldsDisabled}
                          value={line.sellingPrice}
                          onChange={(e) =>
                            patchLine({
                              sellingPrice: Math.max(
                                0,
                                Number(e.target.value) || 0,
                              ),
                            })
                          }
                          className="h-8 text-xs font-mono text-right"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-medium text-muted-foreground md:hidden block">
                            Disc (%)
                          </label>
                          {activeDiscounts.length > 1 && (
                            <span className="text-[10px] font-mono text-primary font-medium">
                              Eff: {effectiveDiscountPct}%
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {line.discounts.map((discVal, dIdx) => (
                            <div
                              key={dIdx}
                              className="relative flex items-center group"
                            >
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder="0"
                                value={discVal}
                                onChange={(e) =>
                                  handleLineDiscountChange(
                                    item.invoiceItemId,
                                    dIdx,
                                    e.target.value,
                                  )
                                }
                                disabled={fieldsDisabled}
                                className={`h-8 text-xs font-mono text-right ${
                                  line.discounts.length > 1 ? "w-14 pr-4" : "w-16"
                                }`}
                                title={`Discount #${dIdx + 1} (%)`}
                              />
                              {!fieldsDisabled && line.discounts.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveLineDiscount(item.invoiceItemId, dIdx)
                                  }
                                  className="absolute right-1 text-muted-foreground hover:text-destructive transition-colors p-0.5 cursor-pointer"
                                  title="Remove discount tier"
                                >
                                  <X className="size-2.5" />
                                </button>
                              )}
                            </div>
                          ))}

                          {!fieldsDisabled && line.discounts.length < 4 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    handleAddLineDiscount(item.invoiceItemId)
                                  }
                                  className="size-7 rounded-md border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary shrink-0 transition-colors"
                                  title="Add another discount tier"
                                >
                                  <Plus className="size-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                Add discount tier ({line.discounts.length}/4)
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>

                        {activeDiscounts.length > 1 && (
                          <div className="hidden md:flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] font-mono text-primary font-medium">
                              Eff: {effectiveDiscountPct}%
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <label className="text-[11px] font-medium text-muted-foreground md:hidden block mb-1">
                          Total (৳)
                        </label>
                        <span className="text-sm font-semibold font-mono text-foreground block">
                          ৳{rowTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Return Totals</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Overall discount (৳)</Label>
              <Input
                type="number"
                min={0}
                step="any"
                value={discount}
                disabled={readOnly}
                onChange={(e) => setDiscount(e.target.value)}
                className="h-8 text-xs font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Refunded amount (৳)
                <span className="text-muted-foreground font-normal">
                  {" "}
                  · max ৳{maxRefundable.toFixed(2)}
                </span>
              </Label>
              <Input
                type="number"
                min={0}
                max={maxRefundable}
                step="any"
                value={refundedAmount}
                disabled={readOnly}
                onChange={(e) => {
                  refundTouchedRef.current = true;
                  setRefundedAmount(e.target.value);
                }}
                className="h-8 text-xs font-mono"
              />
              {!readOnly && !isEditing && (
                <p className="text-[11px] text-muted-foreground">
                  Defaults to this return&apos;s net credit.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Note</Label>
              <Textarea
                value={note}
                disabled={readOnly}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>
          </div>
          <div className="rounded-xl border border-border/70 p-4 space-y-2 text-sm h-fit">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono font-semibold">
                +৳{subTotal.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span className="font-mono font-semibold text-rose-600">
                -৳{discVal.toFixed(2)}
              </span>
            </div>

            <div className="border-t pt-2 space-y-2">
              <div className="flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="font-mono font-bold">
                  +৳{totalAmount.toFixed(2)}
                </span>
              </div>

              {previousPosition.netDue > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Previous Customer Due
                  </span>
                  <span className="font-mono font-semibold text-rose-600">
                    -৳{previousPosition.netDue.toFixed(2)}
                  </span>
                </div>
              ) : previousPosition.netRefundable > 0 ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Previous Refund Due
                  </span>
                  <span className="font-mono font-semibold">
                    +৳{previousPosition.netRefundable.toFixed(2)}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Previous Due</span>
                  <span className="font-mono font-semibold text-rose-600">
                    -৳0.00
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Refund</span>
                <span className="font-mono font-semibold text-rose-600">
                  -৳{refunded.toFixed(2)}
                </span>
              </div>

              {currentPosition.netRefundable > 0 ? (
                <div className="flex justify-between border-t-2 border-foreground pt-2">
                  <span className="font-bold">Refund Due</span>
                  <span className="font-mono font-extrabold text-rose-600">
                    ৳{currentPosition.netRefundable.toFixed(2)}
                  </span>
                </div>
              ) : currentPosition.netDue > 0 ? (
                <div className="flex justify-between border-t-2 border-foreground pt-2">
                  <span className="font-bold">Customer Due</span>
                  <span className="font-mono font-extrabold text-rose-600">
                    ৳{currentPosition.netDue.toFixed(2)}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between border-t-2 border-foreground pt-2">
                  <span className="font-bold">Balance</span>
                  <span className="font-mono font-extrabold">৳0.00</span>
                </div>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground pt-1">
              {currentPosition.netRefundable > 0
                ? "Shop needs to pay the customer"
                : currentPosition.netDue > 0
                  ? "Customer still owes on this bill"
                  : "Bill is settled after this return"}
            </p>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
