"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api/client";
import { createMessage } from "@/lib/api/messages";
import { useAuth } from "@/lib/state/auth-context";
import TurnstileWidget from "@/components/turnstile-widget";

const PHONE_PATTERN = /^\+?[0-9]{8,15}$/;
const ORDER_PATTERN = /^[A-Za-z0-9_-]{8,32}$/;
const MESSAGE_MAX_LENGTH = 500;

const normalizePhone = (value: string) => value.replace(/[\s().-]/g, "");

const fieldMessage = (value: unknown): string | null => {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return null;
};

const errorMessage = (err: unknown) => {
  if (err instanceof ApiError) {
    if (err.status === 429) {
      return "You've sent several messages recently. Please wait and try again.";
    }
    if (err.data && typeof err.data === "object") {
      const data = err.data as Record<string, unknown>;
      const preferred = ["captcha_token", "message", "email", "phone", "order_number", "non_field_errors"];
      for (const key of preferred) {
        const message = fieldMessage(data[key]);
        if (message) return message;
      }
      for (const value of Object.values(data)) {
        const message = fieldMessage(value);
        if (message) return message;
      }
    }
  }
  return "Could not send your message. Please try again.";
};

type ContactFormProps = {
  siteKey: string;
};

export default function ContactForm({ siteKey }: ContactFormProps) {
  const searchParams = useSearchParams();
  const { auth } = useAuth();
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [phone, setPhone] = useState("");
  const [orderNumber, setOrderNumber] = useState(searchParams.get("order") ?? "");
  const [message, setMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (emailTouched || email) return;
    const accountEmail = auth?.user?.email;
    if (accountEmail) setEmail(accountEmail);
  }, [auth, email, emailTouched]);

  const captchaReady = Boolean(siteKey);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setStatus(null);

    const trimmedEmail = email.trim();
    const trimmedPhone = normalizePhone(phone);
    const trimmedOrder = orderNumber.trim();
    const trimmedMessage = message.trim();

    if (!trimmedEmail && !trimmedPhone) {
      setError("Enter an email address or a phone number.");
      return;
    }
    if (trimmedPhone && !PHONE_PATTERN.test(trimmedPhone)) {
      setError("Enter a phone number with 8 to 15 digits. It may start with +.");
      return;
    }
    if (trimmedOrder && !ORDER_PATTERN.test(trimmedOrder)) {
      setError("Use the order id from your order page. A short number such as 1 or 2 is not accepted.");
      return;
    }
    if (!trimmedMessage) {
      setError("Enter a message.");
      return;
    }
    if (trimmedMessage.length > MESSAGE_MAX_LENGTH) {
      setError(`Message must be ${MESSAGE_MAX_LENGTH} characters or fewer.`);
      return;
    }
    if (!captchaToken) {
      setError("Complete the security check before sending.");
      return;
    }

    setLoading(true);
    try {
      await createMessage({
        ...(trimmedEmail ? { email: trimmedEmail } : {}),
        ...(trimmedPhone ? { phone: trimmedPhone } : {}),
        ...(trimmedOrder ? { order_number: trimmedOrder } : {}),
        message: trimmedMessage,
        captcha_token: captchaToken,
      });
      setStatus("Message sent. We'll reply using the contact details you provided.");
      setMessage("");
      setCaptchaToken("");
      setCaptchaKey((key) => key + 1);
    } catch (err) {
      setError(errorMessage(err));
      setCaptchaToken("");
      setCaptchaKey((key) => key + 1);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !loading && captchaReady && Boolean(captchaToken);

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10">
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-10">
        <p className="text-sm font-semibold text-[#4C1C59]">Endoville Health</p>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">Contact us</h1>
        <p className="mt-2 text-sm text-gray-500">
          Send a question, a note about an order, or anything else you need us to know.
          Include an email or a phone number so we can reply.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-2">
            <label htmlFor="contact-email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmailTouched(true);
                setEmail(event.target.value);
              }}
              className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C1C59]"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="contact-phone" className="text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              id="contact-phone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="+254700000000"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C1C59]"
            />
            <p className="text-xs text-gray-500">Email or phone is enough. You can send both.</p>
          </div>
          <div className="space-y-2">
            <label htmlFor="contact-order" className="text-sm font-medium text-gray-700">
              Order id <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              id="contact-order"
              type="text"
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C1C59]"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="contact-message" className="text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              id="contact-message"
              required
              rows={5}
              maxLength={MESSAGE_MAX_LENGTH}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C1C59]"
            />
            <p className="text-right text-xs text-gray-400">
              {message.trim().length}/{MESSAGE_MAX_LENGTH}
            </p>
          </div>

          {captchaReady ? (
            <TurnstileWidget key={captchaKey} siteKey={siteKey} onToken={setCaptchaToken} />
          ) : (
            <p className="text-sm text-gray-500">
              Add CUSTOMER_MESSAGE_CAPTCHA_SITE_KEY before sending a message.
            </p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          {status && <p className="text-sm text-green-600">{status}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="h-11 w-full rounded-md bg-[#4C1C59] font-medium text-white transition-colors hover:bg-[#361340] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send message"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Or email{" "}
          <a href="mailto:support@endovillehealth.com" className="font-semibold text-[#4C1C59]">
            support@endovillehealth.com
          </a>
        </p>
      </div>
    </div>
  );
}
