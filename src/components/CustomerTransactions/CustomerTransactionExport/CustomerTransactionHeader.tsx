import PDFViewHeader from "@/PDFViewHeader";
import { TCustomer, TShop } from "@/types";
import {
  formatInvoiceMoney,
  formatSignedDue,
} from "@/utils/formatInvoiceMoney";
import { ArrowLeftRight, Clock, Wallet, Scale } from "lucide-react";

export default function CustomerTransactionHeader({
  shop,
  filterLabel,
  customerName,
  selectedCustomer,
  dateRangeLabel,
  searchTerm,
  totalCount,
  totalDue = 0,
  totalCash = 0,
  totalBalance = 0,
}: {
  shop: TShop | null | undefined;
  filterLabel: string;
  customerName?: string;
  selectedCustomer?: TCustomer | null;
  dateRangeLabel?: string;
  searchTerm?: string;
  totalCount: number;
  totalDue?: number;
  totalCash?: number;
  totalBalance?: number;
}) {
  return (
    <div className="space-y-3">
      {/* Top Header Row */}
      <PDFViewHeader
        title="Customer Transactions"
        logo={shop?.logo}
        name={shop?.name}
        subtitle={shop?.proprietor}
      />

      {/* Professional Customer Details Card (When Customer is Selected) */}
      {selectedCustomer && (
        <div className="rounded-md border border-slate-200 bg-slate-50/70 p-3 text-xs">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Customer Statement / Account Details
              </span>
              <p className="text-sm font-bold text-slate-900">
                {selectedCustomer.name}
              </p>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-0.5 text-[11px] text-slate-600">
                <span>
                  <strong className="text-slate-700">Phone:</strong>{" "}
                  {selectedCustomer.countryCode || "+880"}{" "}
                  {selectedCustomer.phoneNumber}
                </span>
                {selectedCustomer.email && (
                  <span>
                    <strong className="text-slate-700">Email:</strong>{" "}
                    {selectedCustomer.email}
                  </span>
                )}
                {selectedCustomer.address && (
                  <span>
                    <strong className="text-slate-700">Address:</strong>{" "}
                    {selectedCustomer.address}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Total Due
              </span>
              <span
                className={`font-mono text-sm font-bold ${
                  (selectedCustomer.totalDue || 0) > 0
                    ? "text-rose-700"
                    : "text-emerald-700"
                }`}
              >
                {formatInvoiceMoney(selectedCustomer.totalDue || 0)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Meta Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-b border-slate-200 py-2 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {!selectedCustomer && customerName && (
            <p>
              <span className="font-semibold text-slate-800">Customer:</span>
              <span className="ml-1.5 text-slate-900 font-medium">
                {customerName}
              </span>
            </p>
          )}

          <p>
            <span className="font-semibold text-slate-800">Type:</span>
            <span className="ml-1.5 text-slate-900 font-medium">
              {filterLabel}
            </span>
          </p>

          {dateRangeLabel && (
            <p>
              <span className="font-semibold text-slate-800">Period:</span>
              <span className="ml-1.5 text-slate-900 font-medium">
                {dateRangeLabel}
              </span>
            </p>
          )}

          {searchTerm && (
            <p>
              <span className="font-semibold text-slate-800">Search:</span>
              <span className="ml-1.5 text-slate-900 font-medium">
                “{searchTerm}”
              </span>
            </p>
          )}
        </div>
      </div>

      {/* 4 Summary Status Cards (Matching Manage Customer Transactions Page) */}
      <div className="grid grid-cols-4 gap-2.5">
        {/* Total Transactions */}
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 border border-blue-100">
            <ArrowLeftRight className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 truncate">
              Total Transactions
            </p>
            <p className="font-mono text-xs sm:text-sm font-bold text-slate-900 truncate">
              {totalCount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Total Due */}
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600 border border-amber-100">
            <Clock className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 truncate">
              Total Due
            </p>
            <p className="font-mono text-xs sm:text-sm font-bold text-amber-700 truncate">
              {formatInvoiceMoney(totalDue)}
            </p>
          </div>
        </div>

        {/* Total Cash / Payment */}
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Wallet className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 truncate">
              Total Cash / Payment
            </p>
            <p className="font-mono text-xs sm:text-sm font-bold text-emerald-700 truncate">
              {formatInvoiceMoney(totalCash)}
            </p>
          </div>
        </div>

        {/* Present Due */}
        <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/70 p-2.5">
          <div
            className={`flex size-8 shrink-0 items-center justify-center rounded-md border ${
              totalBalance > 0
                ? "bg-rose-50 text-rose-600 border-rose-100"
                : "bg-purple-50 text-purple-600 border-purple-100"
            }`}
          >
            <Scale className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 truncate">
              Present Due
            </p>
            <p
              className={`font-mono text-xs sm:text-sm font-bold truncate ${
                totalBalance > 0
                  ? "text-rose-700"
                  : totalBalance < 0
                    ? "text-emerald-700"
                    : "text-slate-800"
              }`}
            >
              {formatSignedDue(totalBalance)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
