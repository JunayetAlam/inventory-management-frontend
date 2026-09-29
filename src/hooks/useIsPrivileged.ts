"use client";

import { useEffect, useState } from "react";

export const getPrivilegedToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("khul_ja_sim_sim")?.trim() ||
    localStorage.getItem("SECRET_ADMIN_TOKEN")?.trim() ||
    null
  );
};

export const setPrivilegedToken = (token: string): void => {
  if (typeof window === "undefined") return;
  const clean = token.trim();
  localStorage.setItem("khul_ja_sim_sim", clean);
  localStorage.setItem("SECRET_ADMIN_TOKEN", clean);
};

export const clearPrivilegedToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("khul_ja_sim_sim");
  localStorage.removeItem("SECRET_ADMIN_TOKEN");
};

export default function useIsPrivileged() {
  const [isPrivileged, setIsPrivileged] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    const token = getPrivilegedToken();
    setIsPrivileged(Boolean(token));
    setIsChecking(false);

    const handleStorageChange = () => {
      const updated = getPrivilegedToken();
      setIsPrivileged(Boolean(updated));
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return { isPrivileged, isChecking, setPrivilegedToken, clearPrivilegedToken };
}
