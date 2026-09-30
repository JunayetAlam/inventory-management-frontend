"use client";

import { useEffect, useState, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { SunriseIcon, Sun03Icon, SunsetIcon, Moon02Icon } from "@hugeicons/core-free-icons";
import { useGetMeQuery } from "@/redux/api/userApi";

interface WelcomePeriod {
  period: "morning" | "afternoon" | "evening" | "night";
  label: string;
  prefix: string;
  body: string;
  highlightText: string;
  highlightColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconColor: string;
}

function getPeriodConfig(hour: number): WelcomePeriod {
  // 5:00 AM - 11:59 AM
  if (hour >= 5 && hour < 12) {
    return {
      period: "morning",
      label: "Morning",
      prefix: "Good morning",
      body: "Wishing you a",
      highlightText: "productive day",
      highlightColor: "text-amber-600 dark:text-amber-400",
      badgeBg: "bg-amber-500/12 dark:bg-amber-500/18",
      badgeText: "text-amber-800 dark:text-amber-300",
      badgeBorder: "border-amber-500/30 dark:border-amber-400/25",
      iconColor: "text-amber-500 dark:text-amber-400",
    };
  }
  // 12:00 PM - 4:59 PM
  if (hour >= 12 && hour < 17) {
    return {
      period: "afternoon",
      label: "Afternoon",
      prefix: "Good afternoon",
      body: "Hope your day is",
      highlightText: "running smoothly",
      highlightColor: "text-sky-600 dark:text-sky-400",
      badgeBg: "bg-sky-500/12 dark:bg-sky-500/18",
      badgeText: "text-sky-800 dark:text-sky-300",
      badgeBorder: "border-sky-500/30 dark:border-sky-400/25",
      iconColor: "text-sky-500 dark:text-sky-400",
    };
  }
  // 5:00 PM - 9:59 PM
  if (hour >= 17 && hour < 22) {
    return {
      period: "evening",
      label: "Evening",
      prefix: "Good evening",
      body: "Let's wrap up today's work",
      highlightText: "effortlessly",
      highlightColor: "text-orange-600 dark:text-orange-400",
      badgeBg: "bg-orange-500/12 dark:bg-orange-500/18",
      badgeText: "text-orange-800 dark:text-orange-300",
      badgeBorder: "border-orange-500/30 dark:border-orange-400/25",
      iconColor: "text-orange-500 dark:text-orange-400",
    };
  }
  // 10:00 PM - 4:59 AM
  return {
    period: "night",
    label: "Night",
    prefix: "Peaceful night",
    body: "Thank you for your",
    highlightText: "great dedication",
    highlightColor: "text-indigo-500 dark:text-indigo-400",
    badgeBg: "bg-indigo-500/12 dark:bg-indigo-500/18",
    badgeText: "text-indigo-800 dark:text-indigo-300",
    badgeBorder: "border-indigo-500/30 dark:border-indigo-400/25",
    iconColor: "text-indigo-500 dark:text-indigo-400",
  };
}

const WORD_COLORS = [
  "text-emerald-600 dark:text-emerald-400",
  "text-blue-600 dark:text-sky-400",
  "text-violet-600 dark:text-violet-400",
  "text-amber-600 dark:text-amber-400",
  "text-rose-600 dark:text-rose-400",
  "text-cyan-600 dark:text-cyan-300",
  "text-indigo-600 dark:text-indigo-400",
  "text-pink-600 dark:text-pink-400",
  "text-orange-600 dark:text-orange-400",
  "text-teal-600 dark:text-teal-400",
  "text-purple-600 dark:text-purple-400",
  "text-lime-600 dark:text-lime-400",
];

export default function NavbarWelcomeMarquee() {
  const { data } = useGetMeQuery(undefined);
  const profile = data?.data;

  const [mounted, setMounted] = useState(false);
  const [currentHour, setCurrentHour] = useState<number>(() =>
    new Date().getHours(),
  );

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setCurrentHour(new Date().getHours());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    profile?.firstName ||
    profile?.email?.split("@")[0] ||
    "Partner";

  const periodConfig = useMemo(
    () => getPeriodConfig(currentHour),
    [currentHour],
  );

  const words = useMemo(() => {
    const fullText = `${periodConfig.prefix}, ${displayName}! ${periodConfig.body} ${periodConfig.highlightText}.`;
    return fullText.split(/\s+/).filter(Boolean);
  }, [periodConfig, displayName]);

  const PeriodIcon =
    periodConfig.period === "morning"
      ? SunriseIcon
      : periodConfig.period === "afternoon"
        ? Sun03Icon
        : periodConfig.period === "evening"
          ? SunsetIcon
          : Moon02Icon;

  if (!mounted) {
    return (
      <div className="flex-1 max-w-lg mx-2 sm:mx-4 h-8 rounded-full bg-muted/20 animate-pulse hidden sm:block" />
    );
  }

  // Greeting item with each word in bold and a unique color
  const greetingItem = (
    <div className="inline-flex items-center gap-2.5">
      {/* 1. Time Badge */}
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border shadow-2xs ${periodConfig.badgeBg} ${periodConfig.badgeText} ${periodConfig.badgeBorder}`}
      >
        <HugeiconsIcon icon={PeriodIcon} strokeWidth={2} className={`size-3.5 shrink-0 ${periodConfig.iconColor}`} />
        {periodConfig.label}
      </span>

      {/* 2. Bold personalized text with each word having a distinct color */}
      <span className="text-xs sm:text-[13px] inline-flex items-center gap-1.5 font-bold">
        {words.map((word, idx) => (
          <span
            key={idx}
            className={`font-bold tracking-tight ${WORD_COLORS[idx % WORD_COLORS.length]}`}
          >
            {word}
          </span>
        ))}
      </span>
    </div>
  );

  return (
    <div
      className="relative flex items-center min-w-0 flex-1 max-w-xl lg:max-w-2xl xl:max-w-4xl mx-1 sm:mx-4 rounded-full border border-border/70 bg-background/80 dark:bg-card/60 backdrop-blur-md shadow-2xs overflow-hidden transition-all duration-300 hover:border-teal-500/30 hover:shadow-xs group"
      title={`${periodConfig.prefix}, ${displayName}!`}
    >
      {/* Anchored Live Indicator */}
      <div className="shrink-0 flex items-center gap-1.5 pl-3 pr-2.5 py-1 z-20 border-r border-border/60 bg-muted/40 dark:bg-muted/20 select-none">
        <span className="relative flex size-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hidden sm:inline-block">
          Live
        </span>
      </div>

      {/* Marquee Track Container */}
      <div className="relative flex-1 min-w-0 overflow-hidden py-1.5">
        {/* Left & Right gradient fade masks */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 sm:w-10 bg-linear-to-r from-background via-background/80 to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-14 bg-linear-to-l from-background via-background/80 to-transparent z-10" />

        {/* Marquee Track (Double copy for seamless loop) */}
        <div className="animate-navbar-marquee flex items-center whitespace-nowrap cursor-default select-none">
          {/* First instance */}
          <div className="flex items-center gap-6 px-8 shrink-0">
            {greetingItem}
            <span className="text-muted-foreground/35 select-none text-xs">
              ✦
            </span>
          </div>

          {/* Second instance for infinite seamless wrap */}
          <div
            className="flex items-center gap-6 px-8 shrink-0"
            aria-hidden="true"
          >
            {greetingItem}
            <span className="text-muted-foreground/35 select-none text-xs">
              ✦
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
