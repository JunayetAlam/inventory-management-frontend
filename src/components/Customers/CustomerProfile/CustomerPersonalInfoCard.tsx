"use client";

import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Call02Icon, Mail01Icon, Location01Icon, Calendar03Icon, UserIcon, Copy01Icon, Tick02Icon, Alert02Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { TCustomer } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

const getWhatsAppUrl = (
  number?: string | null,
  defaultCountryCode = "+880",
) => {
  if (!number) return null;
  let clean = number.replace(/[^\d+]/g, "");
  if (clean.startsWith("+")) {
    clean = clean.slice(1);
  } else if (clean.startsWith("01") && clean.length === 11) {
    clean = `88${clean}`;
  } else if (!clean.startsWith("880") && defaultCountryCode) {
    const cc = defaultCountryCode.replace(/\+/g, "");
    clean = `${cc}${clean}`;
  }
  return `https://wa.me/${clean}`;
};

interface CustomerPersonalInfoCardProps {
  customer: TCustomer;
}

export default function CustomerPersonalInfoCard({
  customer,
}: CustomerPersonalInfoCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied to clipboard`);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const initials = customer.name
    ? customer.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "CU";

  const fullPhone = `${customer.countryCode || "+880"} ${customer.phoneNumber}`;
  const waUrl = getWhatsAppUrl(
    customer.whatsappNumber || customer.phoneNumber,
    customer.countryCode,
  );

  return (
    <Card className="shadow-xs ring-border/60 border overflow-hidden">
      <CardContent className=" space-y-4">
        {/* Top Header: Avatar + Identity + Status + WhatsApp action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <Avatar className="size-12 sm:size-14 border border-border/80 shadow-xs shrink-0">
              {customer.image && (
                <AvatarImage
                  src={customer.image}
                  alt={customer.name}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="text-base sm:text-lg font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
                  {customer.name}
                </h2>
                {customer.isDeleted ? (
                  <Badge
                    variant="destructive"
                    className="text-[10px] py-0 px-1.5"
                  >
                    Deleted
                  </Badge>
                ) : customer.isDeleteRequested ? (
                  <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 text-[10px] py-0 px-1.5 font-normal">
                    Pending Deletion
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] py-0 px-1.5 font-normal"
                  >
                    Active
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                {customer.createdAt && (
                  <span className="inline-flex items-center gap-1">
                    <HugeiconsIcon icon={Calendar03Icon} strokeWidth={2} className="size-3 text-muted-foreground/70" />
                    Since{" "}
                    {new Date(customer.createdAt).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )}
                  </span>
                )}
                {customer.createdBy && (
                  <span className="inline-flex items-center gap-1">
                    <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-3 text-muted-foreground/70" />
                    By {customer.createdBy.firstName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick WhatsApp chat button */}
          {waUrl && (
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              <Button
                asChild
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs cursor-pointer h-8 px-3 text-xs font-medium"
              >
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Chat with ${customer.name} on WhatsApp`}
                >
                  <WhatsAppIcon className="size-3.5 shrink-0" />
                  WhatsApp Chat
                </a>
              </Button>
            </div>
          )}
        </div>

        {/* Delete Reason Alert if Pending */}
        {customer.isDeleteRequested && customer.deleteReason && (
          <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-md px-2.5 py-1.5">
            <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-3.5 shrink-0" />
            <span>Deletion Reason: "{customer.deleteReason}"</span>
          </div>
        )}

        {/* Concise Contact Info Strip (Small & Compact) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-3 border-t border-border/50">
          {/* 1. Phone Number */}
          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-muted/30 border border-border/40 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <HugeiconsIcon icon={Call02Icon} strokeWidth={2} className="size-3.5 text-primary shrink-0" />
              <a
                href={`tel:${customer.phoneNumber}`}
                className="text-xs font-semibold text-foreground hover:text-primary transition-colors font-mono truncate"
                title={fullPhone}
              >
                {fullPhone}
              </a>
            </div>
            <button
              type="button"
              onClick={() =>
                copyToClipboard(customer.phoneNumber, "Phone number")
              }
              className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-1 shrink-0"
              title="Copy Phone Number"
            >
              {copiedField === "Phone number" ? (
                <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3 text-emerald-600" />
              ) : (
                <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3" />
              )}
            </button>
          </div>

          {/* 2. WhatsApp Number */}
          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-muted/30 border border-border/40 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <WhatsAppIcon className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span
                className="text-xs font-medium text-foreground truncate font-mono"
                title={customer.whatsappNumber || "Same as phone"}
              >
                {customer.whatsappNumber
                  ? customer.whatsappNumber
                  : "Same as phone"}
              </span>
            </div>
            {customer.whatsappNumber && (
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(customer.whatsappNumber!, "WhatsApp number")
                }
                className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-1 shrink-0"
                title="Copy WhatsApp Number"
              >
                {copiedField === "WhatsApp number" ? (
                  <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3 text-emerald-600" />
                ) : (
                  <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3" />
                )}
              </button>
            )}
          </div>

          {/* 3. Email Address */}
          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-muted/30 border border-border/40 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              {customer.email ? (
                <a
                  href={`mailto:${customer.email}`}
                  className="text-xs font-medium text-foreground hover:text-primary transition-colors truncate"
                  title={customer.email}
                >
                  {customer.email}
                </a>
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  No email
                </span>
              )}
            </div>
            {customer.email && (
              <button
                type="button"
                onClick={() => copyToClipboard(customer.email!, "Email")}
                className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-1 shrink-0"
                title="Copy Email"
              >
                {copiedField === "Email" ? (
                  <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3 text-emerald-600" />
                ) : (
                  <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3" />
                )}
              </button>
            )}
          </div>

          {/* 4. Physical Address */}
          <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md bg-muted/30 border border-border/40 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <HugeiconsIcon icon={Location01Icon} strokeWidth={2} className="size-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
              {customer.address ? (
                <span
                  className="text-xs font-medium text-foreground truncate"
                  title={customer.address}
                >
                  {customer.address}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground italic">
                  No address
                </span>
              )}
            </div>
            {customer.address && (
              <button
                type="button"
                onClick={() => copyToClipboard(customer.address!, "Address")}
                className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors p-1 shrink-0"
                title="Copy Address"
              >
                {copiedField === "Address" ? (
                  <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-3 text-emerald-600" />
                ) : (
                  <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3" />
                )}
              </button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
