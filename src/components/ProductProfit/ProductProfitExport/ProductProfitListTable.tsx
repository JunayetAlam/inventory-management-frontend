import { TProductProfitRow } from "@/types";
import { formatInvoiceMoney } from "@/utils/formatInvoiceMoney";
import { cn } from "@/lib/utils";

const thClass =
  "h-8 px-2 py-1.5 text-left align-middle text-[10px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap border-b border-slate-200 bg-slate-50";
const tdClass =
  "px-2 border-b border-slate-200/80 py-[6px] align-middle text-[11px] text-slate-900";

function formatQty(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatOptionalMoney(value: number | null) {
  if (value == null) return "—";
  return formatInvoiceMoney(value);
}

function formatPercent(value: number | null) {
  if (value == null) return "—";
  return `${value.toFixed(2)}%`;
}

export default function ProductProfitListTable({
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
          <th className={`${thClass} w-8 text-center`}>#</th>
          <th className={thClass}>Product</th>
          <th className={`${thClass} text-right`}>Sold</th>
          <th className={`${thClass} text-right`}>Avg Buy</th>
          <th className={`${thClass} text-right`}>Avg Sale</th>
          <th className={`${thClass} text-right`}>Sales</th>
          <th className={`${thClass} text-right`}>Cost</th>
          <th className={`${thClass} text-right`}>Profit/Loss</th>
          <th className={`${thClass} text-right`}>%</th>
        </tr>
      </thead>
      <tbody>
        {empty ? (
          <tr data-row="empty">
            <td
              colSpan={9}
              className={`${tdClass} text-center text-slate-500 italic py-6`}
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
              <td className={`${tdClass} text-center text-slate-500 font-mono`}>
                {startIndex + idx + 1}
              </td>
              <td className={`${tdClass} font-semibold truncate max-w-40`}>
                <span title={row.productName}>{row.productName}</span>
                <span className="block text-[10px] font-normal text-slate-500">
                  {row.unit}
                </span>
              </td>
              <td className={`${tdClass} text-right font-mono whitespace-nowrap`}>
                {formatQty(row.soldQty)}
              </td>
              <td className={`${tdClass} text-right font-mono whitespace-nowrap`}>
                {formatOptionalMoney(row.avgPurchase)}
              </td>
              <td className={`${tdClass} text-right font-mono whitespace-nowrap`}>
                {formatOptionalMoney(row.avgSale)}
              </td>
              <td className={`${tdClass} text-right font-mono whitespace-nowrap`}>
                {formatInvoiceMoney(row.salesTotal)}
              </td>
              <td className={`${tdClass} text-right font-mono whitespace-nowrap`}>
                {formatInvoiceMoney(row.purchaseCost)}
              </td>
              <td
                className={cn(
                  `${tdClass} text-right font-mono font-semibold whitespace-nowrap`,
                  row.profit > 0 && "text-emerald-700",
                  row.profit < 0 && "text-rose-700",
                )}
              >
                {formatInvoiceMoney(row.profit)}
              </td>
              <td
                className={cn(
                  `${tdClass} text-right font-mono whitespace-nowrap`,
                  (row.profitPercent ?? 0) > 0 && "text-emerald-700",
                  (row.profitPercent ?? 0) < 0 && "text-rose-700",
                )}
              >
                {formatPercent(row.profitPercent)}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
