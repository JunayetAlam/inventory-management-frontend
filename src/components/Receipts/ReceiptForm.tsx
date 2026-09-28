"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useCreateReceiptMutation,
  useUpdateReceiptMutation,
  useApprovePaymentMutation,
  useDeletePaymentMutation,
} from "@/redux/api/receiptApi";
import { useGetAllProductsQuery } from "@/redux/api/productApi";
import {
  useGetAllCustomersQuery,
  useLazyLookupCustomerByPhoneQuery,
  useCreateCustomerMutation,
} from "@/redux/api/customerApi";
import { useGetMeQuery } from "@/redux/api/userApi";
import useIsAdmin from "@/hooks/useIsAdmin";
import {
  ProductUnit,
  TReceipt,
  TReceiptFormItem,
  TCustomer,
  TProduct,
  TReceiptPayment,
} from "@/types";
import { errorMessageGenerator } from "@/utils/errorMessageGenerator";
import CustomPhoneInput from "@/components/Forms/CustomPhoneInput";
import CustomerSelect from "./CustomerSelect";
import ProductSelect from "./ProductSelect";
import ConfirmPopup from "@/components/Global/ConfirmPopup";
import PaymentModal from "./PaymentModal";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Plus,
  X,
  AlertTriangle,
  Lock,
  Receipt,
  User,
  Package,
  Save,
  ArrowLeft,
  Search,
  CheckCircle2,
  Unlock,
  Loader2,
  Banknote,
  Clock,
  Pencil,
  Check,
  FileText,
  Info,
} from "lucide-react";
import Link from "next/link";

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return "N/A";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
};

const PRODUCT_UNITS: ProductUnit[] = [
  "PIECE",
  "KG",
  "GRAM",
  "LITER",
  "METER",
  "PACKET",
  "BOX",
  "OTHER",
];

const normalizeProductName = (name: string) => name.trim().toLowerCase();

interface FormItemState extends Omit<
  TReceiptFormItem,
  "sellingPrice" | "quantity" | "discount" | "discounts"
> {
  tempId: string;
  sellingPrice: number | string;
  quantity: number | string;
  discounts: (number | string)[];
}

/** Merge legacy duplicate product rows so edit/save passes uniqueness rules. */
function mergeLegacyDuplicateItems(
  rawItems: {
    id?: string;
    productId?: string | null;
    productName: string;
    unit: ProductUnit;
    sellingPrice: number;
    quantity: number;
    discounts?: number[];
    discount?: number;
    product?: { stock?: number } | null;
  }[],
): FormItemState[] {
  const merged: FormItemState[] = [];
  const productIdIndex = new Map<string, number>();
  const customNameIndex = new Map<string, number>();

  rawItems.forEach((it, idx) => {
    const rawDiscounts =
      it.discounts && it.discounts.length > 0
        ? it.discounts
        : typeof it.discount === "number" && it.discount > 0
          ? [it.discount]
          : [""];

    const base: FormItemState = {
      tempId: it.id || `item-${idx}`,
      productId: it.productId || null,
      productName: it.productName,
      unit: it.unit,
      sellingPrice: Number(it.sellingPrice) || 0,
      quantity: Number(it.quantity) || 1,
      discounts: rawDiscounts.length > 0 ? rawDiscounts : [""],
      availableStock: it.product?.stock ?? null,
    };

    if (base.productId) {
      const existingIdx = productIdIndex.get(base.productId);
      if (existingIdx !== undefined) {
        const existing = merged[existingIdx];
        existing.quantity =
          (Number(existing.quantity) || 0) + (Number(base.quantity) || 0);
        return;
      }
      productIdIndex.set(base.productId, merged.length);
      merged.push(base);
      return;
    }

    const nameKey = normalizeProductName(base.productName);
    if (nameKey) {
      const existingIdx = customNameIndex.get(nameKey);
      if (existingIdx !== undefined) {
        const existing = merged[existingIdx];
        existing.quantity =
          (Number(existing.quantity) || 0) + (Number(base.quantity) || 0);
        return;
      }
      customNameIndex.set(nameKey, merged.length);
    }
    merged.push(base);
  });

  return merged;
}

interface ReceiptFormProps {
  initialData?: TReceipt;
  isEditing?: boolean;
  isDetails?: boolean;
  onCancelEdit?: () => void;
  onSaveSuccess?: () => void;
}

export default function ReceiptForm({
  initialData,
  isEditing = false,
  isDetails = false,
  onCancelEdit,
  onSaveSuccess,
}: ReceiptFormProps) {
  const router = useRouter();

  // Redux APIs
  const { data: meData } = useGetMeQuery(undefined);
  const [isAdmin] = useIsAdmin();
  const isCashier = meData?.data?.role === "CASHIER";
  const isApproved = initialData?.status === "APPROVED";
  const isLocked = isDetails || (!isAdmin && isApproved);

  // Payments State for Edit / Details mode
  const [payments, setPayments] = useState<TReceiptPayment[]>(
    initialData?.payments || [],
  );
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentToEdit, setSelectedPaymentToEdit] =
    useState<TReceiptPayment | null>(null);

  const [approvePayment, { isLoading: isApprovingPayment }] =
    useApprovePaymentMutation();
  const [deletePayment, { isLoading: isDeletingPayment }] =
    useDeletePaymentMutation();

  const handleOpenAddPayment = () => {
    setSelectedPaymentToEdit(null);
    setIsPaymentModalOpen(true);
  };

  const handleOpenEditPayment = (p: TReceiptPayment) => {
    setSelectedPaymentToEdit(p);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (updatedReceipt: TReceipt) => {
    if (updatedReceipt.payments) {
      setPayments(updatedReceipt.payments);
    }
    setPaidAmount(String(updatedReceipt.paidAmount || 0));
  };

  // Always keep payments sorted chronologically so the last payment is at last
  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeA - timeB;
    });
  }, [payments]);

  const handleApprovePayment = async (paymentId: string) => {
    if (!initialData) return;
    try {
      const res = await approvePayment({
        receiptId: initialData.id,
        paymentId,
      }).unwrap();
      toast.success("Payment approved successfully!");
      if (res?.data?.receipt?.payments) {
        setPayments(res.data.receipt.payments);
      }
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!initialData) return;
    try {
      const res = await deletePayment({
        receiptId: initialData.id,
        paymentId,
      }).unwrap();
      toast.success("Payment deleted successfully!");
      if (res?.data?.receipt) {
        if (res.data.receipt.payments) {
          setPayments(res.data.receipt.payments);
        }
        setPaidAmount(String(res.data.receipt.paidAmount || 0));
      }
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    }
  };

  const [createReceipt, { isLoading: isCreating }] = useCreateReceiptMutation();
  const [updateReceipt, { isLoading: isUpdating }] = useUpdateReceiptMutation();

  const { data: productsResponse, isLoading: isProductsLoading } =
    useGetAllProductsQuery({
      isDeleted: false,
      limit: 250,
    });
  const products = productsResponse?.data || [];

  const { data: customersResponse, isLoading: isCustomersLoading } =
    useGetAllCustomersQuery({
      isDeleted: false,
      limit: 250,
    });
  const customers = customersResponse?.data || [];

  // Customer API mutations and queries
  const [triggerLookup, { isFetching: isLookingUp }] =
    useLazyLookupCustomerByPhoneQuery();
  const [createCustomerMutation, { isLoading: isCreatingCustomer }] =
    useCreateCustomerMutation();

  // Unified Customer Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    initialData?.customerId || null,
  );
  const [customerName, setCustomerName] = useState<string>(
    initialData?.customer?.name || "",
  );
  const [customerCountryCode, setCustomerCountryCode] = useState<string>(
    initialData?.customer?.countryCode || "+880",
  );
  const [customerPhone, setCustomerPhone] = useState<string>(
    initialData?.customer?.phoneNumber || "",
  );
  const [customerEmail, setCustomerEmail] = useState<string>(
    initialData?.customer?.email || "",
  );
  const [customerAddress, setCustomerAddress] = useState<string>(
    initialData?.customer?.address || "",
  );
  const [isCustomerLocked, setIsCustomerLocked] = useState<boolean>(
    Boolean(initialData?.customerId),
  );

  // Items State
  const [items, setItems] = useState<FormItemState[]>([
    {
      tempId: "init-1",
      productId: null,
      productName: "",
      unit: "PIECE",
      sellingPrice: 0,
      quantity: 1,
      discounts: [""],
      availableStock: null,
    },
  ]);
  const [highlightedTempId, setHighlightedTempId] = useState<string | null>(
    null,
  );
  const itemRowRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const focusExistingItemRow = useCallback((tempId: string) => {
    setHighlightedTempId(tempId);
    requestAnimationFrame(() => {
      itemRowRefs.current.get(tempId)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedTempId(null);
      highlightTimeoutRef.current = null;
    }, 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
      }
    };
  }, []);

  // Overall Financials
  const [receiptDiscount, setReceiptDiscount] = useState<string>(
    initialData ? String(initialData.discount || 0) : "0",
  );
  const [paidAmount, setPaidAmount] = useState<string>(
    initialData ? String(initialData.paidAmount || 0) : "0",
  );
  const [note, setNote] = useState<string>(initialData?.note || "");

  // Initialize from initialData for update mode
  useEffect(() => {
    if (initialData) {
      setSelectedCustomerId(initialData.customerId || null);
      setReceiptDiscount(String(initialData.discount || 0));
      setPaidAmount(String(initialData.paidAmount || 0));
      setNote(initialData.note || "");

      if (initialData.customer) {
        setCustomerName(initialData.customer.name || "");
        setCustomerPhone(initialData.customer.phoneNumber || "");
        setCustomerCountryCode(initialData.customer.countryCode || "+880");
        setCustomerEmail(initialData.customer.email || "");
        setCustomerAddress(initialData.customer.address || "");
        setIsCustomerLocked(true);
      }

      if (initialData.items && initialData.items.length > 0) {
        setItems(mergeLegacyDuplicateItems(initialData.items));
      }

      if (initialData.payments) {
        setPayments(initialData.payments);
      }
    }
  }, [initialData]);

  // Customer handlers
  const handleSelectCustomer = (cust: TCustomer) => {
    setSelectedCustomerId(cust.id);
    setCustomerName(cust.name);
    setCustomerCountryCode(cust.countryCode || "+880");
    setCustomerPhone(cust.phoneNumber || "");
    setCustomerEmail(cust.email || "");
    setCustomerAddress(cust.address || "");
    setIsCustomerLocked(true);
  };

  const handleNameChange = (name: string) => {
    setCustomerName(name);
    setSelectedCustomerId(null);
    setIsCustomerLocked(false);
  };

  const handleClearCustomer = () => {
    setSelectedCustomerId(null);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerCountryCode("+880");
    setCustomerEmail("");
    setCustomerAddress("");
    setIsCustomerLocked(false);
  };

  const handleUnlockCustomer = () => {
    setIsCustomerLocked(false);
  };

  // Confirm / Verify customer by phone number
  const handleConfirmCustomer = async () => {
    const rawPhone = customerPhone.trim();
    if (!rawPhone || rawPhone.length < 4) {
      toast.error(
        "Please enter a valid phone number (minimum 4 digits) to confirm",
      );
      return;
    }

    try {
      const res = await triggerLookup({
        phoneNumber: rawPhone,
        countryCode: customerCountryCode,
      }).unwrap();

      const matched = res?.data;

      // Case 1: Active customer exists in DB
      if (matched && !matched.isDeleted) {
        setSelectedCustomerId(matched.id);
        setCustomerName(matched.name);
        setCustomerCountryCode(matched.countryCode || customerCountryCode);
        setCustomerPhone(matched.phoneNumber);
        setCustomerEmail(matched.email || "");
        setCustomerAddress(matched.address || "");
        setIsCustomerLocked(true);
        toast.success(`Customer verified: ${matched.name}`);
        return;
      }

      // Case 2: Soft-deleted customer exists in DB -> Reactivate with current details
      if (matched && matched.isDeleted) {
        const createRes = await createCustomerMutation({
          name: customerName.trim() || matched.name,
          countryCode: customerCountryCode,
          phoneNumber: matched.phoneNumber,
          email: customerEmail.trim() || undefined,
          address: customerAddress.trim() || undefined,
        }).unwrap();

        const reactivated = createRes?.data;
        if (reactivated) {
          setSelectedCustomerId(reactivated.id);
          setCustomerName(reactivated.name);
          setCustomerCountryCode(
            reactivated.countryCode || customerCountryCode,
          );
          setCustomerPhone(reactivated.phoneNumber);
          setCustomerEmail(reactivated.email || "");
          setCustomerAddress(reactivated.address || "");
          setIsCustomerLocked(true);
          toast.success(
            `Customer reactivated & details updated: ${reactivated.name}`,
          );
        }
        return;
      }

      // Case 3: Customer not found -> Create new customer on the fly
      const fallbackName =
        customerName.trim() || `Customer-${rawPhone.slice(-4)}`;
      const createRes = await createCustomerMutation({
        name: fallbackName,
        countryCode: customerCountryCode,
        phoneNumber: rawPhone,
        email: customerEmail.trim() || undefined,
        address: customerAddress.trim() || undefined,
      }).unwrap();

      const created = createRes?.data;
      if (created) {
        setSelectedCustomerId(created.id);
        setCustomerName(created.name);
        setCustomerCountryCode(created.countryCode || customerCountryCode);
        setCustomerPhone(created.phoneNumber);
        setCustomerEmail(created.email || "");
        setCustomerAddress(created.address || "");
        setIsCustomerLocked(true);
        toast.success(`New customer created and linked: ${created.name}`);
      }
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    }
  };

  // Product Selection Handlers
  const handleSelectProduct = (tempId: string, product: TProduct) => {
    const existing = items.find(
      (it) => it.tempId !== tempId && it.productId === product.id,
    );
    if (existing) {
      toast.info(
        `"${product.name}" is already on this receipt. Update quantity on that row.`,
      );
      focusExistingItemRow(existing.tempId);
      return;
    }

    setItems((prev) =>
      prev.map((it) => {
        if (it.tempId !== tempId) return it;
        return {
          ...it,
          productId: product.id,
          productName: product.name,
          unit: product.unit,
          sellingPrice: product.sellingPrice,
          availableStock: product.stock,
        };
      }),
    );
  };

  const handleCustomProductNameChange = (tempId: string, name: string) => {
    const nameKey = normalizeProductName(name);
    if (nameKey) {
      const existing = items.find(
        (it) =>
          it.tempId !== tempId &&
          !it.productId &&
          normalizeProductName(it.productName) === nameKey,
      );
      if (existing) {
        toast.info(
          `"${existing.productName}" is already on this receipt. Update quantity on that row.`,
        );
        focusExistingItemRow(existing.tempId);
        return;
      }
    }

    setItems((prev) =>
      prev.map((it) => {
        if (it.tempId !== tempId) return it;
        return {
          ...it,
          productId: null,
          productName: name,
          availableStock: null,
        };
      }),
    );
  };

  const handleClearProduct = (tempId: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.tempId !== tempId) return it;
        return {
          ...it,
          productId: null,
          productName: "",
          availableStock: null,
        };
      }),
    );
  };

  // Handle row item changes
  const handleItemChange = (
    tempId: string,
    field: keyof FormItemState,
    value: any,
  ) => {
    if (field === "productId" && value && value !== "custom") {
      const existing = items.find(
        (it) => it.tempId !== tempId && it.productId === value,
      );
      if (existing) {
        toast.info(
          `"${existing.productName}" is already on this receipt. Update quantity on that row.`,
        );
        focusExistingItemRow(existing.tempId);
        return;
      }
    }

    setItems((prev) =>
      prev.map((it) => {
        if (it.tempId !== tempId) return it;

        if (field === "productId") {
          if (value === "custom") {
            return {
              ...it,
              productId: null,
              productName: "",
              sellingPrice: 0,
              availableStock: null,
            };
          }
          const chosen = products.find((p) => p.id === value);
          if (chosen) {
            return {
              ...it,
              productId: chosen.id,
              productName: chosen.name,
              unit: chosen.unit,
              sellingPrice: chosen.sellingPrice,
              availableStock: chosen.stock,
            };
          }
        }

        return { ...it, [field]: value };
      }),
    );
  };

  // Add new item row
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        tempId: `item-${Date.now()}-${Math.random()}`,
        productId: null,
        productName: "",
        unit: "PIECE",
        sellingPrice: 0,
        quantity: 1,
        discounts: [""],
        availableStock: null,
      },
    ]);
  };

  // Remove item row
  const handleRemoveItem = (tempId: string) => {
    if (items.length <= 1) {
      toast.error("At least one item is required in the receipt");
      return;
    }
    setItems((prev) => prev.filter((it) => it.tempId !== tempId));
  };

  // Add another discount tier to a row (up to 4 max)
  const handleAddDiscountField = (tempId: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.tempId !== tempId) return it;
        if (it.discounts.length >= 4) {
          toast.info("Maximum 4 discounts allowed per product");
          return it;
        }
        return {
          ...it,
          discounts: [...it.discounts, ""],
        };
      }),
    );
  };

  // Remove a discount tier from a row
  const handleRemoveDiscountField = (tempId: string, discIndex: number) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.tempId !== tempId) return it;
        if (it.discounts.length <= 1) {
          return { ...it, discounts: [""] };
        }
        return {
          ...it,
          discounts: it.discounts.filter((_, idx) => idx !== discIndex),
        };
      }),
    );
  };

  // Handle discount change for a specific index
  const handleDiscountChange = (
    tempId: string,
    discIndex: number,
    value: string,
  ) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.tempId !== tempId) return it;
        const updated = [...it.discounts];
        updated[discIndex] = value;
        return { ...it, discounts: updated };
      }),
    );
  };

  // Multi-Row Aggregated Product Quantities
  const productAggregatedQuantities = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((it) => {
      if (it.productId) {
        const current = map.get(it.productId) || 0;
        map.set(it.productId, current + (Number(it.quantity) || 0));
      }
    });
    return map;
  }, [items]);

  // Calculations per row and overall totals
  const { calculatedRows, subTotal, totalAmount, dueAmount } = useMemo(() => {
    let sub = 0;

    const rows = items.map((it) => {
      const qty = Math.max(0, Number(it.quantity) || 0);
      const price = Math.max(0, Number(it.sellingPrice) || 0);
      const rowSubtotal = Math.round(qty * price * 100) / 100;

      const activeDiscounts = (it.discounts || [])
        .map((d) => Math.max(0, Math.min(100, Number(d) || 0)))
        .filter((d) => d > 0);

      let runningPrice = rowSubtotal;
      for (const d of activeDiscounts) {
        runningPrice = Math.round(runningPrice * (1 - d / 100) * 100) / 100;
      }
      const rowTotal = Math.round(Math.max(0, runningPrice) * 100) / 100;
      const rowDiscountAmount =
        Math.round(Math.max(0, rowSubtotal - rowTotal) * 100) / 100;
      const effectiveDiscountPercent =
        rowSubtotal > 0
          ? Math.round((rowDiscountAmount / rowSubtotal) * 10000) / 100
          : 0;

      sub = Math.round((sub + rowTotal) * 100) / 100;

      return {
        ...it,
        rowSubtotal,
        rowDiscountAmount,
        rowTotal,
        activeDiscounts,
        effectiveDiscountPercent,
      };
    });

    const receiptDisc = Math.max(0, Number(receiptDiscount) || 0);
    const tot = Math.round(Math.max(0, sub - receiptDisc) * 100) / 100;
    const paid = Math.max(0, Number(paidAmount) || 0);
    const due = Math.round(Math.max(0, tot - paid) * 100) / 100;

    return {
      calculatedRows: rows,
      subTotal: sub,
      totalAmount: tot,
      dueAmount: due,
    };
  }, [items, receiptDiscount, paidAmount]);

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) {
      toast.error("This receipt is locked for editing");
      return;
    }

    // Customer Validation
    let customerPayload: any = {};
    if (selectedCustomerId) {
      customerPayload.customerId = selectedCustomerId;
      if (customerPhone.trim()) {
        customerPayload.customerPhone = customerPhone.trim();
        customerPayload.countryCode = customerCountryCode;
      }
      if (customerName.trim()) {
        customerPayload.customerName = customerName.trim();
      }
      if (customerAddress.trim()) {
        customerPayload.customerAddress = customerAddress.trim();
      }
      if (customerEmail.trim()) {
        customerPayload.customerEmail = customerEmail.trim();
      }
    } else {
      if (!customerPhone.trim()) {
        toast.error("Customer phone number is required");
        return;
      }
      customerPayload.countryCode = customerCountryCode;
      customerPayload.customerPhone = customerPhone.trim();
      customerPayload.customerName = customerName.trim() || undefined;
      customerPayload.customerEmail = customerEmail.trim() || undefined;
      customerPayload.customerAddress = customerAddress.trim() || undefined;
    }

    // Items Validation
    if (items.length === 0) {
      toast.error("Please add at least one product item");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.productName.trim()) {
        toast.error(`Item #${i + 1} must have a product name`);
        return;
      }
      if (Number(it.quantity) <= 0) {
        toast.error(`Item #${i + 1} quantity must be greater than 0`);
        return;
      }
      if (Number(it.sellingPrice) < 0) {
        toast.error(`Item #${i + 1} selling price cannot be negative`);
        return;
      }
    }

    const seenProductIds = new Set<string>();
    const seenCustomNames = new Set<string>();
    for (const it of items) {
      if (it.productId) {
        if (seenProductIds.has(it.productId)) {
          const first = items.find((row) => row.productId === it.productId);
          toast.error(
            "Duplicate product on receipt; each product can only appear once",
          );
          if (first) focusExistingItemRow(first.tempId);
          return;
        }
        seenProductIds.add(it.productId);
        continue;
      }
      const nameKey = normalizeProductName(it.productName);
      if (!nameKey) continue;
      if (seenCustomNames.has(nameKey)) {
        const first = items.find(
          (row) =>
            !row.productId &&
            normalizeProductName(row.productName) === nameKey,
        );
        toast.error(
          "Duplicate product on receipt; each product can only appear once",
        );
        if (first) focusExistingItemRow(first.tempId);
        return;
      }
      seenCustomNames.add(nameKey);
    }

    const payload = {
      ...customerPayload,
      items: items.map((it) => ({
        productId: it.productId || null,
        productName: it.productName.trim(),
        unit: it.unit,
        sellingPrice: Number(it.sellingPrice),
        quantity: Number(it.quantity),
        discounts: (it.discounts || [])
          .map((d) => Number(d) || 0)
          .filter((d) => d > 0),
      })),
      discount: Number(receiptDiscount) || 0,
      paidAmount: Number(paidAmount) || 0,
      note: note.trim() || null,
    };

    try {
      if (isEditing && initialData) {
        await updateReceipt({ id: initialData.id, body: payload }).unwrap();
        toast.success("Receipt updated successfully!");
        if (onSaveSuccess) {
          onSaveSuccess();
        } else {
          router.push(`/receipts/${initialData.id}`);
        }
      } else {
        const res: any = await createReceipt(payload).unwrap();
        toast.success("Receipt created successfully!");
        const createdReceipt = res?.data?.receipt ?? res?.data;
        const createdId = createdReceipt?.id as string | undefined;
        if (Array.isArray(res?.data?.warnings)) {
          res.data.warnings.forEach((w: string) => toast.warning(w));
        }
        router.push(createdId ? `/receipts/${createdId}` : "/receipts");
      }
    } catch (err) {
      toast.error(errorMessageGenerator(err));
    }
  };

  return (
    <>
      <form id="receipt-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Top Header Actions (Sticky bar for quick access in Edit/Create mode) */}
        {!isDetails && (
          <div className="sticky top-2 z-30 flex items-center justify-between gap-3 p-3 -mx-2 rounded-xl bg-background/95 backdrop-blur border border-border shadow-xs">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors h-8 px-2 cursor-pointer"
            >
              <ArrowLeft className="size-3.5" />
              <span className="hidden sm:inline">Go Back</span>
            </Button>

            {/* Top Right Action Buttons (Cancel + Update / Create) */}
            {!isLocked && (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isCreating || isUpdating}
                  onClick={() => {
                    if (isEditing && initialData) {
                      router.push(`/receipts/${initialData.id}`);
                    } else {
                      router.push("/receipts");
                    }
                  }}
                  className="h-8 px-3 text-xs font-medium cursor-pointer"
                >
                  <X className="size-3.5 mr-1" /> Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isCreating || isUpdating}
                  className="h-8 px-4 text-xs font-semibold shadow-xs cursor-pointer gap-1.5"
                >
                  {isCreating || isUpdating ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="size-3.5" />
                      <span>
                        {isEditing ? "Update Receipt" : "Create Receipt"}
                      </span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="space-y-6">
          {/* Customer Selection Card */}
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <User className="size-4 text-primary" /> Customer Details
                </CardTitle>
                <div className="flex items-center gap-2">
                  {selectedCustomerId && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 border border-emerald-500/20">
                      <CheckCircle2 className="size-3.5" /> Customer Linked
                    </span>
                  )}
                  {isLocked ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 cursor-help">
                          <Badge
                            variant="outline"
                            className="text-xs gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium cursor-help"
                          >
                            <Lock className="size-3" /> Locked
                          </Badge>
                          <span className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors inline-flex items-center">
                            <Info className="size-3.5" />
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        align="end"
                        className="max-w-xs text-xs p-2.5"
                      >
                        <p className="font-semibold text-foreground mb-0.5">
                          {isApproved ? "Approved Receipt" : "Receipt Locked"}
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                          {isApproved
                            ? "This receipt has been approved. Product and billing edits are locked, but installment payments can still be added or updated below."
                            : "This receipt is in view mode. Product and billing edits are locked."}
                          {isAdmin && (
                            <span className="block mt-1 font-medium text-primary">
                              As an Admin, you can still edit this receipt using
                              the Edit button.
                            </span>
                          )}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  ) : isCustomerLocked ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUnlockCustomer}
                      className="h-8 px-2.5 text-xs rounded-xl border-border/60 hover:bg-accent flex items-center gap-1 cursor-pointer"
                      title="Unlock fields to edit details manually"
                    >
                      <Unlock className="size-3.5 text-primary" /> Edit / Unlock
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        isLocked ||
                        isLookingUp ||
                        isCreatingCustomer ||
                        !customerPhone ||
                        customerPhone.length < 4
                      }
                      onClick={handleConfirmCustomer}
                      className="h-8 px-3 text-xs rounded-xl border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 cursor-pointer"
                      title="Verify existing customer or register new customer"
                    >
                      {isLookingUp || isCreatingCustomer ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="size-3.5 mr-1" />
                          Confirm
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Customer Name (React Select) */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="customer-name"
                    className="text-sm font-medium"
                  >
                    Customer Name <span className="text-destructive">*</span>
                  </Label>
                  <CustomerSelect
                    customers={customers}
                    selectedCustomerId={selectedCustomerId}
                    valueName={customerName}
                    onSelectCustomer={handleSelectCustomer}
                    onNameChange={handleNameChange}
                    onClear={handleClearCustomer}
                    disabled={isLocked}
                    isLoading={isCustomersLoading}
                    placeholder="Search customer by name or phone, or type new..."
                  />
                </div>

                {/* 2. Customer Phone Number */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="customer-phone"
                    className="text-sm font-medium"
                  >
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <CustomPhoneInput
                    name="customer-phone"
                    country="bd"
                    disabled={isLocked || isCustomerLocked}
                    value={
                      customerPhone
                        ? customerPhone.startsWith("+")
                          ? customerPhone
                          : `${customerCountryCode}${customerPhone}`
                        : customerCountryCode
                    }
                    onChange={(val: string, data: any) => {
                      if (data && data.dialCode) {
                        setCustomerCountryCode(`+${data.dialCode}`);
                        const raw = val.slice(data.dialCode.length).trim();
                        setCustomerPhone(raw);
                      } else {
                        setCustomerPhone(val);
                      }
                      if (selectedCustomerId && !isCustomerLocked) {
                        setSelectedCustomerId(null);
                      }
                    }}
                  />
                </div>

                {/* 3. Customer Email */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="customer-email"
                    className="text-sm font-medium"
                  >
                    Email (Optional)
                  </Label>
                  <Input
                    id="customer-email"
                    type="email"
                    placeholder="e.g. rahim@example.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    disabled={isLocked || isCustomerLocked}
                  />
                </div>

                {/* 4. Customer Address */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="customer-address"
                    className="text-sm font-medium"
                  >
                    Address (Optional)
                  </Label>
                  <Input
                    id="customer-address"
                    placeholder="e.g. Dhanmondi, Dhaka"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    disabled={isLocked || isCustomerLocked}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dynamic Product Items Card */}
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="pb-3 border-b border-border/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Receipt className="size-4 text-primary" /> Receipt Items &
                  Billing ({items.length})
                </CardTitle>
                {isLocked && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 cursor-help">
                        <Badge
                          variant="outline"
                          className="text-xs gap-1 border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium cursor-help"
                        >
                          <Lock className="size-3" /> Locked
                        </Badge>
                        <span className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors inline-flex items-center">
                          <Info className="size-3.5" />
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="end"
                      className="max-w-xs text-xs p-2.5"
                    >
                      <p className="font-semibold text-foreground mb-0.5">
                        {isApproved ? "Approved Receipt" : "Receipt Locked"}
                      </p>
                      <p className="text-muted-foreground leading-relaxed">
                        {isApproved
                          ? "This receipt has been approved. Product and billing edits are locked, but installment payments can still be added or updated below."
                          : "This receipt is in view mode. Product and billing edits are locked."}
                        {isAdmin && (
                          <span className="block mt-1 font-medium text-primary">
                            As an Admin, you can still edit this receipt using
                            the Edit button.
                          </span>
                        )}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {/* Desktop Column Headers for Clean 1-Line Table View */}
              <div className="hidden md:grid md:grid-cols-[2rem_3.4fr_1.2fr_1.1fr_1.5fr_2.8fr_1.6fr] gap-2 px-3 py-1 text-xs font-semibold text-muted-foreground border-b border-border/40">
                <div className="text-center">#</div>
                <div>Product Name *</div>
                <div>Unit</div>
                <div className="text-right">Qty *</div>
                <div className="text-right">Price (৳) *</div>
                <div>Disc (%)</div>
                <div className="text-right">Total (৳)</div>
              </div>

              {calculatedRows.map((it, index) => {
                const totalRequestedForThisProduct = it.productId
                  ? productAggregatedQuantities.get(it.productId) || 0
                  : 0;
                const hasStockWarning =
                  it.productId &&
                  it.availableStock !== null &&
                  it.availableStock !== undefined &&
                  totalRequestedForThisProduct > it.availableStock;

                return (
                  <div
                    key={it.tempId}
                    ref={(el) => {
                      itemRowRefs.current.set(it.tempId, el);
                    }}
                    className={`relative rounded-xl border p-2.5 space-y-2 transition-colors ${
                      highlightedTempId === it.tempId
                        ? "receipt-item-row-highlight border-primary"
                        : hasStockWarning
                          ? "border-amber-500/60 bg-amber-500/5 dark:bg-amber-500/10"
                          : "border-border/70 bg-card hover:border-border"
                    }`}
                  >
                    {/* Top-Right Corner Actions: Stock Warning Tooltip & Cross Button */}
                    <div className="absolute -top-2.5 -right-2.5 z-10 flex items-center gap-1.5">
                      {hasStockWarning && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className="size-5 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-xs cursor-help border border-amber-600/30 transition-transform hover:scale-110"
                              aria-label="Stock shortage warning"
                            >
                              <AlertTriangle className="size-3 text-white stroke-[2.5]" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            align="end"
                            className="bg-popover text-popover-foreground border border-amber-500/30 shadow-lg p-2.5 rounded-xl max-w-xs"
                          >
                            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold text-xs mb-1">
                              <AlertTriangle className="size-3.5 shrink-0" />
                              <span>Stock Shortage Warning</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-snug">
                              Requested total{" "}
                              <strong className="text-foreground font-mono">
                                {totalRequestedForThisProduct} {it.unit}
                              </strong>{" "}
                              exceeds available stock (
                              <strong className="text-foreground font-mono">
                                {it.availableStock} {it.unit}
                              </strong>
                              ).
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {items.length > 1 && !isLocked && (
                        <ConfirmPopup
                          title="Remove Product"
                          description={`Are you sure you want to remove ${
                            it.productName
                              ? `"${it.productName}"`
                              : "this product"
                          } from the receipt?`}
                          confirmLabel="Remove"
                          cancelLabel="Cancel"
                          destructive
                          side="top"
                          align="end"
                          onConfirm={() => handleRemoveItem(it.tempId)}
                        >
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={isLocked}
                            className="size-5 rounded-full bg-background border border-border shadow-xs hover:bg-destructive hover:text-destructive-foreground hover:border-destructive text-muted-foreground transition-all cursor-pointer"
                            title="Remove product"
                          >
                            <X className="size-3" />
                          </Button>
                        </ConfirmPopup>
                      )}
                    </div>

                    {/* All Inputs in One Single Line (on md+) */}
                    <div className="grid grid-cols-1 md:grid-cols-[2rem_3.4fr_1.2fr_1.1fr_1.5fr_2.8fr_1.6fr] gap-2 items-center">
                      {/* 0. Row index */}
                      <div className="flex items-center gap-2 md:justify-center">
                        <span className="md:hidden text-[11px] font-medium text-muted-foreground">
                          #
                        </span>
                        <span className="inline-flex size-6 items-center justify-center rounded-md bg-muted text-[11px] font-mono font-semibold text-muted-foreground">
                          {index + 1}
                        </span>
                      </div>

                      {/* 1. Merged Product Name & Selection (React Select) */}
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground md:hidden block mb-1">
                          Product Name *
                        </label>
                        <ProductSelect
                          products={products}
                          selectedProductId={it.productId}
                          valueName={it.productName}
                          onSelectProduct={(prod) =>
                            handleSelectProduct(it.tempId, prod)
                          }
                          onNameChange={(name) =>
                            handleCustomProductNameChange(it.tempId, name)
                          }
                          onClear={() => handleClearProduct(it.tempId)}
                          disabled={isLocked || isProductsLoading}
                          placeholder="Search product or type custom name..."
                        />
                      </div>

                      {/* 2. Unit (Locked when product selected from DB, unlocked if custom or cleared) */}
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground md:hidden block mb-1">
                          Unit
                        </label>
                        <Select
                          value={it.unit}
                          onValueChange={(val) =>
                            handleItemChange(
                              it.tempId,
                              "unit",
                              val as ProductUnit,
                            )
                          }
                          disabled={isLocked || it.productId !== null}
                        >
                          <SelectTrigger className="w-full h-8 text-xs font-mono rounded-2xl bg-input/50 border-transparent disabled:opacity-60">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PRODUCT_UNITS.map((u) => (
                              <SelectItem
                                key={u}
                                value={u}
                                className="text-xs font-mono"
                              >
                                {u}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 3. Quantity */}
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground md:hidden block mb-1">
                          Qty *
                        </label>
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          value={it.quantity}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "" || /^\d*\.?\d*$/.test(v)) {
                              handleItemChange(it.tempId, "quantity", v);
                            }
                          }}
                          disabled={isLocked}
                          className="text-xs font-mono text-right"
                        />
                      </div>

                      {/* 4. Unit Price (Editable!) */}
                      <div>
                        <label className="text-[11px] font-medium text-muted-foreground md:hidden block mb-1">
                          Price (৳) *
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={it.sellingPrice}
                          onChange={(e) =>
                            handleItemChange(
                              it.tempId,
                              "sellingPrice",
                              e.target.value,
                            )
                          }
                          disabled={isLocked}
                          className="text-xs font-mono text-right"
                        />
                      </div>

                      {/* 5. Multiple Discounts % */}
                      <div>
                        <div className="flex items-center justify-between mb-1 md:hidden">
                          <label className="text-[11px] font-medium text-muted-foreground">
                            Disc (%)
                          </label>
                          {it.activeDiscounts.length > 1 && (
                            <span className="text-[10px] font-mono text-primary font-medium">
                              Eff: {it.effectiveDiscountPercent}%
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {it.discounts.map((discVal, dIdx) => (
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
                                  handleDiscountChange(
                                    it.tempId,
                                    dIdx,
                                    e.target.value,
                                  )
                                }
                                disabled={isLocked}
                                className={`h-8 text-xs font-mono text-right ${
                                  it.discounts.length > 1 ? "w-14 pr-4" : "w-16"
                                }`}
                                title={`Discount #${dIdx + 1} (%)`}
                              />
                              {!isLocked && it.discounts.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveDiscountField(it.tempId, dIdx)
                                  }
                                  className="absolute right-1 text-muted-foreground hover:text-destructive transition-colors p-0.5 cursor-pointer"
                                  title="Remove discount tier"
                                >
                                  <X className="size-2.5" />
                                </button>
                              )}
                            </div>
                          ))}

                          {!isLocked && it.discounts.length < 4 && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    handleAddDiscountField(it.tempId)
                                  }
                                  className="size-7 rounded-md border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary shrink-0 transition-colors"
                                  title="Add another discount tier"
                                >
                                  <Plus className="size-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                Add discount tier ({it.discounts.length}/4)
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>

                        {it.activeDiscounts.length > 1 && (
                          <div className="hidden md:flex items-center gap-1 mt-0.5">
                            <span className="text-[10px] font-mono text-primary font-medium">
                              Eff: {it.effectiveDiscountPercent}%
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              (-৳{it.rowDiscountAmount})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* 6. Total */}
                      <div className="text-right">
                        <label className="text-[11px] font-medium text-muted-foreground md:hidden block mb-1">
                          Total (৳)
                        </label>
                        <span className="text-sm font-semibold font-mono text-foreground block">
                          ৳{it.rowTotal}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!isLocked && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddItem}
                  className="gap-1 text-xs w-full border-dashed"
                >
                  <Plus className="size-3.5" /> Add Product
                </Button>
              )}

              {/* Billing & Payment Calculations */}
              <div className="pt-5 mt-4 border-t border-border/70 space-y-4 text-sm">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Items Subtotal:</span>
                  <span className="font-mono font-semibold text-foreground pr-[11px]">
                    ৳{subTotal}
                  </span>
                </div>

                {/* Solid Receipt-Level Discount */}
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/60">
                  <Label
                    htmlFor="receipt-discount"
                    className="text-xs text-muted-foreground"
                  >
                    Receipt Discount (৳)
                  </Label>
                  <div className="w-40 sm:w-52">
                    <Input
                      id="receipt-discount"
                      type="number"
                      step="1"
                      min="0"
                      max={subTotal}
                      placeholder="0"
                      value={receiptDiscount}
                      onChange={(e) => setReceiptDiscount(e.target.value)}
                      disabled={isLocked}
                      className="font-mono text-xs text-right"
                    />
                  </div>
                </div>

                {/* Total Amount */}
                <div className="flex justify-between items-center text-base font-bold pt-2 border-t border-border/60 text-foreground">
                  <span>Net Total:</span>
                  <span className="font-mono text-primary text-lg pr-[11px]">
                    ৳{totalAmount}
                  </span>
                </div>

                {/* Paid Amount */}
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-border/60">
                  <Label
                    htmlFor="paid-amount"
                    className="text-xs text-muted-foreground"
                  >
                    Paid Amount (৳)
                  </Label>
                  <div className="w-40 sm:w-52">
                    <Input
                      id="paid-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      disabled={isLocked}
                      className="font-mono text-xs text-right"
                    />
                  </div>
                </div>

                {/* Payment History & Inline Add Payment (Placed under Paid Amount, above Remaining Due) */}
                {(isEditing || isDetails) && initialData && (
                  <div className="pt-3 border-t border-border/60 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Clock className="size-3" /> Payment History (
                        {payments.length})
                      </span>
                      {dueAmount > 0 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1.5 text-primary border-primary/40 hover:bg-primary/10"
                          onClick={handleOpenAddPayment}
                        >
                          <Banknote className="size-3.5" /> Add Payment
                        </Button>
                      )}
                    </div>

                    {sortedPayments.length > 0 ? (
                      <div className="space-y-3">
                        {sortedPayments.map((p) => {
                          const isApprovedPayment = p.status === "APPROVED";
                          return (
                            <div
                              key={p.id}
                              className="relative rounded-xl border border-border/70 bg-card p-3 transition-colors hover:border-border"
                            >
                              {/* Top-Right Corner Action Buttons (Like Product Row) */}
                              <div className="absolute -top-2.5 -right-2.5 z-10 flex items-center gap-1">
                                {/* Approve Button (Only Admin and Super Admin, when not approved) */}
                                {isAdmin && !isApprovedPayment && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="size-5 rounded-full bg-background border border-border shadow-xs hover:bg-emerald-600 hover:text-white hover:border-emerald-600 text-emerald-600 transition-all cursor-pointer"
                                    title="Approve Payment"
                                    onClick={() => handleApprovePayment(p.id)}
                                    disabled={isApprovingPayment}
                                  >
                                    <Check className="size-3" />
                                  </Button>
                                )}

                                {/* Edit Button (Only when not approved) */}
                                {!isApprovedPayment && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="size-5 rounded-full bg-background border border-border shadow-xs hover:bg-primary hover:text-primary-foreground hover:border-primary text-muted-foreground transition-all cursor-pointer"
                                    title="Edit Payment"
                                    onClick={() => handleOpenEditPayment(p)}
                                  >
                                    <Pencil className="size-2.5" />
                                  </Button>
                                )}

                                {/* Delete Button with Popover Warning (Only when not approved) */}
                                {!isApprovedPayment && (
                                  <ConfirmPopup
                                    title="Delete Payment"
                                    description={`Are you sure you want to delete this payment of ৳${p.amount}? The receipt remaining due will be recalculated.`}
                                    confirmLabel="Delete"
                                    cancelLabel="Cancel"
                                    destructive
                                    side="top"
                                    align="end"
                                    onConfirm={() => handleDeletePayment(p.id)}
                                  >
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      className="size-5 rounded-full bg-background border border-border shadow-xs hover:bg-destructive hover:text-destructive-foreground hover:border-destructive text-muted-foreground transition-all cursor-pointer"
                                      title="Delete Payment"
                                      disabled={isDeletingPayment}
                                    >
                                      <X className="size-3" />
                                    </Button>
                                  </ConfirmPopup>
                                )}
                              </div>

                              {/* Card Content: Left side (Date, By Name, Status, Note) & Right side (Price) */}
                              <div className="flex items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-foreground">
                                      {formatDateTime(p.createdAt)}
                                    </span>
                                    {isApprovedPayment ? (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0 h-4 font-medium border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                                      >
                                        Approved
                                      </Badge>
                                    ) : (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0 h-4 font-medium border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                                      >
                                        Pending
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                                    {p.createdBy && (
                                      <span>
                                        By {p.createdBy.firstName}{" "}
                                        {p.createdBy.lastName}
                                      </span>
                                    )}
                                    {p.approvedBy && isApprovedPayment && (
                                      <span>
                                        (Approved by {p.approvedBy.firstName}{" "}
                                        {p.approvedBy.lastName})
                                      </span>
                                    )}
                                  </div>
                                  {p.note && (
                                    <p className="text-[11px] text-muted-foreground/90 italic mt-0.5">
                                      {p.note}
                                    </p>
                                  )}
                                </div>

                                {/* Right Side: Price */}
                                <div className="text-right shrink-0">
                                  <span className="font-bold text-base font-mono text-emerald-600 dark:text-emerald-400">
                                    +৳{p.amount}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic py-1">
                        No payments recorded yet.
                      </p>
                    )}
                  </div>
                )}

                {/* Remaining Due (Placed at bottom, UNDER all payments) */}
                <div className="flex justify-between items-center text-sm font-semibold pt-2 border-t border-border/60">
                  <span className="text-destructive">Remaining Due:</span>
                  <span className="font-mono text-base font-bold text-destructive pr-[11px]">
                    ৳{dueAmount}
                  </span>
                </div>

                {/* Receipt Note */}
                <div className="space-y-1.5 pt-2 border-t border-border/60">
                  <Label
                    htmlFor="receipt-note"
                    className="text-xs text-muted-foreground"
                  >
                    Receipt Note (Optional)
                  </Label>
                  <Textarea
                    id="receipt-note"
                    placeholder="e.g. Home delivery requested"
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    disabled={isLocked}
                    className="text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Back Action Banner in Read-only details / locked mode */}
          {isLocked && (
            <div className="pt-2">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-border/70 bg-muted/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Lock className="size-4 text-primary shrink-0" />
                  <span>
                    {isApproved
                      ? "This receipt is approved. Product and billing edits are locked, but installment payments can still be added or updated above."
                      : "Viewing receipt in read-only details mode."}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => router.back()}
                  className="gap-2 cursor-pointer"
                >
                  <ArrowLeft className="size-3.5" />
                  <span className="hidden sm:inline">Go Back</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </form>

      {initialData && (
        <PaymentModal
          open={isPaymentModalOpen}
          onOpenChange={setIsPaymentModalOpen}
          receiptId={initialData.id}
          receiptNumber={initialData.receiptNumber}
          totalAmount={totalAmount}
          paidAmount={Math.max(0, Number(paidAmount) || 0)}
          dueAmount={dueAmount}
          paymentToEdit={selectedPaymentToEdit}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
}
