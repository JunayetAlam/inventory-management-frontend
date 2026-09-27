import ShopLogo from "./components/ShopLogo";
import { formatInvoiceDate } from "./utils/formatInvoiceDate";

export default function PDFViewHeader({
  logo,
  name,
  title,
  subtitle,
}: {
  logo?: string | null;
  name?: string | null;
  title: string;
  subtitle?: string | null;
}) {
  return (
    <div className="flex items-center justify-between gap-4 relative">
      {/* Left: Brand Identity (Logo + Shop Name) */}
      <div className="flex items-center gap-3 min-w-0 max-w-[65%]">
        {logo ? (
          <ShopLogo
            url={logo}
            alt={name}
            className="max-h-16 w-auto object-contain shrink-0"
          />
        ) : name ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 font-bold text-base text-white shadow-xs">
            {name.charAt(0).toUpperCase()}
          </div>
        ) : null}

        {name && (
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 truncate">
              {name}
            </h1>
            <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
              {subtitle || "Business Management Report"}
            </p>
          </div>
        )}
      </div>

      {/* Right: Title & Date */}
      <div className="text-right shrink-0">
        <h2 className="text-xl font-extrabold tracking-wider text-slate-900 uppercase">
          {title}
        </h2>
        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
          Date: {formatInvoiceDate(new Date().toISOString())}
        </p>
      </div>
    </div>
  );
}
