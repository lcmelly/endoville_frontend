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

export type ShippingAddressDetail = ShippingAddressPayload & {
  id?: number;
  created_at?: string;
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

export type ShipmentEvent = {
  id: number;
  status: string;
  message: string;
  location: string;
  occurred_at: string;
};

export type Shipment = {
  id: number;
  status: string;
  carrier: string;
  tracking_number: string;
  tracking_url: string;
  estimated_delivery_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  events: ShipmentEvent[];
};

export type OrderPaymentRecord = {
  id: number;
  provider: string;
  status: string;
  amount: string;
  currency: string;
  checkout_url: string;
  provider_payment_id: string;
  provider_invoice_id: string;
  created_at: string;
  updated_at: string;
};

/** Fields returned by GET /api/orders/orders/ (list) */
export type Order = {
  id: number;
  status: string;
  subtotal: string;
  shipping_fee: string;
  total: string;
  is_fully_paid: boolean;
  created_at: string;
  updated_at?: string;
  notes?: string;
  user?: number;
  shipping_address?: ShippingAddressDetail | null;
  items: OrderItem[];
};

/** Full order from GET /api/orders/orders/{id}/ */
export type OrderDetail = Order & {
  shipping_address?: ShippingAddressDetail | null;
  shipment?: Shipment | null;
  payments?: OrderPaymentRecord[];
};

export const listOrders = (accessToken: string) =>
  apiFetch<Order[]>("/api/orders/orders/", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

export const getOrder = (accessToken: string, id: number) =>
  apiFetch<OrderDetail>(`/api/orders/orders/${id}/`, {
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
  const getOrderById = useCallback(
    async (id: number) => getOrder(requireAccessToken(), id),
    [accessToken]
  );
  const placeOrder = useCallback(
    async (payload: OrderPayload) => createOrder(requireAccessToken(), payload),
    [accessToken]
  );

  return { getOrders, getOrderById, placeOrder };
};

export const orderApi = {};
