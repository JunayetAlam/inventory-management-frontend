"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import {
  Alert02Icon,
  ArrowDataTransferHorizontalIcon,
  ChartIncreaseIcon,
  ContactBookIcon,
  DashboardSquare01Icon,
  HistoryIcon,
  Invoice02Icon,
  PackageIcon,
  SidebarLeft01Icon,
  SidebarRight01Icon,
  Store01Icon,
  Undo02Icon,
  UserMultipleIcon,
  Wrench01Icon,
  Xls01Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import useIsAdmin from "@/hooks/useIsAdmin";
import useIsPrivileged from "@/hooks/useIsPrivileged";
import { useGetShopDetailsQuery } from "@/redux/api/shopApi";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const SIDEBAR_COLLAPSED_KEY = "rms-sidebar-collapsed";

type NavItem = {
  name: string;
  href: string;
  icon: IconSvgElement;
};

type NavGroup = {
  title?: string;
  items: NavItem[];
};

function SidebarItem({
  item,
  isActive,
  collapsed,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center rounded-md text-sm transition-colors",
        collapsed ? "justify-center px-0 py-2.5" : "gap-2 px-3 py-2",
        isActive
          ? "bg-primary text-background font-medium"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
      )}
    >
      <HugeiconsIcon icon={Icon} strokeWidth={2} className="size-4 shrink-0" />
      <span className={cn("truncate", collapsed && "sr-only")}>{item.name}</span>
    </Link>
  );

  if (!collapsed) {
    return link;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {item.name}
      </TooltipContent>
    </Tooltip>
  );
}

export default function DashboardSidebar() {
  const pathname = usePathname();
  const [isAdmin] = useIsAdmin();
  const { isPrivileged } = useIsPrivileged();
  const { data: shopResponse } = useGetShopDetailsQuery();
  const shop = shopResponse?.data;
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
    } catch {
      // Ignore storage access errors (private mode, etc.)
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((previous) => {
      const next = !previous;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // Ignore storage access errors (private mode, etc.)
      }
      return next;
    });
  };

  const navGroups: NavGroup[] = [
    {
      items: [
        { name: "Dashboard", href: "/dashboard", icon: DashboardSquare01Icon },
      ],
    },
    {
      title: "Profiles",
      items: [
        { name: "Customers", href: "/customers", icon: ContactBookIcon },
      ],
    },
    {
      title: "Manage Inventory",
      items: [
        { name: "Products", href: "/products", icon: PackageIcon },
        { name: "Low Stock", href: "/low-stock", icon: Alert02Icon },
      ],
    },
    {
      title: "Transactions",
      items: [
        {
          name: "Customer Transactions",
          href: "/customer-transactions",
          icon: ArrowDataTransferHorizontalIcon,
        },
        { name: "Invoices", href: "/invoices", icon: Invoice02Icon },
        { name: "Return Invoices", href: "/return-invoices", icon: Undo02Icon },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: "Report",
            items: [
              {
                name: "Product Profit/Loss",
                href: "/product-profit-loss",
                icon: ChartIncreaseIcon,
              },
              {
                name: "Sell Report",
                href: "/sell-report",
                icon: Xls01Icon,
              },
            ],
          },
          {
            title: "Administration",
            items: [
              { name: "Users", href: "/users", icon: UserMultipleIcon },
              { name: "Activity Logs", href: "/activity-logs", icon: HistoryIcon },
            ],
          },
        ]
      : []),
    {
      title: "Shop Management",
      items: [
        { name: "Shop Details", href: "/shop-details", icon: Store01Icon },
        ...(isPrivileged
          ? [{ name: "Maintenance", href: "/privileged/maintenance", icon: Wrench01Icon }]
          : []),
      ],
    },
  ];

  const toggleLabel = collapsed ? "Expand sidebar" : "Minimize sidebar";

  return (
    <aside
      className={cn(
        "sticky top-0 z-20 flex h-svh shrink-0 flex-col self-start overflow-visible border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-in-out",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex min-h-16 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-2 py-3" : "px-4 py-4",
        )}
      >
        {shop?.logo ? (
          <Link href="/dashboard" className="flex items-center justify-center">
            <Image
              src={shop.logo}
              alt={shop.name || "Shop Logo"}
              width={collapsed ? 32 : 200}
              height={collapsed ? 32 : 200}
              className={cn(
                "object-contain",
                collapsed ? "size-8" : "max-h-14 w-auto max-w-[220px]",
              )}
            />
          </Link>
        ) : (
          <Link
            href="/dashboard"
            className={cn("block min-w-0", collapsed && "flex justify-center")}
            aria-label={shop?.name || "Invoice Management"}
          >
            {collapsed ? (
              <HugeiconsIcon icon={Store01Icon} strokeWidth={2} className="size-5" />
            ) : (
              <>
                <p className="truncate text-sm font-semibold text-sidebar-foreground">
                  {shop?.name || "Invoice Management"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {shop?.proprietor || "Store Management"}
                </p>
              </>
            )}
          </Link>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-3 pb-10">
        {navGroups.map((group, groupIndex) => (
          <div key={group.title || groupIndex} className="flex flex-col gap-1">
            {group.title && (
              collapsed ? (
                <div className="mx-1 my-0.5 border-t border-sidebar-border" />
              ) : (
                <p className="px-3 pt-1 pb-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 select-none">
                  {group.title}
                </p>
              )
            )}
            {group.items.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <SidebarItem
                  key={item.name}
                  item={item}
                  isActive={isActive}
                  collapsed={collapsed}
                />
              );
            })}
          </div>
        ))}
      </nav>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={toggleCollapsed}
            aria-label={toggleLabel}
            aria-expanded={!collapsed}
            className="absolute bottom-4 right-0 z-30 translate-x-1/2 rounded-full bg-background shadow-sm"
          >
            {collapsed ? (
              <HugeiconsIcon icon={SidebarRight01Icon} strokeWidth={2} className="size-4" />
            ) : (
              <HugeiconsIcon icon={SidebarLeft01Icon} strokeWidth={2} className="size-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          {toggleLabel}
        </TooltipContent>
      </Tooltip>
    </aside>
  );
}
