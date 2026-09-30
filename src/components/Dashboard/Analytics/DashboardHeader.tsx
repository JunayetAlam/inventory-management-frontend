"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar04Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { TDashboardPreset } from "@/types/dashboard";

const PRESETS: { value: Exclude<TDashboardPreset, "custom">; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "all", label: "All" },
];

export default function DashboardHeader({
  preset,
  startDate,
  endDate,
  rangeFrom,
  rangeTo,
  onPreset,
  onCustomRange,
  onClearRange,
}: {
  preset: TDashboardPreset;
  /** Currently applied custom dates (from URL) */
  startDate: string;
  endDate: string;
  /** Resolved range returned by the server, shown in the subtext */
  rangeFrom?: string;
  rangeTo?: string;
  onPreset: (preset: Exclude<TDashboardPreset, "custom">) => void;
  onCustomRange: (startDate: string, endDate: string) => void;
  /** Resets the custom range back to the default preset */
  onClearRange: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(startDate);
  const [to, setTo] = useState(endDate);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      // start from the currently applied range each time it opens
      setFrom(startDate);
      setTo(endDate);
      setError(null);
    }
    setOpen(next);
  };

  const apply = () => {
    if (!from || !to) return setError("Select both dates");
    if (from > to) return setError("From date cannot be after To date");
    setError(null);
    onCustomRange(from, to);
    setOpen(false);
  };

  const clear = () => {
    setFrom("");
    setTo("");
    setError(null);
    onClearRange();
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {rangeFrom && rangeTo
            ? `Showing data from ${rangeFrom} to ${rangeTo}`
            : "Loading date range…"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((p) => (
          <Button
            key={p.value}
            size="sm"
            variant={preset === p.value ? "default" : "outline"}
            onClick={() => onPreset(p.value)}
          >
            {p.label}
          </Button>
        ))}

        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger asChild>
            <Button size="sm" variant={preset === "custom" ? "default" : "outline"}>
              <HugeiconsIcon icon={Calendar04Icon} strokeWidth={2} className="size-4" />
              Select Date Range
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72">
            <div className="space-y-1">
              <p className="font-medium">Select Date Range</p>
              <p className="text-xs text-muted-foreground">
                Choose the dates to filter the dashboard.
              </p>
            </div>
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              From Date
              <Input
                type="date"
                value={from}
                max={to || undefined}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="space-y-1 text-xs font-medium text-muted-foreground">
              To Date
              <Input
                type="date"
                value={to}
                min={from || undefined}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={clear}
                disabled={preset !== "custom" && !from && !to}
              >
                Clear Range
              </Button>
              <Button size="sm" onClick={apply}>
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
