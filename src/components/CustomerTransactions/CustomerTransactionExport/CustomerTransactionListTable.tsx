import React from "react";
import { TCustomerTransaction } from "@/types";
import {
  formatInvoiceMoney,
  formatSignedDue,
} from "@/utils/formatInvoiceMoney";

const formatDateOnly = (dateStr?: string) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTimeOnly = (dateStr?: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const thClass =
  "h-8 px-2 py-1.5 text-left align-middle text-[10px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap border-b border-slate-200 bg-slate-50";
const tdClass =
  "px-2 border-b border-slate-200/80 py-[6px] align-middle text-[10.5px] text-slate-900";

export default function CustomerTransactionListTable({
  transactions,
  startIndex = 0,
  empty = false,
  isCustomerSelected = false,
}: {
  transactions: TCustomerTransaction[];
  startIndex?: number;
  empty?: boolean;
  isCustomerSelected?: boolean;
}) {
  return (
    <table className="w-full caption-bottom text-sm border-collapse">
      <thead data-probe="header">
        <tr>
          <th className={`${thClass} w-7 text-center`}>#</th>
          <th className={`${thClass} whitespace-nowrap`}>Date & Time</th>
          <th className={thClass}>Type</th>
          <th className={`${thClass} text-right`}>Due</th>
          <th className={`${thClass} text-right`}>Cash</th>
          <th className={`${thClass} text-right`}>Balance</th>
          <th className={thClass}>Note</th>
          <th className={`${thClass} whitespace-nowrap`}>Invoice #</th>
        </tr>
      </thead>
      <tbody>
        {empty ? (
          <tr data-row="empty">
            <td
              colSpan={8}
              className={`${tdClass} text-center text-slate-500 italic py-6`}
            >
              No transactions found for this filter.
            </td>
          </tr>
        ) : (
          transactions.map((tx, idx) => {
            const isInvoice = tx.type === "INVOICE";
            const isPayment = tx.type === "PAYMENT";
            const isReturn = tx.type === "RETURN_INVOICE";

            const invoiceNumber = isReturn
              ? tx.returnInvoice?.returnNumber || tx.referenceNumber || "—"
              : tx.invoice?.invoiceNumber ||
                tx.payment?.invoice?.invoiceNumber ||
                (isInvoice ? tx.referenceNumber : null) ||
                "—";

            return (
              <tr
                key={tx.id}
                data-row="item"
                className={(startIndex + idx) % 2 === 1 ? "bg-muted" : ""}
              >
                <td
                  className={`${tdClass} text-center text-slate-500 font-mono`}
                >
                  {startIndex + idx + 1}
                </td>
                <td className={`${tdClass} whitespace-nowrap`}>
                  <p className="font-mono text-slate-800 text-[10px] font-medium leading-tight">
                    {formatDateOnly(tx.createdAt)}
                  </p>
                  <p className="font-mono text-slate-500 text-[9px] leading-tight mt-0.5">
                    {formatTimeOnly(tx.createdAt)}
                  </p>
                  {!isCustomerSelected && (
                    <p className="font-semibold text-slate-900 text-[10.5px] mt-1 truncate max-w-[150px]">
                      {tx.customer?.name || "Walk-in"}
                    </p>
                  )}
                </td>
                <td className={`${tdClass} whitespace-nowrap font-medium`}>
                  <span
                    className={`inline-block px-1.5 py-0.5 rounded text-[9.5px] font-semibold ${
                      isInvoice
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : isPayment
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {isInvoice ? "Invoice" : isPayment ? "Payment" : "Return"}
                  </span>
                </td>
                <td
                  className={`${tdClass} text-right font-mono font-medium whitespace-nowrap ${
                    tx.due > 0
                      ? "text-amber-700 font-semibold"
                      : "text-slate-400"
                  }`}
                >
                  {tx.due > 0 ? formatInvoiceMoney(tx.due) : "—"}
                </td>
                <td
                  className={`${tdClass} text-right font-mono font-medium whitespace-nowrap text-emerald-700`}
                >
                  {tx.cash > 0 ? formatInvoiceMoney(tx.cash) : "—"}
                </td>
                <td
                  className={`${tdClass} text-right font-mono font-medium whitespace-nowrap ${
                    tx.balance > 0
                      ? "text-rose-700 font-bold"
                      : tx.balance < 0
                        ? "text-emerald-700 font-bold"
                        : "text-slate-600"
                  }`}
                >
                  {formatSignedDue(tx.balance)}
                </td>
                <td
                  className={`${tdClass} text-[9.5px] text-slate-700 whitespace-pre-wrap break-words leading-relaxed`}
                >
                  {tx.note || tx.payment?.note || tx.invoice?.note || "—"}
                </td>
                <td
                  className={`${tdClass} font-mono text-[10.5px] font-semibold text-slate-800 whitespace-nowrap`}
                >
                  {invoiceNumber}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
