"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { MoreVerticalIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatMonthLabel(monthKey: string): string {
  const [y, m] = monthKey.split("-");
  const idx = Number(m) - 1;
  return `${MONTH_NAMES[idx] || m} ${y}`;
}

export function formatRangeSubtext(
  startMonth?: string,
  endMonth?: string,
): string {
  if (!startMonth || !endMonth) return "Last 12 Months";
  if (startMonth === endMonth) return formatMonthLabel(startMonth);
  return `${formatMonthLabel(startMonth)} – ${formatMonthLabel(endMonth)}`;
}

export interface ChartMonthRangeFilterProps {
  startMonth?: string;
  endMonth?: string;
  onApply: (startMonth: string, endMonth: string) => void;
  onReset: () => void;
}

export default function ChartMonthRangeFilter({
  startMonth,
  endMonth,
  onApply,
  onReset,
}: ChartMonthRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(startMonth || "");
  const [to, setTo] = useState(endMonth || "");
  const [error, setError] = useState<string | null>(null);

  const isFiltered = Boolean(startMonth && endMonth);

  const handleOpenChange = (next: boolean) => {
    if (next) {
      setFrom(startMonth || "");
      setTo(endMonth || "");
      setError(null);
    }
    setOpen(next);
  };

  const handleApply = () => {
    if (!from || !to) {
      setError("Please select both start and end months");
      return;
    }
    if (from > to) {
      setError("From month cannot be after To month");
      return;
    }
    setError(null);
    onApply(from, to);
    setOpen(false);
  };

  const handleReset = () => {
    setFrom("");
    setTo("");
    setError(null);
    onReset();
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "relative size-8 rounded-lg text-muted-foreground hover:text-foreground",
            isFiltered && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
          )}
          aria-label="Filter month range"
        >
          <HugeiconsIcon icon={MoreVerticalIcon} strokeWidth={2} className="size-4" />
          {isFiltered && (
            <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">Select Month Range</p>
          <p className="text-xs text-muted-foreground">
            Filter chart data by start and end month.
          </p>
        </div>

        <div className="space-y-2.5">
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            From (Year & Month)
            <Input
              type="month"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1"
            />
          </label>

          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            To (Year & Month)
            <Input
              type="month"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1"
            />
          </label>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            disabled={!isFiltered && !from && !to}
          >
            Reset
          </Button>
          <Button size="sm" onClick={handleApply}>
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
