import { TInvoice, TResponse } from "@/types";
import { baseApi } from "./baseApi";

export const invoiceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllInvoices: builder.query<
      TResponse<TInvoice[]>,
      Record<string, unknown> | undefined
    >({
      query: (params) => ({
        url: "/invoices",
        method: "GET",
        params,
      }),
      providesTags: ["Invoice"],
    }),

    getInvoiceById: builder.query<TResponse<TInvoice>, string>({
      query: (id) => ({
        url: `/invoices/${id}`,
        method: "GET",
      }),
      providesTags: ["Invoice"],
    }),

    createInvoice: builder.mutation<
      TResponse<TInvoice>,
      Record<string, any>
    >({
      query: (body) => ({
        url: "/invoices",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Invoice", "Product", "Customer", "ActivityLog", "Notification"],
    }),

    updateInvoice: builder.mutation<
      TResponse<TInvoice>,
      { id: string; body: Record<string, any> }
    >({
      query: ({ id, body }) => ({
        url: `/invoices/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Invoice", "Product", "Customer", "ActivityLog", "Notification"],
    }),

    updateInvoiceStatus: builder.mutation<
      TResponse<TInvoice>,
      { id: string; status: "APPROVED" | "REJECTED" | "PENDING" }
    >({
      query: ({ id, status }) => ({
        url: `/invoices/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Invoice", "ActivityLog", "Notification"],
    }),

    deleteInvoice: builder.mutation<
      TResponse<TInvoice>,
      { id: string; reason?: string }
    >({
      query: ({ id, reason }) => ({
        url: `/invoices/${id}`,
        method: "DELETE",
        body: { reason },
      }),
      invalidatesTags: ["Invoice", "Product", "ActivityLog", "Notification"],
    }),

    confirmDeleteInvoice: builder.mutation<TResponse<TInvoice>, string>({
      query: (id) => ({
        url: `/invoices/${id}/confirm-delete`,
        method: "PATCH",
      }),
      invalidatesTags: ["Invoice", "Product", "ActivityLog", "Notification"],
    }),

    rejectDeleteInvoice: builder.mutation<TResponse<TInvoice>, string>({
      query: (id) => ({
        url: `/invoices/${id}/reject-delete`,
        method: "PATCH",
      }),
      invalidatesTags: ["Invoice", "ActivityLog", "Notification"],
    }),

    restoreInvoice: builder.mutation<TResponse<TInvoice>, string>({
      query: (id) => ({
        url: `/invoices/${id}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: ["Invoice", "Product", "ActivityLog", "Notification"],
    }),

    addPayment: builder.mutation<
      TResponse<{ payment: any; invoice: TInvoice }>,
      { id: string; amount: number; note?: string | null; date?: string | null }
    >({
      query: ({ id, amount, note, date }) => ({
        url: `/invoices/${id}/payments`,
        method: "POST",
        body: { amount, note, date },
      }),
      invalidatesTags: ["Invoice", "ActivityLog", "Notification"],
    }),

    updatePayment: builder.mutation<
      TResponse<{ payment: any; invoice: TInvoice }>,
      { invoiceId: string; paymentId: string; amount?: number; note?: string | null; date?: string | null }
    >({
      query: ({ invoiceId, paymentId, amount, note, date }) => ({
        url: `/invoices/${invoiceId}/payments/${paymentId}`,
        method: "PATCH",
        body: { amount, note, date },
      }),
      invalidatesTags: ["Invoice", "ActivityLog", "Notification"],
    }),

    approvePayment: builder.mutation<
      TResponse<{ payment: any; invoice: TInvoice }>,
      { invoiceId: string; paymentId: string }
    >({
      query: ({ invoiceId, paymentId }) => ({
        url: `/invoices/${invoiceId}/payments/${paymentId}/approve`,
        method: "PATCH",
      }),
      invalidatesTags: ["Invoice", "ActivityLog", "Notification"],
    }),

    deletePayment: builder.mutation<
      TResponse<{ deletedPaymentId: string; invoice: TInvoice }>,
      { invoiceId: string; paymentId: string }
    >({
      query: ({ invoiceId, paymentId }) => ({
        url: `/invoices/${invoiceId}/payments/${paymentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Invoice", "ActivityLog", "Notification"],
    }),
  }),
});

export const {
  useGetAllInvoicesQuery,
  useGetInvoiceByIdQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useUpdateInvoiceStatusMutation,
  useDeleteInvoiceMutation,
  useConfirmDeleteInvoiceMutation,
  useRejectDeleteInvoiceMutation,
  useRestoreInvoiceMutation,
  useAddPaymentMutation,
  useUpdatePaymentMutation,
  useApprovePaymentMutation,
  useDeletePaymentMutation,
} = invoiceApi;
