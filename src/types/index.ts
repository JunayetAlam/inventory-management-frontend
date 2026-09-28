import { BaseQueryApi } from "@reduxjs/toolkit/query";
import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export type UserRoleEnum = "SUPERADMIN" | "ADMIN" | "CASHIER";

export type UserStatus = "PENDING" | "ACTIVE" | "INACTIVE" | "BLOCKED";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  role: UserRoleEnum;
  status: UserStatus;
  bio?: string | null;
  location?: string | null;
  isAgreeWithTerms?: boolean;
  profilePhoto?: string | null;
  isEmailVerified?: boolean;
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
  name?: string;
}

export interface DeviceSession {
  id: string;
  ip: string | null;
  userAgent: string | null;
  lastSeenAt: string;
  expireAt: string;
  createdAt: string;
  isCurrent?: boolean;
}
export type TQueryParam = {
  name: string;
  value: boolean | React.Key;
};
export type TError = {
  data: {
    message: string;
    stack: string;
    success: boolean;
  };
  status: number;
};

export type TMeta = {
  limit: number;
  page: number;
  total: number;
  totalPage: number;
};

export type NotificationType =
  | "INFO"
  | "SUCCESS"
  | "WARNING"
  | "ERROR"
  | "DUE_REMINDER"
  | "PAYMENT_ALERT"
  | "SYSTEM";

export type NotificationTargetType =
  | "ALL"
  | "ADMINS"
  | "CASHIERS"
  | "SPECIFIC_USER";

export interface TNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  targetType: NotificationTargetType;
  link?: string | null;
  userId?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRoleEnum;
    profilePhoto?: string | null;
  } | null;
}

export type ProductUnit =
  | "KG"
  | "LITER"
  | "PIECE"
  | "GRAM"
  | "METER"
  | "BOX"
  | "PACKET"
  | "OTHER";

export interface TProduct {
  id: string;
  name: string;
  slug?: string | null;
  unit: ProductUnit;
  sellingPrice: number;
  buyingPrice?: number | null;
  stock: number;
  description?: string | null;
  isDeleted: boolean;
  isDeleteRequested: boolean;
  deleteRequestedAt?: string | null;
  deleteReason?: string | null;
  deleteRequestedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  updatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface TCustomerStatsPeriod {
  due: number;
  deposit: number;
}

export interface TCustomerStats {
  totalCustomers: number;
  totalDue: number;
  today?: TCustomerStatsPeriod;
  thisMonth?: TCustomerStatsPeriod;
  thisYear?: TCustomerStatsPeriod;
  total?: TCustomerStatsPeriod;
}

export interface TProductStats {
  totalProducts: number;
  totalStock: number;
  totalSoldQty: number;
  lowStockCount?: number;
}

export type ProductProfitSortField =
  | "name"
  | "soldQty"
  | "salesTotal"
  | "purchaseCost"
  | "profit"
  | "profitPercent"
  | "avgPurchase"
  | "avgSale";

export interface TProductProfitReceiptRef {
  id: string;
  receiptNumber: string;
  quantity: number;
}

export interface TProductProfitRow {
  productId: string;
  productName: string;
  unit: ProductUnit | string;
  soldQty: number;
  salesTotal: number;
  purchaseCost: number;
  /** Qty where buy was missing and sell unit price was used as cost */
  assumedBuyFromSellQty: number;
  /** @deprecated use assumedBuyFromSellQty */
  missingCostQty?: number;
  avgPurchase: number | null;
  avgSale: number | null;
  profit: number;
  profitPercent: number | null;
  receipts: TProductProfitReceiptRef[];
}

export interface TProductProfitSummary {
  soldQty: number;
  salesTotal: number;
  purchaseCost: number;
  profit: number;
  profitPercent: number | null;
  productCount: number;
}

export interface TProductProfitFilters {
  startDate: string | null;
  endDate: string | null;
  searchTerm: string | null;
  sortBy: ProductProfitSortField;
  sortOrder: "asc" | "desc";
  timezone: string;
}

export interface TProductProfitReport {
  products: TProductProfitRow[];
  summary: TProductProfitSummary;
  filters: TProductProfitFilters;
}

export interface TCustomer {
  id: string;
  name: string;
  countryCode?: string;
  phoneNumber: string;
  whatsappNumber?: string | null;
  image?: string | null;
  email?: string | null;
  address?: string | null;
  totalDue?: number;
  totalPaid?: number;
  totalDiscount?: number;
  totalRefunded?: number;
  totalRefundDue?: number;
  isDeleted: boolean;
  isDeleteRequested: boolean;
  deleteRequestedAt?: string | null;
  deleteReason?: string | null;
  deleteRequestedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  updatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export type TResponse<T> = {
  data?: T;
  error?: TError;
  meta?: TMeta;
  success: boolean;
  message: string;
};

export type TResponseRedux<T> = TResponse<T> & BaseQueryApi;

export type ReceiptStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface TReceiptItem {
  id: string;
  receiptId: string;
  productId?: string | null;
  productName: string;
  unit: ProductUnit;
  sellingPrice: number;
  buyingPrice?: number | null;
  quantity: number;
  discounts?: number[];
  discount?: number; // optional legacy percentage
  subTotal?: number;
  totalPrice: number;
  alreadyReturned?: number;
  remainingReturnable?: number;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    stock: number;
    unit: ProductUnit;
  } | null;
}

export interface TReceiptPayment {
  id: string;
  receiptId: string;
  amount: number;
  note?: string | null;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  createdById: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  approvedById?: string | null;
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  approvedAt?: string | null;
}

export interface TReceipt {
  id: string;
  receiptNumber: string;
  customerId: string;
  customer: {
    id: string;
    name: string;
    countryCode?: string;
    phoneNumber: string;
    email?: string | null;
    address?: string | null;
  };
  subTotal: number;
  discount: number; // solid receipt-level discount
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: ReceiptStatus;
  note?: string | null;
  isDeleted: boolean;
  isDeleteRequested: boolean;
  deleteRequestedAt?: string | null;
  deleteReason?: string | null;
  deleteRequestedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
  items: TReceiptItem[];
  payments: TReceiptPayment[];
  returnInvoices?: TReturnInvoice[];
  _count?: {
    items: number;
    payments: number;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
  updatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface TReceiptFormItem {
  productId?: string | null;
  productName: string;
  unit: ProductUnit;
  sellingPrice: number;
  quantity: number;
  discounts?: (number | string)[];
  discount?: number; // percentage
  availableStock?: number | null; // for live stock tracking
}

export interface TReturnInvoiceItem {
  id: string;
  returnInvoiceId: string;
  receiptId: string;
  receiptItemId: string;
  productId?: string | null;
  productName: string;
  unit: ProductUnit;
  sellingPrice: number;
  quantity: number;
  discounts?: number[];
  discount?: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    stock: number;
    unit: ProductUnit;
  } | null;
  receiptItem?: {
    id: string;
    productName: string;
    quantity: number;
    sellingPrice: number;
    discounts?: number[];
    discount?: number;
    unit: ProductUnit;
  } | null;
}

/** Derived money fields — computed on the server from product lines + chain. */
export interface TReturnInvoiceMoney {
  subTotal: number;
  totalAmount: number;
  previousDueAmount: number;
  dueRefundAmount: number;
}

export interface TPreviousPosition {
  netDue: number;
  netRefundable: number;
}

/** Same shape — bill position after applying this return. */
export type TCurrentPosition = TPreviousPosition;

export interface TPreviousReturnSummary extends TReturnInvoiceMoney {
  id: string;
  returnNumber: string;
  discount: number;
  refundedAmount: number;
  createdAt?: string;
}

export interface TReturnInvoice extends TReturnInvoiceMoney {
  id: string;
  returnNumber: string;
  receiptId: string;
  previousReturnInvoiceId?: string | null;
  previousReturnInvoice?: TPreviousReturnSummary | null;
  receipt?: {
    id: string;
    receiptNumber: string;
    customerId?: string;
    totalAmount?: number;
    paidAmount?: number;
    dueAmount?: number;
    customer?: {
      id: string;
      name: string;
      countryCode?: string;
      phoneNumber: string;
      email?: string | null;
      address?: string | null;
    };
  } | null;
  discount: number;
  refundedAmount: number;
  status: ReceiptStatus;
  note?: string | null;
  isDeleted: boolean;
  isDeleteRequested: boolean;
  deleteRequestedAt?: string | null;
  deleteReason?: string | null;
  deleteRequestedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
  /** True when this is the latest active return on its receipt (LIFO tip). */
  isLatest?: boolean;
  /** True when a soft-deleted return can be restored (no newer active exists). */
  canRestore?: boolean;
  /** Bill position before this return: customer due or shop refundable. */
  previousPosition?: TPreviousPosition;
  /** Bill position after this return's credit + cash refund. */
  currentPosition?: TCurrentPosition;
  items: TReturnInvoiceItem[];
  _count?: {
    items: number;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
  updatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface TReturnableReceiptItem {
  receiptItemId: string;
  productId?: string | null;
  productName: string;
  unit: ProductUnit;
  sellingPrice: number;
  discounts?: number[];
  discount?: number;
  originalQuantity: number;
  alreadyReturned: number;
  remainingReturnable: number;
  product?: {
    id: string;
    name: string;
    stock: number;
    unit: ProductUnit;
  } | null;
}

export interface TShop {
  id: string;
  name: string;
  proprietor?: string | null;
  logo?: string | null;
  phoneNumbers: string[];
  emails: string[];
  locations: string[];
  createdById?: string | null;
  updatedById?: string | null;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
  updatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export type TCustomerTransactionType = "RECEIPT" | "PAYMENT" | "RETURN_INVOICE";

export interface TCustomerTransaction {
  id: string;
  customerId: string;
  type: TCustomerTransactionType;
  receiptId?: string | null;
  paymentId?: string | null;
  returnInvoiceId?: string | null;
  note?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
  due: number;
  cash: number;
  balance: number;
  transactionAmount?: number;
  cashAmount?: number;
  dueAmount?: number;
  referenceNumber: string;
  customer: {
    id: string;
    name: string;
    phoneNumber: string;
    countryCode?: string;
    email?: string | null;
    image?: string | null;
  };
  receipt?: {
    id: string;
    receiptNumber: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    status: ReceiptStatus;
    note?: string | null;
    createdAt: string;
  } | null;
  payment?: {
    id: string;
    receiptId?: string | null;
    receipt?: {
      id: string;
      receiptNumber: string;
    } | null;
    amount: number;
    note?: string | null;
    status: ReceiptStatus;
    createdAt: string;
    createdBy?: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  } | null;
  returnInvoice?: {
    id: string;
    returnNumber: string;
    receiptId?: string | null;
    receipt?: {
      id: string;
      receiptNumber: string;
    } | null;
    refundedAmount: number;
    discount: number;
    status: ReceiptStatus;
    note?: string | null;
    createdAt: string;
  } | null;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
}

export interface TCustomerTransactionStats {
  totalTransactions: number;
  totalDue: number;
  totalPayment: number;
  totalBalance: number;
}
