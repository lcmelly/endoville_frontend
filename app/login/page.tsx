"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { loginUser, sendOtp } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/state/auth-context";
import hero2 from "@/assets/hero2.jpg";

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (err: unknown, fallback: string) => {
    const capitalize = (value: string) =>
      value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;
    if (err instanceof ApiError && err.data && typeof err.data === "object") {
      const data = err.data as Record<string, unknown>;
      if (typeof data.message === "string") {
        return capitalize(data.message);
      }
      const firstValue = Object.values(data)[0];
      if (typeof firstValue === "string") {
        return capitalize(firstValue);
      }
      if (Array.isArray(firstValue) && typeof firstValue[0] === "string") {
        return capitalize(firstValue[0]);
      }
      return capitalize(JSON.stringify(data));
    }
    if (err instanceof Error) {
      return capitalize(err.message);
    }
    return capitalize(fallback);
  };

  const handleSendOtp = async () => {
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      await sendOtp({ email });
      setStep("otp");
      setStatus("OTP sent. Enter the 6-digit code to finish login.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send OTP."));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      const response = await loginUser({ email, password, otp });
      setAuth(response);
      router.push("/");
    } catch (err) {
      setError(getErrorMessage(err, "Login failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4ECFF] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="grid md:grid-cols-2">
          <div className="p-6 md:p-10">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Log In</h1>
              <p className="mt-2 text-sm text-gray-500">
                Welcome back! Please enter your details.
              </p>
            </div>
            <div className="mt-8 space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C1C59] focus-visible:ring-offset-2"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C1C59] focus-visible:ring-offset-2"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {step === "otp" && (
                <div className="space-y-2">
                  <label htmlFor="otp" className="text-sm font-medium text-gray-700">
                    OTP Code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    placeholder="6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    autoComplete="one-time-code"
                    className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C1C59] focus-visible:ring-offset-2"
                  />
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}
              {status && <p className="text-sm text-green-600">{status}</p>}

              {step === "credentials" ? (
                <button
                  type="button"
                  className="w-full h-11 rounded-md bg-[#4C1C59] text-white font-medium transition-colors hover:bg-[#361340] disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleSendOtp}
                  disabled={loading || !email || !password}
                >
                  {loading ? "Sending OTP..." : "Continue"}
                </button>
              ) : (
                <button
                  type="button"
                  className="w-full h-11 rounded-md bg-[#4C1C59] text-white font-medium transition-colors hover:bg-[#361340] disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleLogin}
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? "Logging in..." : "Log In"}
                </button>
              )}

              <div className="text-center text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="text-[#4C1C59] font-semibold">
                  Sign up
                </Link>
              </div>
            </div>
          </div>
          <div className="hidden md:block relative bg-linear-to-br from-[#B679F8] to-[#6B3EB6]">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_left,#fff,transparent_60%)]" />
            <Image
              src={hero2}
              alt="Wellness lifestyle"
              fill
              className="object-cover object-right"
              priority
            />
            <div className="absolute inset-0 bg-[#4C1C59]/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
