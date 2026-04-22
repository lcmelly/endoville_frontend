"use client";

import { appFetch } from "@/lib/api/client";
import type { OrderItemPayload } from "@/lib/api/orders";
import type { BackendCartResponse } from "@/lib/cart/sync-utils";

export const getMyCart = () =>
  appFetch<BackendCartResponse>("/api/proxy/orders/cart/me/", {
    method: "GET",
  });

export const syncCart = (items: OrderItemPayload[]) =>
  appFetch<BackendCartResponse>("/api/proxy/orders/cart/sync/", {
    method: "PUT",
    body: JSON.stringify({ items }),
  });
