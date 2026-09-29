import { TInvoiceItem } from "@/types";
import { roundInvoiceMoney } from "@/utils/formatInvoiceMoney";

export const INVOICE_CONTENT_FOOTER_GAP = 40;
export const INVOICE_CONTENT_TOP_PADDING = 40;
export const INVOICE_TABLE_TOP_PADDING = 16;

export type InvoicePage = {
  pageNo: number;
  items: TInvoiceItem[];
  startIndex: number;
  broughtForward: number;
  carriedForward: number;
  showBroughtForward: boolean;
  showCarryForward: boolean;
  showCalculation: boolean;
  isLast: boolean;
};

export type PaginateInvoicePagesInput = {
  items: TInvoiceItem[];
  pageHeight: number;
  compactFooterHeight: number;
  lastFooterHeight: number;
  detailsHeight: number;
  continuationBarHeight: number;
  tableHeaderHeight: number;
  rowHeight: number;
  balanceRowHeight: number;
  calculationHeight: number;
  contentTopPadding?: number;
  tableTopPadding?: number;
  extraGap?: number;
};

export function sumItemTotals(items: TInvoiceItem[]): number {
  return roundInvoiceMoney(
    items.reduce((sum, item) => sum + roundInvoiceMoney(item.totalPrice), 0),
  );
}

function pageOverhead(
  pageNo: number,
  input: Required<
    Pick<
      PaginateInvoicePagesInput,
      | "detailsHeight"
      | "continuationBarHeight"
      | "tableHeaderHeight"
      | "balanceRowHeight"
      | "contentTopPadding"
      | "tableTopPadding"
    >
  >,
): number {
  const isFirst = pageNo === 1;
  return (
    input.contentTopPadding +
    (isFirst ? input.detailsHeight : input.continuationBarHeight) +
    input.tableTopPadding +
    input.tableHeaderHeight +
    (pageNo > 1 ? input.balanceRowHeight : 0)
  );
}

export function paginateInvoicePages(
  rawInput: PaginateInvoicePagesInput,
): InvoicePage[] {
  const input = {
    contentTopPadding: INVOICE_CONTENT_TOP_PADDING,
    tableTopPadding: INVOICE_TABLE_TOP_PADDING,
    extraGap: INVOICE_CONTENT_FOOTER_GAP,
    ...rawInput,
  };

  const rowHeight = Math.max(input.rowHeight, 1);
  const balanceRowHeight = Math.max(input.balanceRowHeight, rowHeight);
  const tableHeaderHeight = Math.max(input.tableHeaderHeight, 1);
  const pageHeight = Math.max(input.pageHeight, 1);
  const extraGap = input.extraGap;
  const compactFooterHeight = Math.max(input.compactFooterHeight, 1);
  const lastFooterHeight = Math.max(input.lastFooterHeight, compactFooterHeight);

  const usableCompact = pageHeight - compactFooterHeight - extraGap;
  const usableLast = pageHeight - lastFooterHeight - extraGap;

  const overheadInput = {
    detailsHeight: Math.max(input.detailsHeight, 0),
    continuationBarHeight: Math.max(input.continuationBarHeight, 0),
    tableHeaderHeight,
    balanceRowHeight,
    contentTopPadding: input.contentTopPadding,
    tableTopPadding: input.tableTopPadding,
  };

  const items = input.items ?? [];
  const pages: InvoicePage[] = [];
  let remaining = [...items];
  let broughtForward = 0;
  let startIndex = 0;
  let pageNo = 1;

  const makePage = (
    pageItems: TInvoiceItem[],
    isLast: boolean,
  ): InvoicePage => {
    const pageItemsTotal = sumItemTotals(pageItems);
    const carriedForward = roundInvoiceMoney(broughtForward + pageItemsTotal);
    return {
      pageNo,
      items: pageItems,
      startIndex,
      broughtForward,
      carriedForward,
      showBroughtForward: pageNo > 1,
      showCarryForward: !isLast,
      showCalculation: isLast,
      isLast,
    };
  };

  while (pageNo <= 200) {
    const overhead = pageOverhead(pageNo, overheadInput);
    const remainingRowsHeight = remaining.length * rowHeight;
    const fitsAsLast =
      overhead + remainingRowsHeight + input.calculationHeight <= usableLast;

    if (fitsAsLast) {
      pages.push(makePage(remaining, true));
      break;
    }

    if (remaining.length === 0) {
      pages.push(makePage([], true));
      break;
    }

    const continuationBudget = usableCompact - overhead - balanceRowHeight;
    const allItemsFitAsContinuation =
      overhead + remainingRowsHeight + balanceRowHeight <= usableCompact;

    let take: number;
    if (allItemsFitAsContinuation) {
      take = remaining.length;
    } else {
      take = Math.floor(continuationBudget / rowHeight);
      take = Math.max(1, Math.min(take, remaining.length));
    }

    const pageItems = remaining.slice(0, take);
    remaining = remaining.slice(take);
    const page = makePage(pageItems, false);
    pages.push(page);
    broughtForward = page.carriedForward;
    startIndex += pageItems.length;
    pageNo += 1;
  }

  if (pages.length === 0) {
    pages.push(makePage(items, true));
  }

  return pages;
}
