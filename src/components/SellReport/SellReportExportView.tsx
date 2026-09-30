"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, PrinterIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  TProductProfitRow,
  TProductProfitSummary,
  TShop,
} from "@/types";
import { useGetShopDetailsQuery } from "@/redux/api/shopApi";
import InvoiceStyle from "@/components/Invoices/InvoiceView.tsx/invoice-style";
import SellReportListHeader from "./SellReportExport/SellReportListHeader";
import SellReportListContinuationBar from "./SellReportExport/SellReportListContinuationBar";
import SellReportListFooter from "./SellReportExport/SellReportListFooter";
import SellReportListTable from "./SellReportExport/SellReportListTable";
import {
  LIST_CONTENT_FOOTER_GAP,
  paginateProductProfitListPages,
  type ProductProfitListPage,
} from "../ProductProfit/ProductProfitExport/paginateProductProfitListPages";

type ListMetrics = {
  pageHeight: number;
  footerHeight: number;
  headerHeight: number;
  continuationBarHeight: number;
  tableHeaderHeight: number;
  rowHeight: number;
  emptyStateHeight: number;
};

const FALLBACK_METRICS: ListMetrics = {
  pageHeight: 1122.5,
  footerHeight: 40,
  headerHeight: 140,
  continuationBarHeight: 32,
  tableHeaderHeight: 32,
  rowHeight: 36,
  emptyStateHeight: 48,
};

const PROBE_PRODUCT: TProductProfitRow = {
  productId: "probe-product",
  productName: "Measurement Product",
  unit: "PIECE",
  soldQty: 10,
  salesTotal: 1000,
  purchaseCost: 800,
  assumedBuyFromSellQty: 0,
  avgPurchase: 80,
  avgSale: 100,
  profit: 200,
  profitPercent: 20,
  invoices: [],
};

const PROBE_SUMMARY: TProductProfitSummary = {
  soldQty: 10,
  salesTotal: 1000,
  purchaseCost: 800,
  profit: 200,
  profitPercent: 20,
  productCount: 1,
};

function metricsEqual(a: ListMetrics, b: ListMetrics) {
  return (Object.keys(a) as (keyof ListMetrics)[]).every(
    (key) => Math.abs(a[key] - b[key]) < 0.5,
  );
}

export default function SellReportExportView({
  products,
  summary,
  filterLabel,
  searchTerm,
  backHref = "/sell-report",
}: {
  products: TProductProfitRow[];
  summary: TProductProfitSummary;
  filterLabel: string;
  searchTerm?: string;
  backHref?: string;
}) {
  const router = useRouter();
  const rulerRef = useRef<HTMLDivElement>(null);
  const headerProbeRef = useRef<HTMLDivElement>(null);
  const barProbeRef = useRef<HTMLDivElement>(null);
  const tableProbeRef = useRef<HTMLDivElement>(null);
  const footerProbeRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<ListMetrics>(FALLBACK_METRICS);
  const didAutoPrint = useRef(false);

  const { data: shopResponse, isLoading: isShopLoading } =
    useGetShopDetailsQuery();
  const shop = shopResponse?.data as TShop | null | undefined;
  const shopName = shop?.name || "Shop";
  const generatedAt = useMemo(() => new Date().toISOString(), []);

  useEffect(() => {
    const previous = document.title;
    document.title = `${shopName} — Sell Report`;
    return () => {
      document.title = previous;
    };
  }, [shopName]);

  useEffect(() => {
    const readMetrics = (): ListMetrics => {
      const tableRoot = tableProbeRef.current;
      const headerEl = tableRoot?.querySelector(
        '[data-probe="header"]',
      ) as HTMLElement | null;
      const itemEl = tableRoot?.querySelector(
        '[data-row="item"]',
      ) as HTMLElement | null;
      const emptyEl = tableRoot?.querySelector(
        '[data-row="empty"]',
      ) as HTMLElement | null;

      return {
        pageHeight: rulerRef.current?.offsetHeight || FALLBACK_METRICS.pageHeight,
        footerHeight:
          footerProbeRef.current?.offsetHeight || FALLBACK_METRICS.footerHeight,
        headerHeight:
          headerProbeRef.current?.offsetHeight || FALLBACK_METRICS.headerHeight,
        continuationBarHeight:
          barProbeRef.current?.offsetHeight ||
          FALLBACK_METRICS.continuationBarHeight,
        tableHeaderHeight:
          headerEl?.offsetHeight || FALLBACK_METRICS.tableHeaderHeight,
        rowHeight: itemEl?.offsetHeight || FALLBACK_METRICS.rowHeight,
        emptyStateHeight:
          emptyEl?.offsetHeight || FALLBACK_METRICS.emptyStateHeight,
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
      headerProbeRef.current,
      barProbeRef.current,
      tableProbeRef.current,
      footerProbeRef.current,
    ];
    nodes.forEach((node) => {
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, [shop, products.length, filterLabel, searchTerm, summary]);

  const pages: ProductProfitListPage[] = useMemo(
    () =>
      paginateProductProfitListPages({
        products,
        ...metrics,
      }),
    [products, metrics],
  );

  const pageCount = pages.length;

  const handlePrint = () => window.print();

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
          <span className="text-xs font-mono font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-2.5 py-1 rounded-md shadow-xs">
            {pageCount} {pageCount === 1 ? "Page" : "Pages"} (A4)
          </span>
          <Button
            onClick={handlePrint}
            className="gap-2 bg-primary text-primary-foreground font-semibold shadow-xs hover:opacity-95 cursor-pointer"
            size="sm"
          >
            <HugeiconsIcon icon={PrinterIcon} strokeWidth={2} className="size-4" /> Print / Save as PDF
          </Button>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="absolute w-[210mm] overflow-hidden pointer-events-none print:hidden"
        style={{ left: "-9999px", top: 0, visibility: "hidden" }}
      >
        <div ref={rulerRef} style={{ height: "297mm", width: "210mm" }} />
        <div className="px-10">
          <div ref={headerProbeRef}>
            <SellReportListHeader
              shop={shop}
              generatedAt={generatedAt}
              filterLabel={filterLabel}
              searchTerm={searchTerm}
              totalCount={products.length || 1}
              summary={summary.productCount ? summary : PROBE_SUMMARY}
            />
          </div>
        </div>
        <div className="px-10">
          <div ref={barProbeRef}>
            <SellReportListContinuationBar
              shopName={shopName}
              pageNo={2}
              pageCount={2}
            />
          </div>
        </div>
        <div ref={tableProbeRef} className="px-10">
          <SellReportListTable products={[PROBE_PRODUCT]} startIndex={0} />
          <SellReportListTable products={[]} empty />
        </div>
        <div ref={footerProbeRef}>
          <SellReportListFooter pageNo={1} pageCount={1} />
        </div>
      </div>

      <div
        id="a4-invoice-sheet"
        className="flex flex-col items-center gap-6 print:gap-0"
      >
        {pages.map((page) => (
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
              className="px-10 pt-8"
              style={{
                paddingBottom: metrics.footerHeight + LIST_CONTENT_FOOTER_GAP,
              }}
            >
              {page.pageNo === 1 ? (
                <SellReportListHeader
                  shop={shop}
                  generatedAt={generatedAt}
                  filterLabel={filterLabel}
                  searchTerm={searchTerm}
                  totalCount={products.length}
                  summary={summary}
                />
              ) : (
                <SellReportListContinuationBar
                  shopName={shopName}
                  pageNo={page.pageNo}
                  pageCount={pageCount}
                />
              )}

              <div className="pt-4">
                <SellReportListTable
                  products={page.products}
                  startIndex={page.startIndex}
                  empty={products.length === 0}
                />
              </div>
            </div>

            <div className="absolute left-0 right-0 bottom-0">
              <SellReportListFooter
                pageNo={page.pageNo}
                pageCount={pageCount}
              />
            </div>
          </div>
        ))}
      </div>

      <InvoiceStyle />
    </div>
  );
}
