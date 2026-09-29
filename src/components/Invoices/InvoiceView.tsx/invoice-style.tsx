import React from "react";

export default function InvoiceStyle() {
  return (
    <style jsx global>{`
      @media print {
        @page {
          size: A4 portrait;
          margin: 0;
        }
        html,
        body {
          background-color: #ffffff !important;
          color: #0f172a !important;
          margin: 0 !important;
          padding: 0 !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        header,
        nav,
        aside,
        .no-print {
          display: none !important;
        }
        #a4-invoice-sheet {
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          gap: 0 !important;
        }
        .invoice-page {
          width: 210mm !important;
          height: 297mm !important;
          max-width: 210mm !important;
          box-shadow: none !important;
          border: none !important;
          border-radius: 0 !important;
          margin: 0 !important;
          overflow: hidden !important;
          page-break-after: always;
          break-after: page;
        }
        .invoice-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }
      }
    `}</style>
  );
}
