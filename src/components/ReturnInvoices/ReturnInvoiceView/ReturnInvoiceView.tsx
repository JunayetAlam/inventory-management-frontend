"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { PrinterIcon, ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { TInvoice, TInvoiceItem, TReturnInvoice } from "@/types";
import { useGetShopDetailsQuery } from "@/redux/api/shopApi";
import Image from "next/image";
import RIV_ProductTable from "@/components/Invoices/InvoiceView.tsx/RIV_ProductTable";
import InvoiceStyle from "@/components/Invoices/InvoiceView.tsx/invoice-style";
import RIV_Footer from "@/components/Invoices/InvoiceView.tsx/RIV_Footer";
import RIV_ContinuationBar from "@/components/Invoices/InvoiceView.tsx/RIV_ContinuationBar";
import {
  INVOICE_CONTENT_FOOTER_GAP,
  paginateInvoicePages,
} from "@/components/Invoices/InvoiceView.tsx/paginateInvoicePages";
import RetIV_Details from "./RetIV_Details";
import RetIV_Calculation from "./RetIV_Calculation";

interface ReturnInvoiceViewProps {
  returnInvoice: TReturnInvoice;
}

type InvoiceMetrics = {
  pageHeight: number;
  compactFooterHeight: number;
  lastFooterHeight: number;
  detailsHeight: number;
  continuationBarHeight: number;
  tableHeaderHeight: number;
  rowHeight: number;
  balanceRowHeight: number;
  calculationHeight: number;
};

const FALLBACK_METRICS: InvoiceMetrics = {
  pageHeight: 1122.5,
  compactFooterHeight: 52,
  lastFooterHeight: 168,
  detailsHeight: 150,
  continuationBarHeight: 36,
  tableHeaderHeight: 36,
  rowHeight: 37,
  balanceRowHeight: 40,
  calculationHeight: 160,
};

function metricsEqual(a: InvoiceMetrics, b: InvoiceMetrics) {
  return (Object.keys(a) as (keyof InvoiceMetrics)[]).every(
    (key) => Math.abs(a[key] - b[key]) < 0.5,
  );
}

function toInvoiceItems(returnInvoice: TReturnInvoice): TInvoiceItem[] {
  return (returnInvoice.items || []).map((it) => ({
    id: it.id,
    invoiceId: it.invoiceId,
    productId: it.productId,
    productName: it.productName,
    unit: it.unit,
    sellingPrice: it.sellingPrice,
    quantity: it.quantity,
    discounts: it.discounts ?? (it.discount ? [it.discount] : []),
    discount: it.discount,
    subTotal: it.totalPrice,
    totalPrice: it.totalPrice,
    createdAt: it.createdAt,
    updatedAt: it.updatedAt,
    product: it.product,
  }));
}

export default function ReturnInvoiceView({
  returnInvoice,
}: ReturnInvoiceViewProps) {
  const router = useRouter();
  const rulerRef = useRef<HTMLDivElement>(null);
  const detailsProbeRef = useRef<HTMLDivElement>(null);
  const barProbeRef = useRef<HTMLDivElement>(null);
  const tableProbeRef = useRef<HTMLDivElement>(null);
  const calcProbeRef = useRef<HTMLDivElement>(null);
  const compactFooterProbeRef = useRef<HTMLDivElement>(null);
  const lastFooterProbeRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<InvoiceMetrics>(FALLBACK_METRICS);
  const didAutoPrint = useRef(false);

  const { data: shopResponse, isLoading: isShopLoading } =
    useGetShopDetailsQuery();
  const shop = shopResponse?.data;

  const items = useMemo(() => toInvoiceItems(returnInvoice), [returnInvoice]);

  const continuationInvoice = useMemo(
    () =>
      ({
        id: returnInvoice.id,
        invoiceNumber: returnInvoice.returnNumber,
        createdAt: returnInvoice.createdAt,
      }) as TInvoice,
    [returnInvoice],
  );

  const handlePrint = () => window.print();

  const shopName = shop?.name || "Rupayon Biddut";
  const contactPhones = shop?.phoneNumbers?.length
    ? shop.phoneNumbers.join(", ")
    : "";
  const contactLocations = shop?.locations?.length
    ? shop.locations.join(" | ")
    : "";
  const contactEmails = shop?.emails?.length ? shop.emails.join(", ") : "";

  const probeItem: TInvoiceItem = useMemo(() => {
    if (items[0]) return items[0];
    return {
      id: "probe",
      invoiceId: returnInvoice.invoiceId,
      productName: "Measurement",
      unit: "PIECE",
      sellingPrice: 0,
      quantity: 1,
      discount: 0,
      subTotal: 0,
      totalPrice: 0,
      createdAt: returnInvoice.createdAt,
      updatedAt: returnInvoice.createdAt,
    };
  }, [items, returnInvoice]);

  useEffect(() => {
    const readMetrics = (): InvoiceMetrics => {
      const tableRoot = tableProbeRef.current;
      const headerEl = tableRoot?.querySelector(
        '[data-probe="header"]',
      ) as HTMLElement | null;
      const rowEl = tableRoot?.querySelector(
        "tbody tr:not([data-row])",
      ) as HTMLElement | null;
      const bfEl = tableRoot?.querySelector(
        '[data-row="balance-bf"]',
      ) as HTMLElement | null;

      return {
        pageHeight:
          rulerRef.current?.offsetHeight || FALLBACK_METRICS.pageHeight,
        compactFooterHeight:
          compactFooterProbeRef.current?.offsetHeight ||
          FALLBACK_METRICS.compactFooterHeight,
        lastFooterHeight:
          lastFooterProbeRef.current?.offsetHeight ||
          FALLBACK_METRICS.lastFooterHeight,
        detailsHeight:
          detailsProbeRef.current?.offsetHeight ||
          FALLBACK_METRICS.detailsHeight,
        continuationBarHeight:
          barProbeRef.current?.offsetHeight ||
          FALLBACK_METRICS.continuationBarHeight,
        tableHeaderHeight:
          headerEl?.offsetHeight || FALLBACK_METRICS.tableHeaderHeight,
        rowHeight: rowEl?.offsetHeight || FALLBACK_METRICS.rowHeight,
        balanceRowHeight:
          bfEl?.offsetHeight || FALLBACK_METRICS.balanceRowHeight,
        calculationHeight:
          calcProbeRef.current?.offsetHeight ||
          FALLBACK_METRICS.calculationHeight,
      };
    };

    const apply = () => {
      const next = readMetrics();
      setMetrics((prev) => (metricsEqual(prev, next) ? prev : next));
    };

    apply();
    const ro = new ResizeObserver(apply);
    [
      rulerRef,
      detailsProbeRef,
      barProbeRef,
      tableProbeRef,
      calcProbeRef,
      compactFooterProbeRef,
      lastFooterProbeRef,
    ].forEach((r) => {
      if (r.current) ro.observe(r.current);
    });
    return () => ro.disconnect();
  }, [returnInvoice, shop]);

  const pages = useMemo(
    () =>
      paginateInvoicePages({
        items,
        ...metrics,
      }),
    [items, metrics],
  );

  const pageCount = pages.length;
  const footerContacts = { contactPhones, contactLocations, contactEmails };

  useEffect(() => {
    if (didAutoPrint.current || isShopLoading) return;
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("print") !== "1") {
      return;
    }
    const timer = window.setTimeout(() => {
      if (didAutoPrint.current) return;
      didAutoPrint.current = true;
      window.print();
      const url = new URL(window.location.href);
      if (url.searchParams.has("print")) {
        url.searchParams.delete("print");
        window.history.replaceState(
          null,
          "",
          `${url.pathname}${url.search}${url.hash}`,
        );
      }
    }, 600);
    return () => window.clearTimeout(timer);
  }, [isShopLoading, pageCount, metrics]);

  return (
    <div className="min-h-screen bg-slate-100/80 dark:bg-zinc-950 py-6 sm:py-10 print:bg-white print:py-0 print:m-0">
      <div className="max-w-[210mm] mx-auto px-4 mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 shadow-xs bg-card cursor-pointer"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} className="size-4" />
          <span className="hidden sm:inline">Go Back</span>
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-slate-600 bg-white border px-2.5 py-1 rounded-md shadow-xs">
            {pageCount} {pageCount === 1 ? "Page" : "Pages"} (A4)
          </span>
          <Button
            onClick={handlePrint}
            className="gap-2 font-semibold shadow-xs"
            size="sm"
          >
            <HugeiconsIcon icon={PrinterIcon} strokeWidth={2} className="size-4" /> Print / Save as PDF
          </Button>
        </div>
      </div>

      <div
        aria-hidden
        className="absolute w-[210mm] overflow-hidden pointer-events-none print:hidden"
        style={{ left: "-9999px", top: 0, visibility: "hidden" }}
      >
        <div ref={rulerRef} style={{ height: "297mm", width: "210mm" }} />
        <div className="px-10" ref={detailsProbeRef}>
          <RetIV_Details shop={shop} returnInvoice={returnInvoice} />
        </div>
        <div className="px-10" ref={barProbeRef}>
          <RIV_ContinuationBar
            shopName={shopName}
            invoice={continuationInvoice}
            pageNo={2}
            pageCount={2}
          />
        </div>
        <div ref={tableProbeRef} className="px-10">
          <RIV_ProductTable
            items={[probeItem]}
            showBroughtForward
            showCarryForward
            broughtForward={100}
            carriedForward={200}
          />
        </div>
        <div className="px-10" ref={calcProbeRef}>
          <RetIV_Calculation returnInvoice={returnInvoice} />
        </div>
        <div ref={compactFooterProbeRef}>
          <RIV_Footer
            isLastPage={false}
            pageNo={1}
            pageCount={2}
            {...footerContacts}
          />
        </div>
        <div ref={lastFooterProbeRef}>
          <RIV_Footer isLastPage pageNo={1} pageCount={1} {...footerContacts} />
        </div>
      </div>

      <div
        id="a4-invoice-sheet"
        className="flex flex-col items-center gap-6 print:gap-0"
      >
        {pages.map((page) => {
          const footerHeight = page.isLast
            ? metrics.lastFooterHeight
            : metrics.compactFooterHeight;
          return (
            <div
              key={page.pageNo}
              className="invoice-page relative w-full max-w-[210mm] bg-white text-slate-900 shadow-xl rounded-sm border border-slate-200/80 print:border-none print:shadow-none print:rounded-none overflow-hidden"
              style={{
                width: "210mm",
                height: "297mm",
                boxSizing: "border-box",
              }}
            >
              <div
                className="px-10 pt-10"
                style={{
                  paddingBottom: footerHeight + INVOICE_CONTENT_FOOTER_GAP,
                }}
              >
                {page.pageNo === 1 ? (
                  <RetIV_Details shop={shop} returnInvoice={returnInvoice} />
                ) : (
                  <RIV_ContinuationBar
                    shopName={shopName}
                    invoice={continuationInvoice}
                    pageNo={page.pageNo}
                    pageCount={pageCount}
                  />
                )}
                <div className="pt-4">
                  <RIV_ProductTable
                    items={page.items}
                    startIndex={page.startIndex}
                    broughtForward={page.broughtForward}
                    carriedForward={page.carriedForward}
                    fromPage={page.pageNo - 1}
                    toPage={page.pageNo + 1}
                    showBroughtForward={page.showBroughtForward}
                    showCarryForward={page.showCarryForward}
                  />
                </div>
                {page.showCalculation && (
                  <RetIV_Calculation returnInvoice={returnInvoice} />
                )}
              </div>
              <div className="absolute left-0 right-0 bottom-0">
                <RIV_Footer
                  isLastPage={page.isLast}
                  pageNo={page.pageNo}
                  pageCount={pageCount}
                  {...footerContacts}
                />
              </div>
            </div>
          );
        })}
      </div>
      <InvoiceStyle />
    </div>
  );
}
