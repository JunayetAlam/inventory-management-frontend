import { TInvoice } from "@/types";
import { formatInvoiceDate } from "@/utils/formatInvoiceDate";

export default function RIV_ContinuationBar({
  shopName,
  invoice,
  pageNo,
  pageCount,
}: {
  shopName: string;
  invoice: TInvoice;
  pageNo: number;
  pageCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-slate-300 pb-2 text-xs text-slate-700">
      <span className="font-semibold text-slate-900 truncate max-w-[40%]">
        {shopName}
      </span>
      <span className="font-mono font-semibold text-slate-900">
        {invoice.invoiceNumber}
      </span>
      <span className="font-mono text-slate-600">
        {formatInvoiceDate(invoice.createdAt)}
      </span>
      <span className="font-medium text-slate-800">
        Page {pageNo} of {pageCount}
      </span>
      <span className="uppercase tracking-wide text-[10px] font-semibold text-slate-500">
        Continued
      </span>
    </div>
  );
}
