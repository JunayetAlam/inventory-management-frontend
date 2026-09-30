"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Wrench01Icon, Clock01Icon, Mail01Icon, Call02Icon, Alert02Icon, RefreshIcon, Key01Icon, SecurityCheckIcon, Tick02Icon, Copy01Icon, SquareLock02Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { useGetPublicMaintenanceStatusQuery } from "@/redux/api/maintenanceApi";
import { setPrivilegedToken } from "@/hooks/useIsPrivileged";
import { AppConfig } from "@/config";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PublicMaintenanceView() {
  const router = useRouter();
  const {
    data: response,
    isLoading,
    isFetching,
    refetch,
  } = useGetPublicMaintenanceStatusQuery();

  const maintenance = response?.data;

  // Secret token modal state
  const [isSecretModalOpen, setIsSecretModalOpen] = useState(false);
  const [secretTokenInput, setSecretTokenInput] = useState("");
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
  } | null>(null);

  // Listen for Ctrl+Shift+M or Ctrl+Shift+P shortcut to unlock secret modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.shiftKey &&
        (e.key.toLowerCase() === "m" || e.key.toLowerCase() === "p")
      ) {
        e.preventDefault();
        setIsSecretModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Update countdown timer
  useEffect(() => {
    if (!maintenance?.estimatedEndTime) {
      setTimeLeft(null);
      return;
    }

    const targetDate = new Date(maintenance.estimatedEndTime).getTime();

    const calculateRemaining = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isPast: true,
        });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isPast: false });
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);

    return () => clearInterval(interval);
  }, [maintenance?.estimatedEndTime]);

  // Copy to clipboard helper
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Secret Token validation and privilege login
  const handleUnlockOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = secretTokenInput.trim();
    if (!cleanToken) {
      toast.error("Please enter the privileged token.");
      return;
    }

    setIsValidatingToken(true);
    try {
      const res = await fetch(
        `${AppConfig.backendUrl}/api/v1/maintenance/manage`,
        {
          headers: {
            "x-privileged-token": cleanToken,
          },
        },
      );

      const json = await res.json();

      if (res.ok && json.success) {
        setPrivilegedToken(cleanToken);
        toast.success("Privileged access granted! Welcome back.");
        setIsSecretModalOpen(false);
        router.push("/privileged/maintenance");
      } else {
        toast.error(json.message || "Invalid privileged operator token.");
      }
    } catch {
      toast.error("Failed to connect to backend server.");
    } finally {
      setIsValidatingToken(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-background via-muted/30 to-background p-4 text-foreground selection:bg-amber-500/20 selection:text-amber-600 sm:p-6 md:p-10">
      {/* Background radial ambient glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent blur-3xl dark:from-amber-600/15" />

      {/* Main Container Card */}
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border/70 bg-card/80 p-6 shadow-2xl backdrop-blur-xl sm:p-10">
        {/* Animated Badge & Icon */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 shadow-inner ring-1 ring-amber-500/30">
            <HugeiconsIcon icon={Wrench01Icon} strokeWidth={2} className="h-10 w-10 text-amber-600 dark:text-amber-400 animate-pulse" />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-amber-500" />
            </span>
          </div>

          {/* Status Chip */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Scheduled Maintenance Mode
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            {maintenance?.title || "System Under Maintenance"}
          </h1>

          {/* Message */}
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {maintenance?.message ||
              "We are currently performing scheduled maintenance to improve our service. We apologize for any inconvenience."}
          </p>

          {/* Reason Badge if available */}
          {maintenance?.reason && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
              <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="h-3.5 w-3.5 text-amber-500" />
              <span>Scope: {maintenance.reason}</span>
            </div>
          )}
        </div>

        {/* Live Countdown Timer Section */}
        {timeLeft && (
          <div className="mt-8 rounded-xl border border-border/60 bg-muted/40 p-5 text-center">
            <div className="mb-3 flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <HugeiconsIcon icon={Clock01Icon} strokeWidth={2} className="h-3.5 w-3.5 text-primary" />
              <span>
                {timeLeft.isPast
                  ? "Wrapping up maintenance..."
                  : "Estimated Completion Time"}
              </span>
            </div>

            {!timeLeft.isPast ? (
              <div className="grid grid-cols-4 gap-2 sm:gap-4">
                {[
                  { label: "Days", val: timeLeft.days },
                  { label: "Hours", val: timeLeft.hours },
                  { label: "Minutes", val: timeLeft.minutes },
                  { label: "Seconds", val: timeLeft.seconds },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-center rounded-lg border border-border/80 bg-background/80 py-3 shadow-sm"
                  >
                    <span className="font-mono text-2xl font-bold text-foreground sm:text-3xl">
                      {String(item.val).padStart(2, "0")}
                    </span>
                    <span className="text-[10px] font-medium uppercase text-muted-foreground sm:text-xs">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Services are finalizing. The application will be back online any moment.
              </p>
            )}
          </div>
        )}

        {/* Support & Contact Details */}
        {(maintenance?.contactEmail || maintenance?.contactPhone) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {maintenance.contactEmail && (
              <div className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-border/90">
                <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} className="h-3.5 w-3.5 text-primary" />
                <a
                  href={`mailto:${maintenance.contactEmail}`}
                  className="font-medium hover:underline"
                >
                  {maintenance.contactEmail}
                </a>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(maintenance.contactEmail!, "email")
                  }
                  className="ml-1 text-muted-foreground hover:text-foreground"
                  title="Copy email"
                >
                  {copiedField === "email" ? (
                    <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="h-3 w-3" />
                  )}
                </button>
              </div>
            )}

            {maintenance.contactPhone && (
              <div className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-border/90">
                <HugeiconsIcon icon={Call02Icon} strokeWidth={2} className="h-3.5 w-3.5 text-primary" />
                <a
                  href={`tel:${maintenance.contactPhone}`}
                  className="font-medium hover:underline"
                >
                  {maintenance.contactPhone}
                </a>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(maintenance.contactPhone!, "phone")
                  }
                  className="ml-1 text-muted-foreground hover:text-foreground"
                  title="Copy phone"
                >
                  {copiedField === "phone" ? (
                    <HugeiconsIcon icon={Tick02Icon} strokeWidth={2} className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="h-3 w-3" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Support Notice */}
        {maintenance?.supportNotice && (
          <p className="mt-4 text-center text-xs text-muted-foreground/80 italic">
            Note: {maintenance.supportNotice}
          </p>
        )}

        {/* Actions & Refresh Button */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            variant="outline"
            size="default"
            onClick={() => {
              refetch();
              toast.info("Checking system status...");
            }}
            disabled={isFetching || isLoading}
            className="w-full gap-2 sm:w-auto"
          >
            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2}
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            <span>Refresh Status</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSecretModalOpen(true)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            <HugeiconsIcon icon={SquareLock02Icon} strokeWidth={2} className="mr-1 h-3 w-3" />
            Operator Access
          </Button>
        </div>
      </div>

      {/* Subtle footer */}
      <footer className="mt-8 text-center text-xs text-muted-foreground">
        <p>Inventory Management System &bull; All Rights Reserved</p>
        <p className="mt-1 text-[11px] text-muted-foreground/60">
          Press <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">Ctrl+Shift+M</kbd> for operator login
        </p>
      </footer>

      {/* Secret Operator Access Modal */}
      <Dialog open={isSecretModalOpen} onOpenChange={setIsSecretModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleUnlockOperator}>
            <DialogHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <HugeiconsIcon icon={Key01Icon} strokeWidth={2} className="h-5 w-5" />
              </div>
              <DialogTitle>Privileged Operator Access</DialogTitle>
              <DialogDescription>
                Enter the secret administrator token to unlock and bypass maintenance mode.
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 space-y-3">
              <Label htmlFor="secretToken">Operator Token</Label>
              <Input
                id="secretToken"
                type="password"
                placeholder="Enter secret admin token..."
                value={secretTokenInput}
                onChange={(e) => setSecretTokenInput(e.target.value)}
                autoFocus
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Matches the <code className="rounded bg-muted px-1 font-mono">SECRET_ADMIN_TOKEN</code> configured on the server.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSecretModalOpen(false)}
                disabled={isValidatingToken}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isValidatingToken || !secretTokenInput.trim()}
                className="gap-2"
              >
                <HugeiconsIcon icon={SecurityCheckIcon} strokeWidth={2} className="h-4 w-4" />
                {isValidatingToken ? "Verifying..." : "Unlock Access"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
