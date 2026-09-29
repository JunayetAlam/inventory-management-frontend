import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invoice Management",
  description: "Sign in to manage products, customers, and invoices.",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-5 py-10">
      <div className="flex w-full flex-col items-center justify-center gap-5">
        {children}
      </div>
    </div>
  );
}
