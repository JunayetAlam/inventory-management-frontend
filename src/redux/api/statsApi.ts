import { TCustomerStats, TResponse } from "@/types";
import type {
  TDashboardPreset,
  TDashboardSummary,
  TLowStockData,
  TProfitBreakdown,
  TSalesPerformancePoint,
} from "@/types/dashboard";
import { baseApi } from "./baseApi";

const dashboardTags = ["Stats", "Invoice", "ReturnInvoice", "Product"] as const;

export const statsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomerStats: builder.query<TResponse<TCustomerStats>, void>({
      query: () => ({
        url: "/stats/customers",
        method: "GET",
      }),
      providesTags: ["Stats", "Customer", "Invoice", "ReturnInvoice"],
    }),
    getDashboardSummary: builder.query<
      TResponse<TDashboardSummary>,
      { preset: TDashboardPreset; startDate?: string; endDate?: string }
    >({
      query: (params) => ({ url: "/stats/dashboard", method: "GET", params }),
      providesTags: [...dashboardTags],
    }),
    getSalesPerformance: builder.query<
      TResponse<TSalesPerformancePoint[]>,
      { startMonth?: string; endMonth?: string } | void
    >({
      query: (params) => ({
        url: "/stats/sales-performance",
        method: "GET",
        params: params || undefined,
      }),
      providesTags: [...dashboardTags],
    }),
    getProfitBreakdown: builder.query<
      TResponse<TProfitBreakdown>,
      { startMonth?: string; endMonth?: string } | void
    >({
      query: (params) => ({
        url: "/stats/profit-breakdown",
        method: "GET",
        params: params || undefined,
      }),
      providesTags: [...dashboardTags],
    }),
    getLowStock: builder.query<
      TResponse<TLowStockData>,
      { page: number; limit: number }
    >({
      query: (params) => ({ url: "/stats/low-stock", method: "GET", params }),
      providesTags: [...dashboardTags],
    }),
  }),
});

export const {
  useGetCustomerStatsQuery,
  useGetDashboardSummaryQuery,
  useGetSalesPerformanceQuery,
  useGetProfitBreakdownQuery,
  useGetLowStockQuery,
} = statsApi;
