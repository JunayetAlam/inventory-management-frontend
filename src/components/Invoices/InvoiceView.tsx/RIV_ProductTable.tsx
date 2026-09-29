import { TInvoiceItem } from "@/types";
import { formatInvoiceMoney } from "@/utils/formatInvoiceMoney";

const thClass =
  "h-9 px-2.5 py-2 text-left align-middle text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap border-b border-slate-200 bg-slate-50";
const tdClass =
  "px-2.5 border border-slate-200/80 py-[7px] align-middle whitespace-nowrap text-sm text-slate-900";

export type RIV_ProductTableProps = {
  items: TInvoiceItem[];
  startIndex?: number;
  broughtForward?: number;
  carriedForward?: number;
  fromPage?: number;
  toPage?: number;
  showBroughtForward?: boolean;
  showCarryForward?: boolean;
};

function BalanceRow({
  kind,
  pageNo,
  amount,
}: {
  kind: "bf" | "cf";
  pageNo: number;
  amount: number;
}) {
  const isBf = kind === "bf";
  return (
    <tr
      data-row={isBf ? "balance-bf" : "balance-cf"}
      className="bg-slate-50/90"
      style={{ breakInside: "avoid" }}
    >
      <td className={`${tdClass} text-center text-slate-400`}>—</td>
      <td className={`${tdClass} whitespace-normal italic text-slate-700`} colSpan={5}>
        <span className="font-semibold not-italic text-slate-800">
          {isBf
            ? `Brought forward from Page ${pageNo}`
            : `Balance carried forward to Page ${pageNo}`}
        </span>
        {!isBf && (
          <span className="ml-2 text-[11px] not-italic font-normal text-slate-500">
            Continued on next page
          </span>
        )}
      </td>
      <td className={`${tdClass} text-right font-mono font-bold text-slate-900`}>
        {formatInvoiceMoney(amount)}
      </td>
    </tr>
  );
}

export default function RIV_ProductTable({
  items,
  startIndex = 0,
  broughtForward = 0,
  carriedForward = 0,
  fromPage = 1,
  toPage = 2,
  showBroughtForward = false,
  showCarryForward = false,
}: RIV_ProductTableProps) {
  const hasItems = items && items.length > 0;

  return (
    <table className="w-full caption-bottom text-sm border-collapse">
      <thead data-probe="header">
        <tr className="border-b border-slate-200">
          <th className={`${thClass} w-5 text-center`}>#</th>
          <th className={`${thClass} w-[190px] max-w-[190px] px-0`}>Item</th>
          <th className={`${thClass} w-16`}>Unit</th>
          <th className={`${thClass} text-center w-16`}>Qt.</th>
          <th className={`${thClass} text-right w-24`}>U/P</th>
          <th className={`${thClass} text-right w-20`}>Disc %</th>
          <th className={`${thClass} text-right w-24`}>Total</th>
        </tr>
      </thead>
      <tbody>
        {showBroughtForward && (
          <BalanceRow kind="bf" pageNo={fromPage} amount={broughtForward} />
        )}
        {hasItems
          ? items.map((item, idx) => (
              <tr
                key={item.id || `${startIndex}-${idx}`}
                data-row="item"
                className={`border border-slate-200/80 ${(startIndex + idx) % 2 === 1 ? "bg-muted" : ""}`}
                style={{ breakInside: "avoid" }}
              >
                <td
                  className={`${tdClass} text-center font-mono text-slate-500 w-5 text-xs`}
                >
                  {startIndex + idx + 1}
                </td>
                <td className={`${tdClass} font-medium w-[210px] max-w-[210px] px-0`}>
                  <span
                    className="block truncate w-[210px] max-w-[210px]"
                    title={item.productName}
                  >
                    {item.productName}
                  </span>
                </td>
                <td className={`${tdClass} text-slate-500 capitalize`}>
                  {item.unit.toLowerCase()}
                </td>
                <td className={`${tdClass} text-center font-mono`}>
                  {item.quantity}
                </td>
                <td className={`${tdClass} text-right font-mono`}>
                  {formatInvoiceMoney(item.sellingPrice)}
                </td>
                <td className={`${tdClass} text-right font-mono text-slate-500`}>
                  {item.discounts && item.discounts.length > 0 ? (
                    item.discounts.length > 1 ? (
                      <span title={item.discounts.map((d) => `${d}%`).join(", ")}>
                        {item.discounts.map((d) => `${d}%`).join(", ")}
                      </span>
                    ) : (
                      `${item.discounts[0]}%`
                    )
                  ) : item.discount && item.discount > 0 ? (
                    `${item.discount}%`
                  ) : (
                    "—"
                  )}
                </td>
                <td className={`${tdClass} text-right font-mono font-semibold`}>
                  {formatInvoiceMoney(item.totalPrice)}
                </td>
              </tr>
            ))
          : !showBroughtForward && !showCarryForward && (
              <tr>
                <td
                  colSpan={7}
                  className={`${tdClass} py-4 text-center text-slate-500 italic`}
                >
                  No items recorded
                </td>
              </tr>
            )}
        {showCarryForward && (
          <BalanceRow kind="cf" pageNo={toPage} amount={carriedForward} />
        )}
      </tbody>
    </table>
  );
}
