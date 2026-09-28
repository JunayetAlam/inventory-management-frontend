import PDFViewHeader from "@/PDFViewHeader";
import { TProductProfitSummary, TShop } from "@/types";
import { formatInvoiceDate } from "@/utils/formatInvoiceDate";
import { formatInvoiceMoney } from "@/utils/formatInvoiceMoney";

function formatQty(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

export default function ProductProfitListHeader({
  shop,
  generatedAt,
  filterLabel,
  searchTerm,
  totalCount,
  summary,
}: {
  shop: TShop | null | undefined;
  generatedAt: string;
  filterLabel: string;
  searchTerm?: string;
  totalCount: number;
  summary: TProductProfitSummary;
}) {
  return (
    <div className="space-y-3">
      <PDFViewHeader
        title="Product Profit/Loss"
        name={shop?.name || ""}
        logo={shop?.logo}
        subtitle={shop?.proprietor}
      />

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-t border-b border-slate-200 py-2 text-xs text-slate-600">
        <div className="space-y-0.5">
          <p>
            <span className="font-semibold text-slate-800">Period</span>
            <span className="ml-2 text-slate-900">{filterLabel}</span>
          </p>
          {searchTerm ? (
            <p>
              <span className="font-semibold text-slate-800">Search</span>
              <span className="ml-2 text-slate-900">“{searchTerm}”</span>
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5 text-xs">
          {/* Row 1 */}
          <div className="flex items-center justify-end divide-x divide-slate-300">
            <div className="px-3 first:pl-0">
              <span className="mr-1.5 font-semibold text-slate-500">
                Products
              </span>
              <span className="font-mono font-bold text-slate-900">
                {totalCount}
              </span>
            </div>

            <div className="px-3">
              <span className="mr-1.5 font-semibold text-slate-500">Sold</span>
              <span className="font-mono font-bold text-slate-900">
                {formatQty(summary.soldQty)}
              </span>
            </div>

            <div className="px-3 pr-0">
              <span className="mr-1.5 font-semibold text-slate-500">Sales</span>
              <span className="font-mono font-bold text-slate-900">
                {formatInvoiceMoney(summary.salesTotal)}
              </span>
            </div>
          </div>

          {/* Row 2 */}
          <div className="flex items-center justify-end divide-x divide-slate-300">
            <div className="px-3">
              <span className="mr-1.5 font-semibold text-slate-500">Cost</span>
              <span className="font-mono font-bold text-slate-900">
                {formatInvoiceMoney(summary.purchaseCost)}
              </span>
            </div>

            <div className="pl-3">
              <span className="mr-1.5 font-semibold text-slate-500">
                Profit/Loss
              </span>

              <span
                className={`font-mono font-bold ${
                  summary.profit > 0
                    ? "text-emerald-700"
                    : summary.profit < 0
                      ? "text-red-700"
                      : "text-slate-900"
                }`}
              >
                {formatInvoiceMoney(summary.profit)}
                {summary.profitPercent != null && (
                  <span className="ml-1">({summary.profitPercent}%)</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
