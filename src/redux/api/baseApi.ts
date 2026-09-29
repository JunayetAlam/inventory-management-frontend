/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BaseQueryApi,
  BaseQueryFn,
  createApi,
  DefinitionType,
  FetchArgs,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";

import { TResponse, User } from "@/types";
import { toast } from "sonner";
import { logout } from "../authSlice";
import { AppConfig } from "@/config";

const PUBLIC_AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/login-with-firebase",
  "/auth/verify-email",
  "/auth/resend-verification-otp",
  "/auth/resend-verification-email",
  "/auth/forget-password",
  "/auth/verify-forgot-password-otp",
  "/auth/reset-password",
  "/auth/logout",
];

const AUTH_FAILURE_MESSAGES = new Set([
  "You are not authorized!",
  "Expired token",
  "You are not verified!",
  "You are Blocked!",
  "Your account is pending admin approval.",
  "Your account is inactive.",
]);

const getRequestUrl = (args: string | FetchArgs) =>
  typeof args === "string" ? args : (args.url ?? "");

const isPublicAuthRequest = (url: string) =>
  PUBLIC_AUTH_PATHS.some((path) => url === path || url.startsWith(`${path}?`));

const isAuthFailure = (result: { error?: any }) => {
  const status = result.error?.status;
  const message = result.error?.data?.message as string | undefined;

  if (status === 401) return true;
  if (message && AUTH_FAILURE_MESSAGES.has(message)) return true;
  if (message?.includes("Account has been deleted")) return true;
  return false;
};

const baseQuery = fetchBaseQuery({
  baseUrl: `${AppConfig.backendUrl}/api/v1`,
  credentials: "include",
  prepareHeaders: (headers) => {
    if (typeof window !== "undefined") {
      const khul_ja_sim_sim =
        localStorage.getItem("khul_ja_sim_sim") ||
        localStorage.getItem("SECRET_ADMIN_TOKEN");
      if (khul_ja_sim_sim && khul_ja_sim_sim.trim()) {
        headers.set("x-privileged-token", khul_ja_sim_sim.trim());
      }
    }
    return headers;
  },
});

const clearPrivilegedToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("khul_ja_sim_sim");
  localStorage.removeItem("SECRET_ADMIN_TOKEN");
};

const getPrivilegedToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("khul_ja_sim_sim")?.trim() ||
    localStorage.getItem("SECRET_ADMIN_TOKEN")?.trim() ||
    null
  );
};

const baseQueryWithSession: BaseQueryFn<
  FetchArgs,
  BaseQueryApi,
  DefinitionType
> = async (args, api, extraOptions): Promise<any> => {
  const result = (await baseQuery(args, api, extraOptions)) as TResponse<User>;
  const url = getRequestUrl(args as string | FetchArgs);

  if (!isPublicAuthRequest(url) && isAuthFailure(result)) {
    const activePrivilegedToken = getPrivilegedToken();

    if (activePrivilegedToken) {
      // Bad / expired privileged token — clear it immediately so no further
      // requests keep sending it, which would otherwise cause an infinite loop.
      clearPrivilegedToken();
      const message =
        (result.error as { data?: { message?: string } } | undefined)?.data
          ?.message || "Invalid privileged token. It has been cleared.";
      toast.error(message);
      // Do NOT reset API state here — that would trigger all queries to
      // re-run (without the token now, causing another wave of failures).
      return result;
    }

    // Normal session failure — log out and redirect.
    const message =
      (result.error as { data?: { message?: string } } | undefined)?.data
        ?.message || "Session expired";
    toast.error(message);
    api.dispatch(logout());
    api.dispatch(baseApi.util.resetApiState());
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/auth/")
    ) {
      window.location.href = "/auth/sign-in";
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  baseQuery: baseQueryWithSession,
  tagTypes: [
    "User",
    "Device",
    "Notification",
    "ActivityLog",
    "Product",
    "Customer",
    "Invoice",
    "ReturnInvoice",
    "Shop",
    "Stats",
    "CustomerTransaction",
  ],
  endpoints: () => ({}),
});
