"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { activateUser, googleLogin, registerUser } from "@/lib/api/users";
import { ApiError } from "@/lib/api/client";
import { useEndovilleBrandAssets } from "@/lib/brand-assets";
import { useAuth } from "@/lib/state/auth-context";

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

export default function SignupPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const { hero1Url } = useEndovilleBrandAssets();
  const tokenClientRef = useRef<{ requestAccessToken: () => void } | null>(null);
  const [step, setStep] = useState<"register" | "activate">("register");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleRegister = async () => {
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      const response = await registerUser({
        email,
        first_name: firstName,
        last_name: lastName,
        password,
      });
      setStep("activate");
      setStatus(response.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    setError(null);
    setStatus(null);
    setLoading(true);
    try {
      const response = await activateUser({ email, otp });
      setStatus(response.message);
      router.push("/login");
    } catch (err) {
      setError(getErrorMessage(err, "Activation failed."));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (err: unknown, fallback = "Registration failed.") => {
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
            setError("Google signup failed. Please try again.");
            setGoogleLoading(false);
            return;
          }
          try {
            const loginResponse = await googleLogin({ access_token: response.access_token });
            setAuth(loginResponse);
            router.push("/");
          } catch (err) {
            setError(getErrorMessage(err, "Google signup failed."));
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

  const handleGoogleSignup = () => {
    setError(null);
    setStatus(null);
    if (!agreeToTerms) {
      setError("Please agree to the Terms of Use and Privacy Policy to continue.");
      return;
    }
    if (!tokenClientRef.current) {
      setError("Google signup is not ready yet.");
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
              <h1 className="text-2xl font-semibold text-gray-900">Create Account</h1>
              <p className="mt-2 text-sm text-gray-500">
                Start your wellness journey with us.
              </p>
            </div>
            <div className="mt-8 space-y-6">
              {step === "register" ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                        First name
                      </label>
                      <input
                        id="firstName"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C1C59] focus-visible:ring-offset-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                        Last name
                      </label>
                      <input
                        id="lastName"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="flex h-11 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4C1C59] focus-visible:ring-offset-2"
                      />
                    </div>
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

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
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

                  {error && <p className="text-sm text-red-600">{error}</p>}
                  {status && <p className="text-sm text-green-600">{status}</p>}

                  <label className="flex items-start gap-3 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={agreeToTerms}
                      onChange={(event) => setAgreeToTerms(event.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#4C1C59] focus:ring-[#4C1C59]"
                    />
                    <span>
                      I agree to the{" "}
                      <Link href="/terms" className="font-semibold text-[#4C1C59]">
                        Terms of Use
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="font-semibold text-[#4C1C59]">
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>

                  <button
                    type="button"
                    className="w-full h-11 rounded-md bg-[#4C1C59] text-white font-medium transition-colors hover:bg-[#361340] disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={handleRegister}
                    disabled={
                      loading || !email || !password || !firstName || !lastName || !agreeToTerms
                    }
                  >
                    {loading ? "Creating account..." : "Create account"}
                  </button>

                  <div className="relative flex items-center gap-4">
                    <span className="h-px flex-1 bg-gray-200" />
                    <span className="text-xs uppercase tracking-wide text-gray-400">Or</span>
                    <span className="h-px flex-1 bg-gray-200" />
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleSignup}
                    disabled={!googleReady || googleLoading || !agreeToTerms}
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
              ) : (
                <>
                  <div className="space-y-2">
                    <label htmlFor="otp" className="text-sm font-medium text-gray-700">
                      Activation OTP
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

                  {error && <p className="text-sm text-red-600">{error}</p>}
                  {status && <p className="text-sm text-green-600">{status}</p>}

                  <button
                    type="button"
                    className="w-full h-11 rounded-md bg-[#4C1C59] text-white font-medium transition-colors hover:bg-[#361340] disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={handleActivate}
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? "Activating..." : "Activate account"}
                  </button>
                </>
              )}

              <div className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/login" className="text-[#4C1C59] font-semibold">
                  Log in
                </Link>
              </div>
            </div>
          </div>
          <div className="hidden md:block relative bg-linear-to-br from-[#B679F8] to-[#6B3EB6]">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_left,#fff,transparent_60%)]" />
            <img
              src={hero1Url}
              alt="Premium wellness"
              className="absolute inset-0 h-full w-full object-cover object-right"
            />
            <div className="absolute inset-0 bg-[#4C1C59]/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
