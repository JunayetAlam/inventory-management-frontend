import { TReturnInvoice } from "@/types";
import { formatInvoiceMoney } from "@/utils/formatInvoiceMoney";
import { derivePositionAfterReturn } from "@/utils/deriveInvoiceSettlement";
import React from "react";

function MoneyRow({
  label,
  amount,
  sign,
  emphasize,
  hideSign,
  className,
}: {
  label: string;
  amount: number;
  sign: "+" | "-";
  emphasize?: boolean;
  hideSign?: boolean;
  className?: string;
}) {
  const color =
    sign === "+"
      ? emphasize
        ? "text-slate-900"
        : "text-slate-900"
      : "text-rose-600";

  return (
    <div className="flex justify-between items-center text-slate-700">
      <span
        className={
          emphasize
            ? "font-bold text-base text-slate-900"
            : "font-semibold text-sm"
        }
      >
        {label}
      </span>
      <span
        className={`font-mono ${emphasize ? "font-extrabold text-xl" : "font-semibold text-sm"} ${className || color}`}
      >
        {hideSign ? "" : sign}
        {formatInvoiceMoney(Math.abs(amount))}
      </span>
    </div>
  );
}

export default function RetIV_Calculation({
  returnInvoice,
}: {
  returnInvoice: TReturnInvoice;
}) {
  const subTotal = Number(returnInvoice.subTotal) || 0;
  const discount = Number(returnInvoice.discount) || 0;
  const netCredit = Number(returnInvoice.totalAmount) || 0;
  const currentRefund = Number(returnInvoice.refundedAmount) || 0;

  const previousPosition = returnInvoice.previousPosition || {
    netDue: 0,
    netRefundable: 0,
  };

  const currentPosition =
    returnInvoice.currentPosition ||
    derivePositionAfterReturn(previousPosition, netCredit, currentRefund);

  return (
    <div
      className="flex justify-end pt-1 pr-2.5"
      style={{ breakInside: "avoid", pageBreakInside: "avoid" }}
    >
      <div className="w-full sm:w-1/2 print:w-1/2 space-y-1 text-xs">
        <MoneyRow label="Subtotal" amount={subTotal} sign="+" />
        <MoneyRow label="Discount" amount={discount} sign="-" />

        <div className="border-t border-slate-300 pt-1 mt-1 space-y-1">
          <MoneyRow label="Total" amount={netCredit} sign="+" />

          {previousPosition.netDue > 0 ? (
            <MoneyRow
              label="Previous Customer Due"
              amount={previousPosition.netDue}
              sign="-"
            />
          ) : previousPosition.netRefundable > 0 ? (
            <MoneyRow
              label="Previous Refund Due"
              amount={previousPosition.netRefundable}
              sign="+"
            />
          ) : (
            <MoneyRow label="Previous Due" amount={0} sign="-" />
          )}

          <MoneyRow label="Current Refund" amount={currentRefund} sign="-" />

          <div className="border-t-2 border-slate-900 pt-1 mt-1">
            {currentPosition.netRefundable > 0 ? (
              <MoneyRow
                label="Refund Due"
                amount={currentPosition.netRefundable}
                sign="+"
                emphasize
                hideSign
                className="text-rose-600"
              />
            ) : currentPosition.netDue > 0 ? (
              <MoneyRow
                label="Customer Due"
                amount={currentPosition.netDue}
                sign="+"
                emphasize
                hideSign
                className="text-rose-600"
              />
            ) : (
              <MoneyRow
                label="Balance"
                amount={0}
                sign="+"
                emphasize
                hideSign
                className="text-slate-900"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
