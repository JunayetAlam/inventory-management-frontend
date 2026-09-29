import { TCustomer } from "@/types";
import { formatSignedDue } from "@/utils/formatInvoiceMoney";

const thClass =
  "h-8 px-2 py-1.5 text-left align-middle text-[10px] font-bold uppercase tracking-wider text-black dark:text-foreground whitespace-nowrap border-b border-slate-200 bg-slate-50";
const tdClass =
  "px-2 border-b border-slate-200/80 py-[6px] align-middle text-[11px] text-slate-900";

export default function CustomerListTable({
  customers,
  startIndex = 0,
  empty = false,
}: {
  customers: TCustomer[];
  startIndex?: number;
  empty?: boolean;
}) {
  return (
    <table className="w-full caption-bottom text-sm border-collapse">
      <thead data-probe="header">
        <tr>
          <th className={`${thClass} w-8 text-center`}>#</th>
          <th className={thClass}>Name</th>
          <th className={thClass}>Phone</th>
          <th className={thClass}>Email</th>
          <th className={thClass}>Address</th>
          <th className={`${thClass} text-right`}>Due</th>
        </tr>
      </thead>
      <tbody>
        {empty ? (
          <tr data-row="empty">
            <td
              colSpan={6}
              className={`${tdClass} text-center text-slate-500 italic py-6`}
            >
              No customers found for this filter.
            </td>
          </tr>
        ) : (
          customers.map((customer, idx) => {
            const due = Number(customer.totalDue) || 0;
            return (
              <tr
                key={customer.id}
                data-row="item"
                className={(startIndex + idx) % 2 === 1 ? "bg-muted" : ""}
              >
                <td className={`${tdClass} text-center text-slate-500 font-mono`}>
                  {startIndex + idx + 1}
                </td>
                <td className={`${tdClass} font-semibold truncate max-w-[180px]`}>
                  {customer.name}
                </td>
                <td className={`${tdClass} font-mono whitespace-nowrap`}>
                  {customer.countryCode || "+880"} {customer.phoneNumber}
                </td>
                <td className={`${tdClass} truncate max-w-[180px] text-slate-700`}>
                  {customer.email || "—"}
                </td>
                <td className={`${tdClass} truncate max-w-[200px] text-slate-700`}>
                  {customer.address || "—"}
                </td>
                <td
                  className={`${tdClass} text-right font-mono font-medium whitespace-nowrap ${
                    due > 0
                      ? "text-rose-600"
                      : due < 0
                      ? "text-emerald-600"
                      : "text-slate-700"
                  }`}
                >
                  {formatSignedDue(due)}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
