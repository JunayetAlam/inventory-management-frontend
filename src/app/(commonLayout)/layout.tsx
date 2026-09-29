import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoice Management",
  description: "Internal shop tool for products, customers, and invoices.",
};

export default function CommonLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
