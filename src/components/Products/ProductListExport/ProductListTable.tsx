import { TProduct } from "@/types";
import { formatInvoiceMoney } from "@/utils/formatInvoiceMoney";

const thClass =
  "h-8 px-2 py-1.5 text-left align-middle text-[10px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap border-b border-slate-200 bg-slate-50";
const tdClass =
  "px-2 border-b border-slate-200/80 py-[6px] align-middle text-[11px] text-slate-900";

function formatQty(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ProductListTable({
  products,
  startIndex = 0,
  empty = false,
}: {
  products: TProduct[];
  startIndex?: number;
  empty?: boolean;
}) {
  return (
    <table className="w-full caption-bottom text-sm border-collapse">
      <thead data-probe="header">
        <tr>
          <th className={`${thClass} w-8 text-center`}>#</th>
          <th className={thClass}>Name</th>
          <th className={thClass}>Unit</th>
          <th className={`${thClass} text-right`}>Stock</th>
          <th className={`${thClass} text-right`}>Selling Price</th>
          <th className={`${thClass} text-right`}>Buying Price</th>
        </tr>
      </thead>
      <tbody>
        {empty ? (
          <tr data-row="empty">
            <td
              colSpan={6}
              className={`${tdClass} text-center text-slate-500 italic py-6`}
            >
              No products found for this filter.
            </td>
          </tr>
        ) : (
          products.map((product, idx) => (
            <tr
              key={product.id}
              data-row="item"
              className={(startIndex + idx) % 2 === 1 ? "bg-muted" : ""}
            >
              <td className={`${tdClass} text-center text-slate-500 font-mono`}>
                {startIndex + idx + 1}
              </td>
              <td className={`${tdClass} font-semibold truncate max-w-[220px]`}>
                {product.name}
              </td>
              <td className={`${tdClass} text-slate-700 whitespace-nowrap`}>
                {product.unit}
              </td>
              <td className={`${tdClass} text-right font-mono whitespace-nowrap`}>
                {formatQty(product.stock)}
              </td>
              <td className={`${tdClass} text-right font-mono whitespace-nowrap`}>
                {formatInvoiceMoney(product.sellingPrice)}
              </td>
              <td className={`${tdClass} text-right font-mono whitespace-nowrap`}>
                {product.buyingPrice != null
                  ? formatInvoiceMoney(product.buyingPrice)
                  : "—"}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
