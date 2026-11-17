import { apiFetch } from "@/lib/api/client";

export type CreateMessagePayload = {
  email?: string;
  phone?: string;
  message: string;
  order_number?: string;
  captcha_token: string;
};

export type CustomerMessage = {
  id: number;
  email: string;
  phone: string;
  message: string;
  order_number: string | null;
  created_at: string;
};

// Public contact form. email or phone is required; order_number is the order id.
export const createMessage = (payload: CreateMessagePayload) => {
  const body: CreateMessagePayload = {
    message: payload.message,
    captcha_token: payload.captcha_token,
  };
  if (payload.email) body.email = payload.email;
  if (payload.phone) body.phone = payload.phone;
  if (payload.order_number) body.order_number = payload.order_number;

  return apiFetch<CustomerMessage>("/api/orders/messages/", {
    method: "POST",
    body: JSON.stringify(body),
  });
};
