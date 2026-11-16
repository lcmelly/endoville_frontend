"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import type { OrderItemPayload } from "@/lib/api/orders";

export type ShippingCountryRate = {
  country: string;
  unit_weight: number;
  fee: string;
};

export type ShippingRatesSchedule = {
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
 * Client-side estimate matching GET /api/orders/shipping-rates/:
 * - unit_weight is grams; fee is USD for that many grams
 * - at or below unit weight → pay the unit fee
 * - heavier → (weight_grams ÷ unit_weight) × fee
 * - empty schedule → 0.00; unknown country → "Shipping to this country is not set."
 * Prefer POST /shipping-rates/quote/ when a live quote is available.
 */
export const estimateShippingFromWeight = (
  schedule: ShippingRatesSchedule | undefined,
  country: string,
  weightGrams: number
): ShippingEstimate => {
  const normalizedCountry = country.trim();
  const safeWeight = Number.isFinite(weightGrams) && weightGrams > 0 ? weightGrams : 0;

  if (!schedule) {
    return {
      feeUsd: null,
      weightGrams: safeWeight,
      error: null,
    };
  }

  const countries = schedule.countries ?? [];
  if (countries.length === 0) {
    return {
      feeUsd: 0,
      weightGrams: safeWeight,
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
      error: "Shipping to this country is not set.",
    };
  }

  const unitWeight = Number(match.unit_weight);
  const unitFee = Number(match.fee);
  if (!Number.isFinite(unitWeight) || unitWeight < 1 || !Number.isFinite(unitFee) || unitFee < 0) {
    return {
      feeUsd: null,
      weightGrams: safeWeight,
      error: "Shipping to this country is not set.",
    };
  }

  const feeUsd = safeWeight <= unitWeight ? unitFee : (safeWeight / unitWeight) * unitFee;

  return {
    feeUsd: Number(feeUsd.toFixed(2)),
    weightGrams: safeWeight,
    error: null,
  };
};

export const shippingEstimateFromQuote = (
  quote: ShippingQuoteResponse | undefined,
  quoteErrorMessage?: string | null
): ShippingEstimate | null => {
  if (quoteErrorMessage) {
    return {
      feeUsd: null,
      weightGrams: 0,
      error: quoteErrorMessage,
    };
  }

  if (!quote) {
    return null;
  }

  const feeUsd = Number(quote.shipping_fee);
  const weightGrams = Number(quote.weight_grams);

  if (!Number.isFinite(feeUsd) || feeUsd < 0) {
    return {
      feeUsd: null,
      weightGrams: Number.isFinite(weightGrams) ? weightGrams : 0,
      error: "Unable to estimate shipping.",
    };
  }

  return {
    feeUsd: Number(feeUsd.toFixed(2)),
    weightGrams: Number.isFinite(weightGrams) && weightGrams > 0 ? weightGrams : 0,
    error: null,
  };
};
