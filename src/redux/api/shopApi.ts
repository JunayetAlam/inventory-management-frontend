import { TResponse, TShop } from "@/types";
import { baseApi } from "./baseApi";

export const shopApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getShopDetails: builder.query<TResponse<TShop | null>, void>({
      query: () => ({
        url: "/shops",
        method: "GET",
      }),
      providesTags: ["Shop"],
    }),

    upsertShopDetails: builder.mutation<
      TResponse<TShop>,
      {
        name: string;
        proprietor?: string | null;
        logo?: string | null;
        phoneNumbers?: string[];
        emails?: string[];
        locations?: string[];
      }
    >({
      query: (body) => ({
        url: "/shops/upsert",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Shop"],
    }),
  }),
});

export const {
  useGetShopDetailsQuery,
  useUpsertShopDetailsMutation,
} = shopApi;
