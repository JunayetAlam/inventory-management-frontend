import ShopLogo from "@/components/ShopLogo";
import { TInvoice, TShop } from "@/types";
import {
  formatInvoiceDate,
  formatInvoiceTime,
} from "@/utils/formatInvoiceDate";
import Image from "next/image";
export default function RIV_Details({
  shop,
  invoice,
}: {
  shop: TShop | null | undefined;
  invoice: TInvoice;
}) {
  const shopName = shop?.name || "Rupayon Biddut";
  const customerPhone = [
    invoice.customer?.countryCode,
    invoice.customer?.phoneNumber,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <section className="w-full">
      {" "}
      {/* Header */}{" "}
      <div className="relative flex items-center justify-between border-b-2 border-slate-900 pb-2">
        {" "}
        {/* Left: Logo */}{" "}
        <ShopLogo
          url={shop?.logo}
          alt={shop?.name}
          className="max-h-16 w-auto object-contain shrink-0"
        />
        {/* Center: Shop Info */}{" "}
        <div className="absolute left-1/2 top-1/2 w-[48%] -translate-x-1/2 -translate-y-1/2 text-center">
          {" "}
          <h1 className="truncate text-xl font-extrabold leading-none text-slate-950">
            {" "}
            {shopName}{" "}
          </h1>{" "}
          {shop?.proprietor && (
            <p className="mt-1 truncate text-xs font-semibold leading-tight text-slate-700">
              {shop.proprietor.toLowerCase().startsWith("prop")
                ? shop.proprietor
                : `Proprietor: ${shop.proprietor}`}
            </p>
          )}
          {shop?.phoneNumbers && shop.phoneNumbers.length > 0 ? (
            <p className="mt-0.5 truncate text-[11px] font-medium leading-tight text-slate-600">
              <span className="font-semibold text-slate-700">Phone: </span>
              {shop.phoneNumbers.join(", ")}
            </p>
          ) : null}
        </div>{" "}
        {/* Right: Invoice */}{" "}
        <div className="min-w-[130px] text-right">
          {" "}
          <h2 className="text-[28px] font-black leading-none tracking-[0.08em] text-slate-950">
            {" "}
            INVOICE{" "}
          </h2>{" "}
          <p className="mt-1 text-[11px] font-semibold uppercase leading-none tracking-[0.12em] text-slate-500">
            {" "}
            Sales Invoice{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
      {/* Customer + Invoice Metadata */}{" "}
      <div className="grid grid-cols-[1fr_auto] gap-5 py-3">
        {" "}
        {/* Customer */}{" "}
        <div className="min-w-0">
          {" "}
          <p className="text-[11px] font-bold uppercase leading-none tracking-[0.12em] text-slate-500">
            {" "}
            Bill To{" "}
          </p>{" "}
          <p className="mt-1 text-sm font-bold leading-none text-slate-900">
            {" "}
            {invoice.customer?.name || "Valued Customer"}{" "}
          </p>{" "}
          <div className="mt-1 flex flex-wrap gap-x-2 text-xs font-medium leading-none text-slate-600">
            {" "}
            {invoice.customer?.address && (
              <span>{invoice.customer.address}</span>
            )}{" "}
            {customerPhone && (
              <>
                {" "}
                <span className="text-slate-300">•</span>{" "}
                <span>{customerPhone}</span>{" "}
              </>
            )}{" "}
            {invoice.customer?.email && (
              <>
                {" "}
                <span className="text-slate-300">•</span>{" "}
                <span>{invoice.customer.email}</span>{" "}
              </>
            )}{" "}
          </div>{" "}
        </div>{" "}
        {/* Invoice Info */}{" "}
        <div className="grid min-w-[220px] grid-cols-[75px_1fr] text-xs leading-none">
          {" "}
          <div className="border-b border-slate-200 py-1.5 font-bold uppercase text-slate-500">
            {" "}
            Invoice{" "}
          </div>{" "}
          <div className="border-b border-slate-200 py-1.5 text-right font-mono font-bold text-slate-900">
            {" "}
            {invoice.invoiceNumber}{" "}
          </div>{" "}
          <div className="py-1.5 font-bold uppercase text-slate-500">
            {" "}
            Date{" "}
          </div>{" "}
          <div className="py-1.5 text-right font-mono text-slate-900 whitespace-nowrap flex items-center justify-end gap-1.5">
            <span className="font-semibold text-xs text-slate-900">
              {formatInvoiceDate(invoice.createdAt)}
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              {formatInvoiceTime(invoice.createdAt)}
            </span>
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
