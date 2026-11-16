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

export type ShippingEstimate = {
  feeUsd: number | null;
  weightGrams: number;
  baseFeeUsd: number;
  perKgUsd: number | null;
  error: string | null;
};

export const fetchShippingRates = () =>
  apiFetch<ShippingRatesSchedule>("/api/orders/shipping-rates/");

export const quoteShippingRate = (payload: ShippingQuoteRequest) =>
  apiFetch<ShippingQuoteResponse>("/api/orders/shipping-rates/quote/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const useShippingRatesQuery = () =>
  useQuery({
    queryKey: ["shipping-rates"],
    queryFn: fetchShippingRates,
    staleTime: 5 * 60_000,
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

/**
 * Shipping fee (USD) = base_fee + (weight_kg × country per_kg).
 * `unit_weight` on products is grams.
 * If no countries are configured, only the base fee applies.
 */
export const estimateShippingFromWeight = (
  schedule: ShippingRatesSchedule | undefined,
  country: string,
  weightGrams: number
): ShippingEstimate => {
  const normalizedCountry = country.trim();
  const safeWeight = Number.isFinite(weightGrams) && weightGrams > 0 ? weightGrams : 0;
  const baseFeeUsd = Number(schedule?.base_fee ?? NaN);
  const safeBase = Number.isFinite(baseFeeUsd) ? baseFeeUsd : 0;

  if (!schedule) {
    return {
      feeUsd: null,
      weightGrams: safeWeight,
      baseFeeUsd: safeBase,
      perKgUsd: null,
      error: null,
    };
  }

  const countries = schedule.countries ?? [];
  if (countries.length === 0) {
    return {
      feeUsd: Number(safeBase.toFixed(2)),
      weightGrams: safeWeight,
      baseFeeUsd: safeBase,
      perKgUsd: 0,
      error: null,
    };
  }

  const match = countries.find(
    (entry) => entry.country.trim().toLowerCase() === normalizedCountry.toLowerCase()
  );

  if (!match) {
    return {
      feeUsd: null,
      weightGrams: safeWeight,
      baseFeeUsd: safeBase,
      perKgUsd: null,
      error: "Shipping to this country is not set.",
    };
  }

  const perKgUsd = Number(match.per_kg ?? NaN);
  const safePerKg = Number.isFinite(perKgUsd) ? perKgUsd : 0;
  const weightKg = safeWeight / 1000;
  const feeUsd = Number((safeBase + weightKg * safePerKg).toFixed(2));

  return {
    feeUsd,
    weightGrams: safeWeight,
    baseFeeUsd: safeBase,
    perKgUsd: safePerKg,
    error: null,
  };
};
