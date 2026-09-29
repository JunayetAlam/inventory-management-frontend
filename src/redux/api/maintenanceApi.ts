import { baseApi } from "./baseApi";

export interface IMaintenancePublicStatus {
  isActive: boolean;
  title: string;
  message: string;
  reason: string | null;
  estimatedEndTime: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  supportNotice: string | null;
  lastToggledAt: string | null;
}

export interface IMaintenanceDetails extends IMaintenancePublicStatus {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface IUpdateMaintenancePayload {
  title?: string;
  message?: string;
  reason?: string | null;
  estimatedEndTime?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  supportNotice?: string | null;
}

export interface IToggleMaintenancePayload {
  isActive: boolean;
}

export interface TResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export const maintenanceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPublicMaintenanceStatus: builder.query<
      TResponse<IMaintenancePublicStatus>,
      void
    >({
      query: () => ({
        url: "/maintenance/public-status",
        method: "GET",
      }),
      providesTags: ["Maintenance"],
    }),

    getPrivilegedMaintenance: builder.query<
      TResponse<IMaintenanceDetails>,
      void
    >({
      query: () => ({
        url: "/maintenance/manage",
        method: "GET",
      }),
      providesTags: ["Maintenance"],
    }),

    toggleMaintenance: builder.mutation<
      TResponse<IMaintenanceDetails>,
      IToggleMaintenancePayload
    >({
      query: (body) => ({
        url: "/maintenance/toggle",
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Maintenance"],
    }),

    updateMaintenance: builder.mutation<
      TResponse<IMaintenanceDetails>,
      IUpdateMaintenancePayload
    >({
      query: (body) => ({
        url: "/maintenance/update",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Maintenance"],
    }),
  }),
});

export const {
  useGetPublicMaintenanceStatusQuery,
  useGetPrivilegedMaintenanceQuery,
  useToggleMaintenanceMutation,
  useUpdateMaintenanceMutation,
} = maintenanceApi;
