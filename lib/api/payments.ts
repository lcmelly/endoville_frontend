"use client";

import { useCallback } from "react";
import { appFetch } from "@/lib/api/client";
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

export const createPayment = (payload: CreatePaymentPayload) =>
  appFetch<Payment>("/api/proxy/orders/payments/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const usePaymentsApi = () => {
  const { auth } = useAuth();
  const isAuthenticated = Boolean(auth?.user);

  const requireAuth = () => {
    if (!isAuthenticated) {
      throw new Error("You must be signed in.");
    }
  };

  const createOrderPayment = useCallback(
    async (payload: CreatePaymentPayload) => {
      requireAuth();
      return createPayment(payload);
    },
    [isAuthenticated]
  );

  return { createOrderPayment };
};
