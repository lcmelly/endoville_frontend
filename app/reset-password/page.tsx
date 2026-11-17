"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { confirmPasswordReset, requestPasswordReset } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") ?? "";
  const token = searchParams.get("token") ?? "";
  const hasResetLink = Boolean(uid && token);
  // A reset link names one account. An email in the same URL is ignored so it
  // cannot be presented as a different account, or sent anywhere else.
  const [email, setEmail] = useState(hasResetLink ? "" : (searchParams.get("email") ?? ""));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const errorMessage = (err: unknown, fallback: string) => {
    if (err instanceof ApiError && err.data && typeof err.data === "object") {
      const data = err.data as Record<string, unknown>;
      const firstValue = Object.values(data)[0];
      if (typeof firstValue === "string") return firstValue;
      if (Array.isArray(firstValue) && typeof firstValue[0] === "string") return firstValue[0];
    }
    if (err instanceof Error) return err.message;
    return fallback;
  };

  const handleRequest = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      await requestPasswordReset({ email: email.trim() });
      setStatus(
        "If an account exists for that email, a reset link has been sent to that same address."
      );
    } catch (err) {
      setError(errorMessage(err, "Could not send a reset link."));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setStatus(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const response = await confirmPasswordReset({ uid, token, password });
      setStatus(response.message);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(errorMessage(err, "This reset link is invalid or has expired."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4ECFF] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-sm md:p-10">
        <h1 className="text-2xl font-semibold text-gray-900">Reset password</h1>
        <p className="mt-2 text-sm text-gray-500">
          {hasResetLink
            ? "Choose a new password for the account this link was sent to."
            : "If this address belongs to an account, we email the reset link to that address only."}
        </p>

        {hasResetLink ? (
          <form onSubmit={handleConfirm} className="mt-8 space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                New password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C1C59]"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C1C59]"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {status && <p className="text-sm text-green-600">{status}</p>}
            <button
              type="submit"
              disabled={loading || password.length < 8 || !confirmPassword}
              className="w-full h-11 rounded-md bg-[#4C1C59] text-white font-medium transition-colors hover:bg-[#361340] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Saving..." : "Update password"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRequest} className="mt-8 space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C1C59]"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {status && <p className="text-sm text-green-600">{status}</p>}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full h-11 rounded-md bg-[#4C1C59] text-white font-medium transition-colors hover:bg-[#361340] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link href="/login" className="font-semibold text-[#4C1C59]">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}
