import {
  TPreviousPosition,
  TPreviousReturnSummary,
  TResponse,
  TReturnableInvoiceItem,
  TReturnInvoice,
} from "@/types";
import { baseApi } from "./baseApi";

export const returnInvoiceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllReturnInvoices: builder.query<
      TResponse<TReturnInvoice[]>,
      Record<string, unknown> | undefined
    >({
      query: (params) => ({
        url: "/return-invoices",
        method: "GET",
        params,
      }),
      providesTags: ["ReturnInvoice"],
    }),

    getReturnInvoiceById: builder.query<TResponse<TReturnInvoice>, string>({
      query: (id) => ({
        url: `/return-invoices/${id}`,
        method: "GET",
      }),
      providesTags: ["ReturnInvoice"],
    }),

    getReturnableItemsByInvoice: builder.query<
      TResponse<{
        invoice: {
          id: string;
          invoiceNumber: string;
          customer?: {
            id: string;
            name: string;
            countryCode?: string;
            phoneNumber: string;
          } | null;
          totalAmount: number;
          paidAmount: number;
          dueAmount: number;
        };
        items: TReturnableInvoiceItem[];
        previousReturn: TPreviousReturnSummary | null;
        previousDueAmount: number;
        previousPosition: TPreviousPosition;
      }>,
      { invoiceId: string; excludeReturnInvoiceId?: string }
    >({
      query: ({ invoiceId, excludeReturnInvoiceId }) => ({
        url: `/return-invoices/returnable/${invoiceId}`,
        method: "GET",
        params: excludeReturnInvoiceId
          ? { excludeReturnInvoiceId }
          : undefined,
      }),
      providesTags: ["ReturnInvoice", "Invoice"],
    }),

    createReturnInvoice: builder.mutation<
      TResponse<{ returnInvoice: TReturnInvoice }>,
      Record<string, unknown>
    >({
      query: (body) => ({
        url: "/return-invoices",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        "ReturnInvoice",
        "Invoice",
        "Product",
        "ActivityLog",
        "Notification",
      ],
    }),

    updateReturnInvoice: builder.mutation<
      TResponse<{ returnInvoice: TReturnInvoice; warnings?: string[] }>,
      { id: string; body: Record<string, unknown> }
    >({
      query: ({ id, body }) => ({
        url: `/return-invoices/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [
        "ReturnInvoice",
        "Invoice",
        "Product",
        "ActivityLog",
        "Notification",
      ],
    }),

    updateReturnInvoiceStatus: builder.mutation<
      TResponse<TReturnInvoice>,
      { id: string; status: "APPROVED" | "REJECTED" | "PENDING" }
    >({
      query: ({ id, status }) => ({
        url: `/return-invoices/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["ReturnInvoice", "ActivityLog", "Notification"],
    }),

    deleteReturnInvoice: builder.mutation<
      TResponse<TReturnInvoice>,
      { id: string; reason?: string }
    >({
      query: ({ id, reason }) => ({
        url: `/return-invoices/${id}`,
        method: "DELETE",
        body: { reason },
      }),
      invalidatesTags: [
        "ReturnInvoice",
        "Invoice",
        "Product",
        "ActivityLog",
        "Notification",
      ],
    }),

    confirmDeleteReturnInvoice: builder.mutation<
      TResponse<{ returnInvoice: TReturnInvoice; warnings?: string[] }>,
      string
    >({
      query: (id) => ({
        url: `/return-invoices/${id}/confirm-delete`,
        method: "PATCH",
      }),
      invalidatesTags: [
        "ReturnInvoice",
        "Invoice",
        "Product",
        "ActivityLog",
        "Notification",
      ],
    }),

    rejectDeleteReturnInvoice: builder.mutation<TResponse<TReturnInvoice>, string>({
      query: (id) => ({
        url: `/return-invoices/${id}/reject-delete`,
        method: "PATCH",
      }),
      invalidatesTags: ["ReturnInvoice", "ActivityLog", "Notification"],
    }),

    restoreReturnInvoice: builder.mutation<
      TResponse<{ returnInvoice: TReturnInvoice }>,
      string
    >({
      query: (id) => ({
        url: `/return-invoices/${id}/restore`,
        method: "PATCH",
      }),
      invalidatesTags: [
        "ReturnInvoice",
        "Invoice",
        "Product",
        "ActivityLog",
        "Notification",
      ],
    }),
  }),
});

export const {
  useGetAllReturnInvoicesQuery,
  useGetReturnInvoiceByIdQuery,
  useGetReturnableItemsByInvoiceQuery,
  useCreateReturnInvoiceMutation,
  useUpdateReturnInvoiceMutation,
  useUpdateReturnInvoiceStatusMutation,
  useDeleteReturnInvoiceMutation,
  useConfirmDeleteReturnInvoiceMutation,
  useRejectDeleteReturnInvoiceMutation,
  useRestoreReturnInvoiceMutation,
} = returnInvoiceApi;
