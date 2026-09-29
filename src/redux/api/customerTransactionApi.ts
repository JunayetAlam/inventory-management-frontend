import { TCustomerTransaction, TCustomerTransactionStats, TResponse } from "@/types";
import { baseApi } from "./baseApi";

export const customerTransactionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllCustomerTransactions: builder.query<
      TResponse<TCustomerTransaction[]>,
      Record<string, unknown> | undefined
    >({
      query: (params) => ({
        url: "/customer-transactions",
        method: "GET",
        params,
      }),
      providesTags: ["CustomerTransaction", "Invoice", "Customer"],
    }),

    getCustomerTransactionStats: builder.query<
      TResponse<TCustomerTransactionStats>,
      Record<string, unknown> | undefined
    >({
      query: (params) => ({
        url: "/customer-transactions/stats",
        method: "GET",
        params,
      }),
      providesTags: ["CustomerTransaction", "Invoice", "Customer"],
    }),

    syncCustomerTransactions: builder.mutation<TResponse<{ count: number }>, void>({
      query: () => ({
        url: "/customer-transactions/sync",
        method: "POST",
      }),
      invalidatesTags: ["CustomerTransaction"],
    }),
  }),
});

export const {
  useGetAllCustomerTransactionsQuery,
  useGetCustomerTransactionStatsQuery,
  useSyncCustomerTransactionsMutation,
} = customerTransactionApi;
