import ShopLogo from "@/components/ShopLogo";
import { TReturnInvoice, TShop } from "@/types";
import {
  formatInvoiceDate,
  formatInvoiceTime,
} from "@/utils/formatInvoiceDate";
import Image from "next/image";

export default function RetIV_Details({
  shop,
  returnInvoice,
}: {
  shop: TShop | null | undefined;
  returnInvoice: TReturnInvoice;
}) {
  const customer = returnInvoice.receipt?.customer;

  const shopName = shop?.name || "Rupayon Biddut";

  const customerPhone = [customer?.countryCode, customer?.phoneNumber]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="w-full">
      {/* Header */}
      <div className="relative flex items-center justify-between border-b-2 border-slate-900 pb-2">
        {/* Left: Logo */}
        <ShopLogo
          url={shop?.logo}
          alt={shop?.name}
          className="max-h-16 w-auto object-contain shrink-0"
        />

        {/* Center: Shop Info */}
        <div className="absolute left-1/2 top-1/2 w-[46%] -translate-x-1/2 -translate-y-1/2 text-center">
          <h1 className="truncate text-xl font-extrabold leading-none text-slate-950">
            {shopName}
          </h1>

          <div className="mt-1 flex items-center justify-center gap-x-2 overflow-hidden whitespace-nowrap text-xs font-medium leading-none text-slate-600">
            {shop?.tagline ? (
              <span className="truncate">{shop.tagline}</span>
            ) : !shop ? (
              <span className="truncate">
                Meet All Your Needs • Electrical Goods
              </span>
            ) : null}

            {(shop?.tagline || !shop) &&
            shop?.phoneNumbers &&
            shop.phoneNumbers.length > 0 ? (
              <span className="shrink-0 text-slate-400">•</span>
            ) : null}

            {shop?.phoneNumbers && shop.phoneNumbers.length > 0 ? (
              <span className="shrink-0">{shop.phoneNumbers.join(", ")}</span>
            ) : null}
          </div>
        </div>

        {/* Right: Return Invoice */}
        <div className="min-w-[140px] text-right">
          <h2 className="text-[23px] font-black leading-[0.9] tracking-[0.06em] text-slate-950">
            RETURN
          </h2>

          <h2 className="mt-1 text-[23px] font-black leading-[0.9] tracking-[0.08em] text-slate-950">
            INVOICE
          </h2>

          <p className="mt-1.5 text-[11px] font-semibold uppercase leading-none tracking-[0.12em] text-slate-500">
            Sales Return
          </p>
        </div>
      </div>

      {/* Customer + Return Metadata */}
      <div className="grid grid-cols-[1fr_auto] gap-5 py-3">
        {/* Customer */}
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase leading-none tracking-[0.12em] text-slate-500">
            Return From
          </p>

          <p className="mt-1 text-sm font-bold leading-none text-slate-900">
            {customer?.name || "Valued Customer"}
          </p>

          <div className="mt-1 flex flex-wrap gap-x-2 text-xs font-medium leading-none text-slate-600">
            {customer?.address && <span>{customer.address}</span>}

            {customerPhone && (
              <>
                {customer?.address && <span className="text-slate-300">•</span>}

                <span>{customerPhone}</span>
              </>
            )}

            {customer?.email && (
              <>
                {(customer?.address || customerPhone) && (
                  <span className="text-slate-300">•</span>
                )}

                <span>{customer.email}</span>
              </>
            )}
          </div>
        </div>

        {/* Return Invoice Info */}
        <div className="grid min-w-[250px] grid-cols-[95px_1fr] text-xs leading-none">
          {/* Return No */}
          <div className="border-b border-slate-200 py-1.5 font-bold uppercase text-slate-500">
            Return No.
          </div>

          <div className="border-b border-slate-200 py-1.5 text-right font-mono font-bold text-slate-900">
            {returnInvoice.returnNumber}
          </div>

          {/* Against */}
          <div className="border-b border-slate-200 py-1.5 font-bold uppercase text-slate-500">
            Against
          </div>

          <div className="border-b border-slate-200 py-1.5 text-right font-mono font-semibold text-slate-900">
            {returnInvoice.receipt?.receiptNumber || "—"}
          </div>

          {/* Previous Return */}
          {returnInvoice.previousReturnInvoice?.returnNumber && (
            <>
              <div className="border-b border-slate-200 py-1.5 font-bold uppercase text-slate-500">
                Prev. Return
              </div>

              <div className="border-b border-slate-200 py-1.5 text-right font-mono font-semibold text-slate-900">
                {returnInvoice.previousReturnInvoice.returnNumber}
              </div>
            </>
          )}

          {/* Date */}
          <div className="py-1.5 font-bold uppercase text-slate-500">Date</div>

          <div className="py-1.5 text-right font-mono text-slate-900 leading-tight">
            <div className="font-medium">
              {formatInvoiceDate(returnInvoice.createdAt)}
            </div>
            <div className="text-[10px] text-slate-500 font-normal mt-0.5">
              {formatInvoiceTime(returnInvoice.createdAt)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
