import { TProductProfitRow } from "@/types";
import { formatInvoiceMoney } from "@/utils/formatInvoiceMoney";

const thClass =
  "h-8 px-3 py-1.5 text-left align-middle text-[11px] font-bold uppercase tracking-wider text-black dark:text-foreground whitespace-nowrap border-b border-slate-200 bg-slate-50";
const tdClass =
  "px-3 border-b border-slate-200/80 py-2 align-middle text-xs text-slate-900";

function formatQty(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

export default function SellReportListTable({
  products,
  startIndex = 0,
  empty = false,
}: {
  products: TProductProfitRow[];
  startIndex?: number;
  empty?: boolean;
}) {
  return (
    <table className="w-full caption-bottom text-sm border-collapse">
      <thead data-probe="header">
        <tr>
          <th className={`${thClass} w-10 text-center`}>#</th>
          <th className={thClass}>Product</th>
          <th className={`${thClass} text-right`}>Sold</th>
          <th className={`${thClass} text-right`}>Sale</th>
        </tr>
      </thead>
      <tbody>
        {empty ? (
          <tr data-row="empty">
            <td
              colSpan={4}
              className={`${tdClass} text-center text-slate-500 italic py-8`}
            >
              No product sales found for this period.
            </td>
          </tr>
        ) : (
          products.map((row, idx) => (
            <tr
              key={row.productId}
              data-row="item"
              className={(startIndex + idx) % 2 === 1 ? "bg-muted" : ""}
            >
              <td className={`${tdClass} text-center text-slate-500 font-mono w-10`}>
                {startIndex + idx + 1}
              </td>
              <td className={`${tdClass} font-semibold truncate`}>
                <span title={row.productName}>{row.productName}</span>
                <span className="block text-[11px] font-normal text-slate-500">
                  {row.unit}
                </span>
              </td>
              <td className={`${tdClass} text-right font-mono whitespace-nowrap`}>
                {formatQty(row.soldQty)}
              </td>
              <td className={`${tdClass} text-right font-mono font-semibold whitespace-nowrap`}>
                {formatInvoiceMoney(row.salesTotal)}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
