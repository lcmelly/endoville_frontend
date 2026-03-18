"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { googleLogin, loginUser, sendOtp } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/state/auth-context";
import { useEndovilleBrandAssets } from "@/lib/brand-assets";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (options: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const { hero2Url } = useEndovilleBrandAssets();
  const tokenClientRef = useRef<{ requestAccessToken: () => void } | null>(null);
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      return;
    }

    const initializeClient = () => {
      if (!window.google?.accounts?.oauth2) {
        return;
      }
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "email profile",
        callback: async (response) => {
          if (!response.access_token) {
            setError("Google login failed. Please try again.");
            setGoogleLoading(false);
            return;
          }
          try {
            const loginResponse = await googleLogin({ access_token: response.access_token });
            setAuth(loginResponse);
            router.push("/");
          } catch (err) {
            setError(getErrorMessage(err, "Google login failed."));
          } finally {
            setGoogleLoading(false);
          }
        },
      });
      setGoogleReady(true);
    };

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-google-identity="true"]'
    );
    if (existingScript) {
      initializeClient();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentity = "true";
    script.onload = initializeClient;
    document.body.appendChild(script);
  }, [getErrorMessage, router, setAuth]);

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

  const resetFlow = (method: "password" | "otp") => {
    setLoginMethod(method);
    setStep("credentials");
    setError(null);
    setStatus(null);
    setOtp("");
    if (method === "otp") {
      setPassword("");
    }
  };

  const handlePasswordLogin = async () => {
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      const response = await loginUser({ email, password });
      setAuth(response);
      router.push("/");
    } catch (err) {
      setError(getErrorMessage(err, "Login failed."));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async () => {
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      const response = await loginUser({ email, otp });
      setAuth(response);
      router.push("/");
    } catch (err) {
      setError(getErrorMessage(err, "Login failed."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setError(null);
    setStatus(null);
    if (!tokenClientRef.current) {
      setError("Google login is not ready yet.");
      return;
    }
    setGoogleLoading(true);
    tokenClientRef.current.requestAccessToken();
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
              <div className="flex gap-2 rounded-lg bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => resetFlow("password")}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    loginMethod === "password"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Use password
                </button>
                <button
                  type="button"
                  onClick={() => resetFlow("otp")}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    loginMethod === "otp"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Use code
                </button>
              </div>

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

              {loginMethod === "password" && (
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
              )}

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
                  onClick={loginMethod === "password" ? handlePasswordLogin : handleSendOtp}
                  disabled={
                    loading || !email || (loginMethod === "password" && !password)
                  }
                >
                  {loading
                    ? loginMethod === "password"
                      ? "Logging in..."
                      : "Sending OTP..."
                    : loginMethod === "password"
                    ? "Log In"
                    : "Continue"}
                </button>
              ) : (
                <button
                  type="button"
                  className="w-full h-11 rounded-md bg-[#4C1C59] text-white font-medium transition-colors hover:bg-[#361340] disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleOtpLogin}
                  disabled={loading || otp.length !== 6}
                >
                  {loading ? "Logging in..." : "Log In"}
                </button>
              )}

              {step === "credentials" && (
                <>
                  <div className="relative flex items-center gap-4">
                    <span className="h-px flex-1 bg-gray-200" />
                    <span className="text-xs uppercase tracking-wide text-gray-400">Or</span>
                    <span className="h-px flex-1 bg-gray-200" />
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={!googleReady || googleLoading}
                    className="w-full h-11 rounded-md border border-gray-200 bg-white text-sm font-medium text-gray-700 transition-colors hover:border-[#4C1C59]/40 hover:bg-[#4C1C59]/5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          fill="#EA4335"
                          d="M24 9.5c3.54 0 6.71 1.23 9.22 3.24l6.89-6.89C35.89 2.11 30.28 0 24 0 14.64 0 6.48 5.38 2.56 13.22l8.02 6.23C12.28 13.15 17.7 9.5 24 9.5z"
                        />
                        <path
                          fill="#4285F4"
                          d="M46.5 24.5c0-1.57-.14-3.09-.4-4.56H24v8.64h12.7c-.55 2.93-2.21 5.41-4.7 7.07l7.2 5.6c4.19-3.87 6.3-9.56 6.3-16.75z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M10.58 28.95a14.6 14.6 0 0 1-.77-4.45c0-1.55.27-3.05.77-4.45l-8.02-6.23A24.04 24.04 0 0 0 0 24.5c0 3.88.93 7.55 2.56 10.68l8.02-6.23z"
                        />
                        <path
                          fill="#34A853"
                          d="M24 48c6.48 0 11.92-2.14 15.9-5.8l-7.2-5.6c-2 1.34-4.56 2.13-8.7 2.13-6.3 0-11.72-3.65-13.42-8.95l-8.02 6.23C6.48 42.62 14.64 48 24 48z"
                        />
                      </svg>
                      {googleLoading ? "Connecting..." : "Continue with Google"}
                    </span>
                  </button>
                </>
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
            <img
              src={hero2Url}
              alt="Wellness lifestyle"
              className="absolute inset-0 h-full w-full object-cover object-right"
            />
            <div className="absolute inset-0 bg-[#4C1C59]/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
