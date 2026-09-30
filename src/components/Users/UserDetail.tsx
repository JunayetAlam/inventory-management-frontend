"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon, ComputerIcon, Delete02Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import useIsAdmin from "@/hooks/useIsAdmin";
import {
  useGetMeQuery,
  useGetUserByIdQuery,
  useGetUserDevicesQuery,
  useRevokeUserDeviceMutation,
} from "@/redux/api/userApi";
import { canManageUser, roleLabel } from "@/utils/userAccess";
import { Button } from "@/components/ui/button";
import ConfirmPopup from "../Global/ConfirmPopup";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "./StatusBadge";
import UserActions from "./UserActions";
import Spinner from "../Global/Spinner";
import UserActivityLogs from "./UserActivityLogs";

const formatDate = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function UserDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const [isAdmin, isAdminLoading] = useIsAdmin();
  const { data: me } = useGetMeQuery(undefined);
  const actorRole = me?.data?.role;
  const { data, isLoading, isError } = useGetUserByIdQuery(id, { skip: !isAdmin });
  const user = data?.data;
  const canManage = canManageUser(actorRole, user?.role || "");
  const { data: devicesData, isLoading: devicesLoading } = useGetUserDevicesQuery(id, {
    skip: !isAdmin || !user || !canManage,
  });
  const [revokeDevice] = useRevokeUserDeviceMutation();
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [isAdmin, isAdminLoading, router]);

  const handleRevoke = async (sessionId: string) => {
    setPendingId(sessionId);
    const toastId = toast.loading("Removing device...");
    try {
      await revokeDevice({ userId: id, sessionId }).unwrap();
      toast.success("Device removed", { id: toastId });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to remove device", { id: toastId });
      throw error;
    } finally {
      setPendingId(null);
    }
  };

  if (isAdminLoading || isLoading || !isAdmin) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">User not found.</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 mt-2 cursor-pointer"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} className="size-4" />
          <span className="hidden sm:inline">Go Back</span>
        </Button>
      </div>
    );
  }

  const devices = devicesData?.data || [];

  return (
    <div className="space-y-6 p-6">
      <Button
        variant="ghost"
        className="px-0 gap-2 cursor-pointer"
        onClick={() => router.back()}
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} strokeWidth={2} className="size-4" />
        <span className="hidden sm:inline">Go Back</span>
      </Button>

      <div className="rounded-lg border border-border bg-background p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="secondary">{roleLabel[user.role] || user.role}</Badge>
              <StatusBadge status={user.status} />
            </div>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Phone</dt>
                <dd>{user.phoneNumber || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email verified</dt>
                <dd>{user.isEmailVerified ? "Yes" : "No"}</dd>
              </div>
            </dl>
          </div>
          <UserActions user={user} actorRole={actorRole} />
        </div>
      </div>

      {canManage ? (
        <div className="rounded-lg border border-border bg-background p-6">
          <h2 className="text-lg font-semibold">Devices</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Log out a specific device for this user.
          </p>
          {devicesLoading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : devices.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No active devices.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {devices.map((device) => (
                <div
                  key={device.id}
                  className="flex flex-col gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <HugeiconsIcon icon={ComputerIcon} strokeWidth={2} className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {device.userAgent || "Unknown device"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {device.ip || "Unknown IP"} · Last seen {formatDate(device.lastSeenAt)}
                      </p>
                    </div>
                  </div>
                  <ConfirmPopup
                    title="Log out this device?"
                    description="This session will be signed out."
                    confirmLabel="Log out"
                    loading={pendingId === device.id}
                    onConfirm={() => handleRevoke(device.id)}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive"
                      disabled={pendingId === device.id}
                    >
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="mr-2 size-4" />
                      Log out device
                    </Button>
                  </ConfirmPopup>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          You can view this account but cannot manage it.
        </p>
      )}

      {/* User Activity History */}
      <UserActivityLogs userId={id} />
    </div>
  );
}
