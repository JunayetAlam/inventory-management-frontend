export type InvoiceSettlement = {
  invoiceTotal: number;
  paidAmount: number;
  creditsBefore: number;
  thisCredit: number;
  totalCredits: number;
  refundedBefore: number;
  thisRefunded: number;
  totalRefunded: number;
  /** Cash still held after cash refunds already given to the customer. */
  netPaid: number;
  netSaleAfterReturns: number;
  netDue: number;
  netRefundable: number;
};

export type BillPosition = {
  netDue: number;
  netRefundable: number;
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/** Mirror of backend deriveInvoiceSettlement for live create/edit previews. */
export function deriveInvoiceSettlement(args: {
  invoiceTotal: number;
  paidAmount: number;
  creditsBefore?: number;
  thisCredit?: number;
  refundedBefore?: number;
  thisRefunded?: number;
}): InvoiceSettlement {
  const invoiceTotal = round2(Math.max(0, Number(args.invoiceTotal) || 0));
  const paidAmount = round2(Math.max(0, Number(args.paidAmount) || 0));
  const creditsBefore = round2(Math.max(0, Number(args.creditsBefore) || 0));
  const thisCredit = round2(Math.max(0, Number(args.thisCredit) || 0));
  const refundedBefore = round2(Math.max(0, Number(args.refundedBefore) || 0));
  const thisRefunded = round2(Math.max(0, Number(args.thisRefunded) || 0));
  const totalCredits = round2(creditsBefore + thisCredit);
  const totalRefunded = round2(refundedBefore + thisRefunded);
  const netSaleAfterReturns = round2(Math.max(0, invoiceTotal - totalCredits));
  const netPaid = round2(Math.max(0, paidAmount - totalRefunded));
  const netDue = round2(Math.max(0, netSaleAfterReturns - netPaid));
  const netRefundable = round2(Math.max(0, netPaid - netSaleAfterReturns));

  return {
    invoiceTotal,
    paidAmount,
    creditsBefore,
    thisCredit,
    totalCredits,
    refundedBefore,
    thisRefunded,
    totalRefunded,
    netPaid,
    netSaleAfterReturns,
    netDue,
    netRefundable,
  };
}

/**
 * Apply this return's net credit + cash refund onto the previous bill position.
 * signed = shop-held excess (refundable) minus customer due.
 */
export function derivePositionAfterReturn(
  previous: BillPosition,
  thisCredit: number,
  thisRefunded: number,
): BillPosition {
  const signedBefore = round2(
    (Number(previous.netRefundable) || 0) - (Number(previous.netDue) || 0),
  );
  const signedAfter = round2(
    signedBefore + (Number(thisCredit) || 0) - (Number(thisRefunded) || 0),
  );
  return {
    netDue: round2(Math.max(0, -signedAfter)),
    netRefundable: round2(Math.max(0, signedAfter)),
  };
}
