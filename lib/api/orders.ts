"use client";

import { useCallback } from "react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/state/auth-context";

export type ShippingAddressPayload = {
  full_name: string;
  phone: string;
  email: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
};

export type OrderItemPayload = {
  product?: number;
  variant?: number | null;
  quantity: number;
};

export type OrderPayload = {
  shipping_address: ShippingAddressPayload;
  items: OrderItemPayload[];
  shipping_fee?: string;
  notes?: string;
};

export type OrderItem = {
  id: number;
  product: number | null;
  variant: number | null;
  product_name: string;
  variant_description: string;
  barcode: string;
  quantity: number;
  unit_price: string;
  line_total: string;
};

export type Order = {
  id: number;
  status: string;
  subtotal: string;
  shipping_fee: string;
  total: string;
  is_fully_paid: boolean;
  created_at: string;
  shipping_address?: ShippingAddressPayload;
  items: OrderItem[];
};

export const listOrders = (accessToken: string) =>
  apiFetch<Order[]>("/api/orders/orders/", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

export const createOrder = (accessToken: string, payload: OrderPayload) =>
  apiFetch<Order>("/api/orders/orders/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

export const useOrdersApi = () => {
  const { auth } = useAuth();
  const accessToken = auth?.access;

  const requireAccessToken = () => {
    if (!accessToken) {
      throw new Error("Missing access token.");
    }
    return accessToken;
  };

  const getOrders = useCallback(async () => listOrders(requireAccessToken()), [accessToken]);
  const placeOrder = useCallback(
    async (payload: OrderPayload) => createOrder(requireAccessToken(), payload),
    [accessToken]
  );

  return { getOrders, placeOrder };
};
// TODO: add order queries/mutations based on backend guide.
export const orderApi = {};
