"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { OrderItemPayload } from "@/lib/api/orders";

export type ShippingCountryRate = {
  country: string;
  per_kg: string;
};

export type ShippingRatesSchedule = {
  base_fee: string;
  countries: ShippingCountryRate[];
};

export type ShippingQuoteRequest = {
  country: string;
  items: OrderItemPayload[];
};

export type ShippingQuoteResponse = {
  country: string;
  weight_grams: number;
  shipping_fee: string;
};

export const fetchShippingRates = () =>
  apiFetch<ShippingRatesSchedule>("/api/orders/shipping-rates/");

export const quoteShippingRate = (payload: ShippingQuoteRequest) =>
  apiFetch<ShippingQuoteResponse>("/api/orders/shipping-rates/quote/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const useShippingQuoteQuery = (
  country: string | null | undefined,
  items: OrderItemPayload[]
) => {
  const normalizedCountry = (country ?? "").trim();
  const hasItems = items.length > 0;

  return useQuery({
    queryKey: ["shipping-quote", normalizedCountry, items],
    queryFn: () =>
      quoteShippingRate({
        country: normalizedCountry,
        items,
      }),
    enabled: Boolean(normalizedCountry) && hasItems,
    staleTime: 60_000,
    retry: false,
  });
};
