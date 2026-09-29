"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Power,
  Save,
  Clock,
  Mail,
  Phone,
  AlertTriangle,
  ExternalLink,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  RotateCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  useGetPrivilegedMaintenanceQuery,
  useToggleMaintenanceMutation,
  useUpdateMaintenanceMutation,
} from "@/redux/api/maintenanceApi";
import useIsPrivileged from "@/hooks/useIsPrivileged";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Spinner from "@/components/Global/Spinner";

export default function PrivilegedMaintenanceControl() {
  const router = useRouter();
  const { isPrivileged, clearPrivilegedToken } = useIsPrivileged();

  const {
    data: response,
    isLoading,
    isFetching,
    refetch,
  } = useGetPrivilegedMaintenanceQuery();

  const [toggleMaintenance, { isLoading: isToggling }] =
    useToggleMaintenanceMutation();
  const [updateMaintenance, { isLoading: isUpdating }] =
    useUpdateMaintenanceMutation();

  const record = response?.data;

  // Form states
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [reason, setReason] = useState("");
  const [estimatedEndTime, setEstimatedEndTime] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [supportNotice, setSupportNotice] = useState("");

  // Confirmation toggle dialog
  const [isConfirmToggleOpen, setIsConfirmToggleOpen] = useState(false);
  const [pendingActiveState, setPendingActiveState] = useState(false);

  // Initialize form when record loads
  useEffect(() => {
    if (record) {
      setTitle(record.title || "");
      setMessage(record.message || "");
      setReason(record.reason || "");
      if (record.estimatedEndTime) {
        // Format ISO string to datetime-local input value (YYYY-MM-DDTHH:mm)
        const d = new Date(record.estimatedEndTime);
        const pad = (n: number) => String(n).padStart(2, "0");
        const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
          d.getDate(),
        )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        setEstimatedEndTime(formatted);
      } else {
        setEstimatedEndTime("");
      }
      setContactEmail(record.contactEmail || "");
      setContactPhone(record.contactPhone || "");
      setSupportNotice(record.supportNotice || "");
    }
  }, [record]);

  // Handle master toggle confirmation
  const handleToggleClick = (checked: boolean) => {
    setPendingActiveState(checked);
    setIsConfirmToggleOpen(true);
  };

  const confirmToggle = async () => {
    try {
      const res = await toggleMaintenance({
        isActive: pendingActiveState,
      }).unwrap();
      toast.success(
        res.message ||
          `Maintenance mode ${pendingActiveState ? "activated" : "deactivated"}!`,
      );
      setIsConfirmToggleOpen(false);
    } catch (err: any) {
      toast.error(
        err?.data?.message || "Failed to update maintenance toggle state.",
      );
    }
  };

  // Handle saving details
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        title: title.trim() || undefined,
        message: message.trim() || undefined,
        reason: reason.trim() || null,
        estimatedEndTime: estimatedEndTime
          ? new Date(estimatedEndTime).toISOString()
          : null,
        contactEmail: contactEmail.trim() || null,
        contactPhone: contactPhone.trim() || null,
        supportNotice: supportNotice.trim() || null,
      };

      const res = await updateMaintenance(payload).unwrap();
      toast.success(
        res.message || "Maintenance settings updated successfully!",
      );
    } catch (err: any) {
      toast.error(
        err?.data?.message || "Failed to save maintenance settings.",
      );
    }
  };

  const handleExitPrivilegedMode = () => {
    clearPrivilegedToken();
    toast.info("Exited privileged mode.");
    router.replace(record?.isActive ? "/maintenance" : "/dashboard");
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const isMaintenanceActive = record?.isActive ?? false;

  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-8">
      {/* Page Title - Single h1 with no subtitle following project guidelines */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Manage Maintenance
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 text-xs"
          >
            <RotateCw
              className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open("/maintenance", "_blank")}
            className="gap-1.5 text-xs"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Public Page
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleExitPrivilegedMode}
            className="gap-1.5 text-xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            Exit Privileged Mode
          </Button>
        </div>
      </div>

      {/* Privileged Notice & Status Banner */}
      <div
        className={`flex items-start gap-4 rounded-xl border p-4 shadow-sm transition-all sm:p-5 ${
          isMaintenanceActive
            ? "border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-200"
            : "border-emerald-500/50 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200"
        }`}
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
            isMaintenanceActive
              ? "bg-amber-500 text-white"
              : "bg-emerald-500 text-white"
          }`}
        >
          {isMaintenanceActive ? (
            <ShieldAlert className="h-5 w-5" />
          ) : (
            <ShieldCheck className="h-5 w-5" />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {isMaintenanceActive
                ? "System Maintenance Active (Site Locked)"
                : "System is Live (Normal Operations)"}
            </span>
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isMaintenanceActive ? "bg-amber-500 animate-ping" : "bg-emerald-500"
              }`}
            />
          </div>
          <p className="mt-1 text-xs opacity-90">
            {isMaintenanceActive
              ? "All regular users (including SuperAdmins) and API requests are blocked with HTTP 503. Only your privileged session can access the system."
              : "All users have normal access to dashboard, POS, invoices, and public endpoints."}
          </p>
        </div>

        {/* Master Switch Toggler */}
        <div className="flex items-center gap-3">
          <Label
            htmlFor="master-switch"
            className="text-xs font-bold uppercase tracking-wider"
          >
            {isMaintenanceActive ? "Maintenance ON" : "Maintenance OFF"}
          </Label>
          <Switch
            id="master-switch"
            checked={isMaintenanceActive}
            onCheckedChange={handleToggleClick}
            disabled={isToggling}
            className="data-[state=checked]:bg-amber-500"
          />
        </div>
      </div>

      {/* Main Grid: Settings Form & Live Preview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form Column */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSaveDetails}
            className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">
                  Maintenance Configuration
                </h2>
              </div>
              <span className="text-xs text-muted-foreground">
                Last modified:{" "}
                {record?.updatedAt
                  ? new Date(record.updatedAt).toLocaleString()
                  : "Never"}
              </span>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="maint-title" className="text-xs font-medium">
                Public Header Title
              </Label>
              <Input
                id="maint-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="System Under Maintenance"
                required
              />
            </div>

            {/* Message */}
            <div className="space-y-1.5">
              <Label htmlFor="maint-msg" className="text-xs font-medium">
                Downtime Message / Description
              </Label>
              <Textarea
                id="maint-msg"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="We are currently performing scheduled maintenance..."
                required
              />
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <Label htmlFor="maint-reason" className="text-xs font-medium">
                Scope / Maintenance Reason (Optional)
              </Label>
              <Input
                id="maint-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Database schema migration & server upgrade"
              />
            </div>

            {/* Estimated Completion Date & Time */}
            <div className="space-y-1.5">
              <Label htmlFor="maint-eta" className="text-xs font-medium">
                Estimated Completion Time (UTC / Local)
              </Label>
              <Input
                id="maint-eta"
                type="datetime-local"
                value={estimatedEndTime}
                onChange={(e) => setEstimatedEndTime(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Displays a live dynamic countdown clock on the public maintenance page.
              </p>
            </div>

            {/* Contact Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="maint-email" className="text-xs font-medium">
                  Support Email
                </Label>
                <Input
                  id="maint-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="support@example.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="maint-phone" className="text-xs font-medium">
                  Emergency Phone
                </Label>
                <Input
                  id="maint-phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+880 1XXX-XXXXXX"
                />
              </div>
            </div>

            {/* Support Notice */}
            <div className="space-y-1.5">
              <Label htmlFor="maint-notice" className="text-xs font-medium">
                Support Notice / Disclaimer (Optional)
              </Label>
              <Input
                id="maint-notice"
                value={supportNotice}
                onChange={(e) => setSupportNotice(e.target.value)}
                placeholder="e.g. Urgent queries can be directed to the hotline above."
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={isUpdating}
                className="w-full gap-2 sm:w-auto"
              >
                <Save className="h-4 w-4" />
                {isUpdating ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5">
          <div className="sticky top-6 rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-semibold text-foreground">
                Live Public Preview
              </h3>
              <span className="rounded bg-muted px-2 py-0.5 text-[10px] uppercase font-bold text-muted-foreground">
                Preview
              </span>
            </div>

            <div className="rounded-lg border border-border/80 bg-muted/20 p-5 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Wrench className="h-6 w-6" />
              </div>

              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                <span className="h-1 w-1 rounded-full bg-amber-500" />
                Maintenance Mode
              </div>

              <h4 className="text-lg font-bold text-foreground">
                {title || "System Under Maintenance"}
              </h4>

              <p className="mt-2 text-xs text-muted-foreground whitespace-pre-line">
                {message ||
                  "We are currently performing scheduled maintenance to improve our service."}
              </p>

              {reason && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded border border-border bg-muted/50 px-2 py-1 text-[11px] text-muted-foreground">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  <span>Scope: {reason}</span>
                </div>
              )}

              {estimatedEndTime && (
                <div className="mt-4 rounded-md border border-border bg-background p-3 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase text-muted-foreground">
                    <Clock className="h-3 w-3 text-primary" />
                    <span>Target: {new Date(estimatedEndTime).toLocaleString()}</span>
                  </div>
                </div>
              )}

              {(contactEmail || contactPhone) && (
                <div className="mt-4 flex flex-wrap justify-center gap-2 text-[11px]">
                  {contactEmail && (
                    <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-0.5 text-muted-foreground">
                      <Mail className="h-3 w-3 text-primary" />
                      {contactEmail}
                    </span>
                  )}
                  {contactPhone && (
                    <span className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-0.5 text-muted-foreground">
                      <Phone className="h-3 w-3 text-primary" />
                      {contactPhone}
                    </span>
                  )}
                </div>
              )}

              {supportNotice && (
                <p className="mt-3 text-[10px] italic text-muted-foreground">
                  Note: {supportNotice}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Master Toggle */}
      <Dialog
        open={isConfirmToggleOpen}
        onOpenChange={setIsConfirmToggleOpen}
      >
        <DialogContent>
          <DialogHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
              <Power className="h-5 w-5" />
            </div>
            <DialogTitle>
              {pendingActiveState
                ? "Activate Maintenance Mode?"
                : "Deactivate Maintenance Mode?"}
            </DialogTitle>
            <DialogDescription>
              {pendingActiveState
                ? "Activating maintenance mode will immediately lock out ALL regular users and SuperAdmins. All API requests will return 503 and users will be redirected to the maintenance page."
                : "Deactivating maintenance mode will restore normal access. Users will be able to log in, navigate the site, and use all API services immediately."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmToggleOpen(false)}
              disabled={isToggling}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmToggle}
              disabled={isToggling}
              className={
                pendingActiveState
                  ? "bg-amber-600 hover:bg-amber-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }
            >
              {isToggling
                ? "Updating..."
                : pendingActiveState
                ? "Yes, Activate Maintenance"
                : "Yes, Restore System Live"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
