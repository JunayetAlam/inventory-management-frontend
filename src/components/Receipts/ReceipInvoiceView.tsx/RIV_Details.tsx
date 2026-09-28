import ShopLogo from "@/components/ShopLogo";
import { TReceipt, TShop } from "@/types";
import {
  formatInvoiceDate,
  formatInvoiceTime,
} from "@/utils/formatInvoiceDate";
import Image from "next/image";
export default function RIV_Details({
  shop,
  receipt,
}: {
  shop: TShop | null | undefined;
  receipt: TReceipt;
}) {
  const shopName = shop?.name || "Rupayon Biddut";
  const customerPhone = [
    receipt.customer?.countryCode,
    receipt.customer?.phoneNumber,
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
          <div className="mt-1 flex items-center justify-center gap-x-2 overflow-hidden whitespace-nowrap text-xs font-medium leading-none text-slate-600">
            {" "}
            {shop?.tagline && (
              <span className="truncate">{shop.tagline}</span>
            )}{" "}
            {shop?.tagline && shop?.phoneNumbers?.length ? (
              <span className="shrink-0 text-slate-400">•</span>
            ) : null}{" "}
            {shop?.phoneNumbers?.length ? (
              <span className="shrink-0"> {shop.phoneNumbers.join(", ")} </span>
            ) : null}{" "}
          </div>{" "}
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
            {receipt.customer?.name || "Valued Customer"}{" "}
          </p>{" "}
          <div className="mt-1 flex flex-wrap gap-x-2 text-xs font-medium leading-none text-slate-600">
            {" "}
            {receipt.customer?.address && (
              <span>{receipt.customer.address}</span>
            )}{" "}
            {customerPhone && (
              <>
                {" "}
                <span className="text-slate-300">•</span>{" "}
                <span>{customerPhone}</span>{" "}
              </>
            )}{" "}
            {receipt.customer?.email && (
              <>
                {" "}
                <span className="text-slate-300">•</span>{" "}
                <span>{receipt.customer.email}</span>{" "}
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
            {receipt.receiptNumber}{" "}
          </div>{" "}
          <div className="py-1.5 font-bold uppercase text-slate-500">
            {" "}
            Date{" "}
          </div>{" "}
          <div className="py-1.5 text-right font-mono text-slate-900 leading-tight">
            <div className="font-medium">
              {formatInvoiceDate(receipt.createdAt)}
            </div>
            <div className="text-[10px] text-slate-500 font-normal mt-0.5">
              {formatInvoiceTime(receipt.createdAt)}
            </div>
          </div>{" "}
        </div>{" "}
      </div>{" "}
    </section>
  );
}
