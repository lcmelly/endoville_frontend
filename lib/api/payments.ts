"use client";

import { useCallback } from "react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/state/auth-context";

export type CreatePaymentPayload = {
  order: number;
  provider: "intasend" | "stripe" | "cash" | "other";
  method: "link" | "stk" | "checkout" | "manual";
  phone_number?: string;
  email?: string;
  success_url?: string;
  cancel_url?: string;
};

export type Payment = {
  id: number;
  order: number;
  provider: string;
  status: string;
  amount: string;
  currency: string;
  checkout_url: string | null;
  created_at: string;
  updated_at: string;
};

export const createPayment = (accessToken: string, payload: CreatePaymentPayload) =>
  apiFetch<Payment>("/api/orders/payments/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

export const usePaymentsApi = () => {
  const { auth } = useAuth();
  const accessToken = auth?.access;

  const requireAccessToken = () => {
    if (!accessToken) {
      throw new Error("Missing access token.");
    }
    return accessToken;
  };

  const createOrderPayment = useCallback(
    async (payload: CreatePaymentPayload) => createPayment(requireAccessToken(), payload),
    [accessToken]
  );

  return { createOrderPayment };
};
