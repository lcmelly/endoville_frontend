"use client";

import { useState } from "react";
import type { Order } from "@/lib/api/orders";
import { usePaymentsApi } from "@/lib/api/payments";
import { useToast } from "@/lib/state/toast-context";

type PaymentOption = "mpesa" | "card";

type OrderPaymentBlockProps = {
  order: Order;
  authEmail?: string | null;
  /** Where to send the user after payment gateway (full URLs built with window.location.origin). */
  paymentReturn?: "orders-list" | "order-detail";
  successUrl?: string;
  cancelUrl?: string;
};

export function OrderPaymentBlock({
  order,
  authEmail,
  paymentReturn = "orders-list",
  successUrl,
  cancelUrl,
}: OrderPaymentBlockProps) {
  const { createOrderPayment } = usePaymentsApi();
  const { showToast } = useToast();
  const [paymentOption, setPaymentOption] = useState<PaymentOption>("card");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [paying, setPaying] = useState(false);

  if (order.is_fully_paid) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-gray-100 bg-[#F9F6FF] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Make payment</h3>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setPaymentOption("mpesa")}
          className={`flex items-center justify-center rounded-lg border px-3 py-0 transition-colors ${
            paymentOption === "mpesa"
              ? "border-[#4C1C59] bg-white ring-2 ring-[#4C1C59]/30"
              : "border-gray-200 bg-white hover:border-[#4C1C59]/40"
          }`}
        >
          <img
            src="/mpesa.png"
            alt="M-Pesa"
            className="h-10 w-auto max-w-[140px] object-contain"
          />
        </button>
        <button
          type="button"
          onClick={() => setPaymentOption("card")}
          className={`flex items-center justify-center rounded-lg border px-3 py-0 transition-colors ${
            paymentOption === "card"
              ? "border-[#4C1C59] bg-white ring-2 ring-[#4C1C59]/30"
              : "border-gray-200 bg-white hover:border-[#4C1C59]/40"
          }`}
        >
          <img
            src="/visa_mastercard.png"
            alt="Visa and Mastercard"
            className="h-10 w-auto max-w-[160px] object-contain"
          />
        </button>
      </div>

      {paymentOption === "mpesa" && (
        <div className="mt-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            M-Pesa phone number
          </label>
          <input
            value={mpesaPhone}
            onChange={(event) => setMpesaPhone(event.target.value)}
            placeholder="0712345678"
            className="mt-2 h-10 w-full rounded-lg border border-gray-200 px-3 text-sm focus:border-[#4C1C59] focus:outline-none"
          />
        </div>
      )}

      <button
        type="button"
        disabled={paying}
        onClick={async () => {
          try {
            setPaying(true);
            const origin = window.location.origin;
            const defaultSuccess =
              paymentReturn === "order-detail"
                ? `${origin}/orders/${order.id}?payment=success`
                : `${origin}/orders?payment=success`;
            const defaultCancel =
              paymentReturn === "order-detail"
                ? `${origin}/orders/${order.id}?payment=failed`
                : `${origin}/orders?payment=failed`;
            const resolvedSuccess = successUrl ?? defaultSuccess;
            const resolvedCancel = cancelUrl ?? defaultCancel;
            if (paymentOption === "mpesa" && !mpesaPhone.trim()) {
              throw new Error("Enter a phone number for M-Pesa.");
            }
            const payment = await createOrderPayment({
              order: order.id,
              provider: paymentOption === "card" ? "stripe" : "intasend",
              method: paymentOption === "mpesa" ? "stk" : "checkout",
              phone_number: paymentOption === "mpesa" ? mpesaPhone : undefined,
              email: order.shipping_address?.email ?? authEmail ?? undefined,
              success_url: resolvedSuccess,
              cancel_url: resolvedCancel,
            });
            if (payment.checkout_url) {
              window.location.assign(payment.checkout_url);
              return;
            }
            showToast(
              paymentOption === "mpesa"
                ? "M-Pesa prompt sent to your phone."
                : "Payment initiated."
            );
          } catch (err) {
            showToast(
              err instanceof Error ? err.message : "Failed to initiate payment."
            );
          } finally {
            setPaying(false);
          }
        }}
        className="mt-4 w-full rounded-lg bg-[#361340] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2a0f32] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {paying
          ? "Processing..."
          : paymentOption === "mpesa"
          ? "Pay with M-Pesa"
          : "Pay with Card"}
      </button>
    </div>
  );
}
