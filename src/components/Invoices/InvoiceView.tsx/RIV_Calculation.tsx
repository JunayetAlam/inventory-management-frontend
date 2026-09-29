import { TInvoice } from "@/types";
import { formatInvoiceDate } from "@/utils/formatInvoiceDate";
import { formatInvoiceMoney } from "@/utils/formatInvoiceMoney";
import { deriveInvoiceSettlement } from "@/utils/deriveInvoiceSettlement";
import React from "react";

export default function RIV_Calculation({ invoice }: { invoice: TInvoice }) {
  const sortedPayments = [...(invoice.payments || [])]
    .filter((p) => p.status !== "REJECTED")
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  const returns = (invoice.returnInvoices || []).filter((r) => !r.isDeleted);
  const hasReturns = returns.length > 0;

  const totalCredits = returns.reduce(
    (sum, r) => sum + (Number(r.totalAmount) || 0),
    0,
  );
  const totalRefunded = returns.reduce(
    (sum, r) => sum + (Number(r.refundedAmount) || 0),
    0,
  );

  const settlement = deriveInvoiceSettlement({
    invoiceTotal: Number(invoice.totalAmount) || 0,
    paidAmount: Number(invoice.paidAmount) || 0,
    creditsBefore: totalCredits,
    thisCredit: 0,
    refundedBefore: totalRefunded,
    thisRefunded: 0,
  });

  return (
    <div
      className="flex justify-end pt-1 pr-2.5"
      style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
    >
      <div className="w-full sm:w-1/2 print:w-1/2 space-y-1 text-xs">
        <div className="flex justify-between items-center text-slate-700">
          <span className="font-semibold text-sm">Subtotal</span>
          <span className="font-mono font-semibold text-sm text-slate-900">
            {formatInvoiceMoney(invoice.subTotal)}
          </span>
        </div>

        {invoice.discount > 0 && (
          <div className="flex justify-between items-center text-slate-700">
            <span className="font-semibold text-sm">Discount</span>
            <span className="font-mono font-semibold text-sm text-rose-600">
              -{formatInvoiceMoney(invoice.discount)}
            </span>
          </div>
        )}

        <div className="flex justify-between items-center text-slate-900 pt-1 border-t border-slate-200">
          <span className="font-semibold text-sm">Net Total</span>
          <span className="font-mono font-bold text-sm text-slate-900">
            {formatInvoiceMoney(invoice.totalAmount)}
          </span>
        </div>

        {sortedPayments.length > 0 ? (
          sortedPayments.map((p, idx) => (
            <div
              key={p.id || idx}
              className="flex justify-between items-center text-slate-700"
            >
              <span className="font-semibold text-sm">
                Paid ({formatInvoiceDate(p.createdAt)})
              </span>
              <span className="font-mono font-semibold text-sm text-emerald-700">
                {formatInvoiceMoney(p.amount)}
              </span>
            </div>
          ))
        ) : (
          <div className="flex justify-between items-center text-slate-700">
            <span className="font-semibold text-sm">
              Paid ({formatInvoiceDate(invoice.createdAt)})
            </span>
            <span className="font-mono font-semibold text-sm text-emerald-700">
              {formatInvoiceMoney(invoice.paidAmount)}
            </span>
          </div>
        )}

        {/* Without returns: original sale balance. With returns: settled below. */}
        {!hasReturns && (
          <div className="flex justify-between items-center text-slate-900 border-t-2 border-slate-900">
            <span className="font-bold text-base">Total Due</span>
            <span
              className={`font-mono font-extrabold text-xl ${
                invoice.dueAmount > 0 ? "text-rose-600" : "text-slate-900"
              }`}
            >
              {formatInvoiceMoney(invoice.dueAmount)}
            </span>
          </div>
        )}

        {hasReturns && (
          <div className="pt-3 mt-2 border-t border-dashed border-slate-300 space-y-1.5">
            <p className="font-bold text-sm text-slate-900 tracking-wide">
              Returns
            </p>
            {returns.map((ret) => {
              const credit = Number(ret.totalAmount) || 0;
              const discount = Number(ret.discount) || 0;
              const refunded = Number(ret.refundedAmount) || 0;
              const subTotal =
                Number(ret.subTotal) ||
                Math.round((credit + discount) * 100) / 100;

              return (
                <div key={ret.id} className="space-y-0.5 pb-1">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-semibold text-xs">
                      {ret.returnNumber}{" "}
                      <span className="font-normal text-slate-500">
                        ({formatInvoiceDate(ret.createdAt)})
                      </span>
                    </span>
                    <span className="font-mono font-semibold text-xs text-slate-700">
                      {formatInvoiceMoney(subTotal)}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between items-center text-slate-500 pl-0.5">
                      <span className="text-[10px]">Discount</span>
                      <span className="font-mono text-[10px] text-rose-600">
                        -{formatInvoiceMoney(discount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-slate-700 pl-0.5">
                    <span className="text-[10px] font-semibold">Net Credit</span>
                    <span className="font-mono text-[10px] font-semibold text-rose-600">
                      -{formatInvoiceMoney(credit)}
                    </span>
                  </div>
                  {refunded > 0 && (
                    <div className="flex justify-between items-center text-slate-700 pl-0.5">
                      <span className="text-[10px] font-semibold">
                        Refunded
                      </span>
                      <span className="font-mono text-[10px] font-semibold text-emerald-700">
                        {formatInvoiceMoney(refunded)}
                      </span>
                    </div>
                  )}
                  {/* Product details of what returned - skipped for return invoice */}
                  {/* {(ret.items || []).length > 0 && (
                    <p className="text-[10px] text-slate-500 leading-snug pl-0.5">
                      {(ret.items || [])
                        .map((it) => `${it.productName} × ${it.quantity}`)
                        .join(", ")}
                    </p>
                  )} */}
                </div>
              );
            })}

            <div className="flex justify-between items-center text-slate-800 pt-1 border-t border-slate-200">
              <span className="font-semibold text-sm">Total Returned</span>
              <span className="font-mono font-bold text-sm text-rose-600">
                -{formatInvoiceMoney(settlement.totalCredits)}
              </span>
            </div>

            {settlement.totalRefunded > 0 && (
              <div className="flex justify-between items-center text-slate-800">
                <span className="font-semibold text-sm">Total Refunded</span>
                <span className="font-mono font-bold text-sm text-emerald-700">
                  {formatInvoiceMoney(settlement.totalRefunded)}
                </span>
              </div>
            )}

            <div className="pt-1.5 space-y-1 border-t border-slate-200">
              <div className="flex justify-between items-center text-slate-900">
                <span className="font-semibold text-sm">
                  Net Sale After Returns
                </span>
                <span className="font-mono font-bold text-sm">
                  {formatInvoiceMoney(settlement.netSaleAfterReturns)}
                </span>
              </div>

              {settlement.totalRefunded > 0 && (
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-semibold text-xs">
                    Net Paid (after refunds)
                  </span>
                  <span className="font-mono text-xs text-emerald-700">
                    {formatInvoiceMoney(settlement.netPaid)}
                  </span>
                </div>
              )}

              {settlement.netRefundable > 0 ? (
                <div className="flex justify-between items-center text-slate-900 border-t-2 border-slate-900 pt-1">
                  <span className="font-bold text-base">Net Refundable</span>
                  <span className="font-mono font-extrabold text-xl text-emerald-700">
                    {formatInvoiceMoney(settlement.netRefundable)}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between items-center text-slate-900 border-t-2 border-slate-900 pt-1">
                  <span className="font-bold text-base">Net Due</span>
                  <span
                    className={`font-mono font-extrabold text-xl ${
                      settlement.netDue > 0 ? "text-rose-600" : "text-slate-900"
                    }`}
                  >
                    {formatInvoiceMoney(settlement.netDue)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
