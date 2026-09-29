"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useGetPublicMaintenanceStatusQuery } from "@/redux/api/maintenanceApi";
import useIsPrivileged from "@/hooks/useIsPrivileged";

export default function MaintenanceGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isPrivileged, isChecking } = useIsPrivileged();

  // Poll maintenance status every 30 seconds
  const { data: maintenanceResponse, isLoading: isQueryLoading } =
    useGetPublicMaintenanceStatusQuery(undefined, {
      pollingInterval: 30000,
    });

  const isActive = maintenanceResponse?.data?.isActive ?? false;

  useEffect(() => {
    if (isChecking) return;

    // 1. Privileged users have full unrestricted access everywhere
    if (isPrivileged) {
      return;
    }

    // 2. Protect privileged-only pages against non-privileged visitors
    if (pathname.startsWith("/privileged/")) {
      router.replace(isActive ? "/maintenance" : "/dashboard");
      return;
    }

    // 3. Maintenance is ON: lock all non-privileged users to /maintenance
    if (isActive) {
      if (pathname !== "/maintenance") {
        router.replace("/maintenance");
      }
      return;
    }

    // 4. Maintenance is OFF: prevent non-privileged users from staying on /maintenance
    if (!isActive && pathname === "/maintenance") {
      router.replace("/dashboard");
    }
  }, [isActive, isPrivileged, isChecking, pathname, router]);

  // If maintenance is ON and the user is NOT privileged, do NOT render protected page content
  // until the router redirects to /maintenance (avoids content flashing)
  if (!isChecking && !isPrivileged && isActive && pathname !== "/maintenance") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
