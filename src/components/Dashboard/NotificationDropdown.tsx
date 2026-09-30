"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon, Tick02Icon, TickDouble02Icon, InformationCircleIcon, Alert02Icon, AlertCircleIcon, Clock01Icon, SparklesIcon, LinkSquare02Icon } from "@hugeicons/core-free-icons";
import {
  useGetMyNotificationsQuery,
  useGetUnreadNotificationCountQuery,
  useMarkAllAsReadMutation,
  useMarkAsReadMutation,
} from "@/redux/api/notificationApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationType, TNotification } from "@/types";
import { cn } from "@/lib/utils";

const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "SUCCESS":
      return <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="size-4 text-emerald-500" />;
    case "WARNING":
      return <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-4 text-amber-500" />;
    case "ERROR":
      return <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4 text-rose-500" />;
    case "DUE_REMINDER":
    case "PAYMENT_ALERT":
      return <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="size-4 text-blue-500" />;
    case "SYSTEM":
      return <HugeiconsIcon icon={SparklesIcon} strokeWidth={2} className="size-4 text-purple-500" />;
    case "INFO":
    default:
      return <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="size-4 text-sky-500" />;
  }
};

export default function NotificationDropdown() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { data: countData } = useGetUnreadNotificationCountQuery(undefined, {
    pollingInterval: 15000,
  });
  const unreadCount = countData?.data?.unreadCount || 0;

  const { data: notifData, isLoading } = useGetMyNotificationsQuery(
    { limit: 20 },
    { skip: !open },
  );
  const notifications = notifData?.data || [];

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead, { isLoading: isMarkingAll }] = useMarkAllAsReadMutation();

  const handleNotificationClick = async (notif: TNotification) => {
    if (!notif.isRead) {
      try {
        await markAsRead(notif.id).unwrap();
      } catch (err) {
        console.error("Failed to mark notification as read", err);
      }
    }
    if (notif.link) {
      setOpen(false);
      router.push(notif.link);
    }
  };

  const handleMarkAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await markAllAsRead().unwrap();
    } catch (err) {
      console.error("Failed to mark all notifications as read", err);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex size-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <HugeiconsIcon icon={Notification01Icon} strokeWidth={2} className="size-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex min-w-5 h-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white shadow-sm ring-2 ring-background animate-in zoom-in-50">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 rounded-xl border border-border bg-popover p-0 shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0 text-xs font-normal">
                {unreadCount} new
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAll}
              disabled={isMarkingAll}
              className="h-7 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              <HugeiconsIcon icon={TickDouble02Icon} strokeWidth={2} className="size-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {/* List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-border/50">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="size-8 shrink-0 rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
                <HugeiconsIcon icon={Notification01Icon} strokeWidth={2} className="size-5" />
              </div>
              <p className="text-sm font-medium text-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You're all caught up!
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={cn(
                  "flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-muted/50 relative",
                  !notif.isRead && "bg-primary/5 hover:bg-primary/10",
                )}
              >
                {/* Type Icon Container */}
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-background border border-border shadow-xs">
                  {getNotificationIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "text-xs font-semibold truncate",
                        notif.isRead ? "text-foreground/90" : "text-foreground font-bold",
                      )}
                    >
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>

                  {notif.link && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary mt-1.5 hover:underline">
                      View details
                      <HugeiconsIcon icon={LinkSquare02Icon} strokeWidth={2} className="size-3" />
                    </span>
                  )}
                </div>

                {/* Unread indicator */}
                {!notif.isRead && (
                  <span className="size-2 shrink-0 rounded-full bg-primary mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
