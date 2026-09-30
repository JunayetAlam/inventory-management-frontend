"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetAllActivityLogsQuery } from "@/redux/api/activityLogApi";
import { TProduct } from "@/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { Activity01Icon, Globe02Icon, PackageIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface ProductActivitySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: TProduct | null;
}

const getActionBadge = (action: string) => {
  switch (action) {
    case "CREATE_PRODUCT":
      return (
        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
          Created Product
        </Badge>
      );
    case "UPDATE_PRODUCT":
      return (
        <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
          Updated Product
        </Badge>
      );
    case "REQUEST_DELETE_PRODUCT":
      return (
        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
          Deletion Requested
        </Badge>
      );
    case "ADMIN_CONFIRM_DELETE_PRODUCT":
    case "ADMIN_DELETE_PRODUCT":
      return (
        <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">
          Deleted
        </Badge>
      );
    case "ADMIN_REJECT_DELETE_PRODUCT":
      return (
        <Badge className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20">
          Deletion Rejected
        </Badge>
      );
    case "ADMIN_RESTORE_PRODUCT":
      return (
        <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
          Restored (Undo)
        </Badge>
      );
    default:
      return <Badge variant="outline">{action}</Badge>;
  }
};

export default function ProductActivitySheet({
  open,
  onOpenChange,
  product,
}: ProductActivitySheetProps) {
  const { data, isLoading } = useGetAllActivityLogsQuery(
    product
      ? {
          entityType: "PRODUCT",
          entityId: product.id,
          limit: 50,
        }
      : undefined,
    { skip: !open || !product },
  );

  const logs = data?.data || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-lg p-0">
        {/* Header */}
        <div className="p-6 border-b border-border bg-muted/20">
          <SheetHeader>
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <HugeiconsIcon icon={Activity01Icon} strokeWidth={2} className="size-5" />
              </div>
              <div>
                <SheetTitle className="text-base font-semibold">
                  Product Activity Log
                </SheetTitle>
                <SheetDescription className="text-xs truncate max-w-xs">
                  {product?.name || "Product audit trail"}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {product && (
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-border/80 bg-background/80 p-2.5 text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px]">Selling Price</span>
                <span className="font-semibold text-foreground">৳{product.sellingPrice}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Buying Price</span>
                <span className="font-semibold text-foreground">
                  {product.buyingPrice != null ? `৳${product.buyingPrice}` : "—"}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px]">Stock</span>
                <span
                  className={`font-semibold ${
                    product.stock < 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-foreground"
                  }`}
                >
                  {product.stock} {product.unit}
                  {product.stock < 0 ? " (oversold)" : ""}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Timeline Log Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="size-8 rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-12 w-full rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <HugeiconsIcon icon={PackageIcon} strokeWidth={2} className="size-10 mb-2 opacity-30" />
              <p className="text-sm font-medium text-foreground">No logs recorded</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                No activity has been logged for this product yet.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {logs.map((log) => {
                const user = log.user;
                const displayName = user
                  ? `${user.firstName} ${user.lastName}`.trim()
                  : "System";
                const initials = user
                  ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
                  : "SY";

                return (
                  <div key={log.id} className="relative group">
                    {/* Node Dot */}
                    <div className="absolute -left-[27px] top-1 flex size-3.5 items-center justify-center rounded-full bg-background ring-4 ring-background border-2 border-primary" />

                    <div className="space-y-2">
                      {/* Action & Time Header */}
                      <div className="flex items-center justify-between gap-2">
                        {getActionBadge(log.action)}
                        <span className="text-[11px] text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Actor Information */}
                      <div className="flex items-center gap-2 text-xs">
                        <Avatar className="size-5 border border-border">
                          {user?.profilePhoto && (
                            <AvatarImage src={user.profilePhoto} alt={displayName} />
                          )}
                          <AvatarFallback className="text-[9px]">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground">{displayName}</span>
                        {user?.role && (
                          <span className="text-[10px] text-muted-foreground">
                            ({user.role})
                          </span>
                        )}
                      </div>

                      {/* Details Box */}
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs space-y-1.5 font-mono">
                          {Object.entries(log.details).map(([key, val]) => (
                            <div key={key} className="flex justify-between gap-2 text-[11px]">
                              <span className="text-muted-foreground capitalize">
                                {key.replace(/([A-Z])/g, " $1")}:
                              </span>
                              <span className="font-semibold text-foreground text-right truncate">
                                {typeof val === "object" ? JSON.stringify(val) : String(val)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* IP / UserAgent meta */}
                      {log.ipAddress && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <HugeiconsIcon icon={Globe02Icon} strokeWidth={2} className="size-3" />
                          <span>IP: {log.ipAddress}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
