"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { TInvoice, TInvoiceItem } from "@/types";
import { useGetShopDetailsQuery } from "@/redux/api/shopApi";
import Image from "next/image";
import RIV_ProductTable from "./RIV_ProductTable";
import RIV_Details from "./RIV_Details";
import InvoiceStyle from "./invoice-style";
import RIV_Footer from "./RIV_Footer";
import RIV_Calculation from "./RIV_Calculation";
import RIV_ContinuationBar from "./RIV_ContinuationBar";
import {
  INVOICE_CONTENT_FOOTER_GAP,
  paginateInvoicePages,
  type InvoicePage,
} from "./paginateInvoicePages";

interface InvoiceViewProps {
  invoice: TInvoice;
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
  detailsHeight: 130,
  continuationBarHeight: 36,
  tableHeaderHeight: 36,
  rowHeight: 37,
  balanceRowHeight: 40,
  calculationHeight: 280,
};

function metricsEqual(a: InvoiceMetrics, b: InvoiceMetrics) {
  return (Object.keys(a) as (keyof InvoiceMetrics)[]).every(
    (key) => Math.abs(a[key] - b[key]) < 0.5,
  );
}

export default function InvoiceView({
  invoice,
}: InvoiceViewProps) {
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

  const handlePrint = () => {
    window.print();
  };

  const shopName = shop?.name || "Rupayon Biddut";

  const contactPhones =
    shop?.phoneNumbers && shop.phoneNumbers.length > 0
      ? shop.phoneNumbers.join(", ")
      : !shop
        ? "+880 1712-345678, +880 1912-345678"
        : "";

  const contactLocations =
    shop?.locations && shop.locations.length > 0
      ? shop.locations.join(" | ")
      : !shop
        ? "Court Para, N.S. Road, Kushtia - 7000"
        : "";

  const contactEmails =
    shop?.emails && shop.emails.length > 0
      ? shop.emails.join(", ")
      : !shop
        ? "contact@rupayonbiddut.com"
        : "";

  const probeItem: TInvoiceItem = useMemo(() => {
    if (invoice.items?.[0]) return invoice.items[0];
    return {
      id: "probe-item",
      invoiceId: invoice.id,
      productName: "Measurement item",
      unit: "PIECE",
      sellingPrice: 0,
      quantity: 1,
      discount: 0,
      subTotal: 0,
      totalPrice: 0,
      createdAt: invoice.createdAt,
      updatedAt: invoice.createdAt,
    };
  }, [invoice]);

  useEffect(() => {
    const readMetrics = (): InvoiceMetrics => {
      const tableRoot = tableProbeRef.current;
      const headerEl = tableRoot?.querySelector(
        '[data-probe="header"]',
      ) as HTMLElement | null;
      const itemEl = tableRoot?.querySelector(
        '[data-row="item"]',
      ) as HTMLElement | null;
      const bfEl = tableRoot?.querySelector(
        '[data-row="balance-bf"]',
      ) as HTMLElement | null;
      const cfEl = tableRoot?.querySelector(
        '[data-row="balance-cf"]',
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
        rowHeight: itemEl?.offsetHeight || FALLBACK_METRICS.rowHeight,
        balanceRowHeight: Math.max(
          bfEl?.offsetHeight || 0,
          cfEl?.offsetHeight || 0,
          FALLBACK_METRICS.balanceRowHeight,
        ),
        calculationHeight:
          calcProbeRef.current?.offsetHeight ||
          FALLBACK_METRICS.calculationHeight,
      };
    };

    const update = () => {
      const next = readMetrics();
      setMetrics((prev) => (metricsEqual(prev, next) ? prev : next));
    };

    update();

    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => update());
    const nodes = [
      rulerRef.current,
      detailsProbeRef.current,
      barProbeRef.current,
      tableProbeRef.current,
      calcProbeRef.current,
      compactFooterProbeRef.current,
      lastFooterProbeRef.current,
    ];
    nodes.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [invoice, shop]);

  const pages: InvoicePage[] = useMemo(
    () =>
      paginateInvoicePages({
        items: invoice.items || [],
        ...metrics,
      }),
    [invoice.items, metrics],
  );

  const pageCount = pages.length;
  const footerContacts = {
    contactPhones,
    contactLocations,
    contactEmails,
  };

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
          <ArrowLeft className="size-4" />
          <span className="hidden sm:inline">Go Back</span>
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2.5 py-1 rounded-md shadow-xs">
            {pageCount} {pageCount === 1 ? "Page" : "Pages"} (A4)
          </span>
          <Button
            onClick={handlePrint}
            className="gap-2 bg-primary text-primary-foreground font-semibold shadow-xs hover:opacity-95 cursor-pointer"
            size="sm"
          >
            <Printer className="size-4" /> Print / Save as PDF
          </Button>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute w-[210mm] overflow-hidden pointer-events-none print:hidden"
        style={{
          left: "-9999px",
          top: 0,
          visibility: "hidden",
        }}
      >
        <div ref={rulerRef} style={{ height: "297mm", width: "210mm" }} />
        <div className="px-10">
          <div ref={detailsProbeRef}>
            <RIV_Details shop={shop} invoice={invoice} />
          </div>
        </div>
        <div className="px-10">
          <div ref={barProbeRef}>
            <RIV_ContinuationBar
              shopName={shopName}
              invoice={invoice}
              pageNo={2}
              pageCount={2}
            />
          </div>
        </div>
        <div ref={tableProbeRef} className="px-10">
          <RIV_ProductTable
            items={[probeItem]}
            startIndex={0}
            broughtForward={100}
            carriedForward={200}
            fromPage={1}
            toPage={2}
            showBroughtForward
            showCarryForward
          />
        </div>
        <div className="px-10">
          <div ref={calcProbeRef}>
            <RIV_Calculation invoice={invoice} />
          </div>
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
              className="invoice-page relative w-full max-w-[210mm] bg-white text-slate-900 shadow-xl rounded-sm border border-slate-200/80 print:border-none print:shadow-none print:rounded-none print:max-w-none overflow-hidden"
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
                  <RIV_Details shop={shop} invoice={invoice} />
                ) : (
                  <RIV_ContinuationBar
                    shopName={shopName}
                    invoice={invoice}
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

                {page.showCalculation && <RIV_Calculation invoice={invoice} />}
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
