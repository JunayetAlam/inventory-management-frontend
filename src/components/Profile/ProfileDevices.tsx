"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ComputerIcon, Delete02Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Spinner from "../Global/Spinner";
import ConfirmPopup from "../Global/ConfirmPopup";
import { DeviceSession } from "@/types";
import { toast } from "sonner";
import {
  useGetLoggedInDevicesQuery,
  useRemoveDeviceMutation,
} from "@/redux/api/userApi";

const formatDate = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

function DeviceRow({
  device,
  onRemove,
  isRemoving,
}: {
  device: DeviceSession;
  onRemove: (id: string) => void;
  isRemoving: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <HugeiconsIcon icon={ComputerIcon} strokeWidth={2} className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-gray-900">
              {device.userAgent || "Unknown device"}
            </p>
            {device.isCurrent ? <Badge>Current</Badge> : null}
          </div>
          <p className="text-xs text-muted-foreground">
            {device.ip || "Unknown IP"} · Last seen {formatDate(device.lastSeenAt)}
          </p>
        </div>
      </div>
      <ConfirmPopup
        title={device.isCurrent ? "Log out this device?" : "Remove this device?"}
        description={
          device.isCurrent
            ? "You will be signed out of this session."
            : "This session will be signed out."
        }
        confirmLabel={device.isCurrent ? "Log out" : "Remove"}
        loading={isRemoving}
        onConfirm={() => onRemove(device.id)}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-destructive"
          disabled={isRemoving}
        >
          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} className="mr-2 size-4" />
          {device.isCurrent ? "Log out" : "Remove"}
        </Button>
      </ConfirmPopup>
    </div>
  );
}

export default function ProfileDevices() {
  const { data, isLoading } = useGetLoggedInDevicesQuery(undefined);
  const [removeDevice, { isLoading: isRemoving }] = useRemoveDeviceMutation();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const devices = data?.data || [];

  const handleRemove = async (id: string) => {
    setPendingId(id);
    const toastId = toast.loading("Removing device...");
    try {
      const result = await removeDevice(id).unwrap();
      toast.success(result?.message || "Device removed", { id: toastId });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to remove device", { id: toastId });
      throw error;
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Devices</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Sessions signed in to your account. Remove any you do not recognize.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : devices.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active devices.</p>
      ) : (
        <div className="space-y-3">
          {devices.map((device) => (
            <DeviceRow
              key={device.id}
              device={device}
              onRemove={handleRemove}
              isRemoving={isRemoving && pendingId === device.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
