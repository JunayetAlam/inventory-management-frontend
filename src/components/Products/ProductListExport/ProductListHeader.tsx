import PDFViewHeader from "@/PDFViewHeader";
import { TShop } from "@/types";
import { formatInvoiceDate } from "@/utils/formatInvoiceDate";

export default function ProductListHeader({
  shop,
  generatedAt,
  filterLabel,
  searchTerm,
  totalCount,
}: {
  shop: TShop | null | undefined;
  generatedAt: string;
  filterLabel: string;
  searchTerm?: string;
  totalCount: number;
}) {
  return (
    <div className="space-y-3">
      <PDFViewHeader
        title="Products List"
        name={shop?.name || ""}
        logo={shop?.logo}
        subtitle={shop?.proprietor}
      />

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 border-t border-b border-slate-200 py-2 text-xs text-slate-600">
        <div className="space-y-0.5">
          <p>
            <span className="font-semibold text-slate-800">Filter</span>
            <span className="ml-2 text-slate-900">{filterLabel}</span>
          </p>
          {searchTerm ? (
            <p>
              <span className="font-semibold text-slate-800">Search</span>
              <span className="ml-2 text-slate-900">“{searchTerm}”</span>
            </p>
          ) : null}
        </div>
        <p className="font-mono text-slate-900">
          <span className="font-semibold font-sans text-slate-800 mr-2">
            Products
          </span>
          {totalCount}
        </p>
      </div>
    </div>
  );
}
