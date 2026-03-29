import { useCallback } from "react";
import { apiFetch, appFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/state/auth-context";

// Registration payload for /api/users/register/
export type RegisterUserPayload = {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
};

// Registration response for /api/users/register/
export type RegisterUserResponse = {
  message: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    is_staff: boolean;
    created_at: string;
  };
};

// Activation payload for /api/users/activate/
export type ActivateUserPayload = {
  email: string;
  otp: string;
};

// Activation response for /api/users/activate/
export type ActivateUserResponse = {
  message: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    is_staff: boolean;
  };
};

// OTP request payload for /api/users/send-otp/
export type SendOtpPayload = {
  email: string;
};

// OTP request response for /api/users/send-otp/
export type SendOtpResponse = {
  message: string;
};

// Login payload for /api/users/login/ (either password or OTP, not both)
export type LoginUserPayload =
  | {
      email: string;
      password: string;
      otp?: never;
    }
  | {
      email: string;
      otp: string;
      password?: never;
    };

export type AuthenticatedUser = {
  user: {
    id: number;
    email: string;
    phone: string;
    first_name: string;
    last_name: string;
    image_url: string;
    image_ref?: string;
    gender: string;
    date_of_birth: string;
    is_active: boolean;
    created_at: string;
  };
};

export type AuthSessionResponse = {
  user: AuthenticatedUser["user"] | null;
};

// Google login payload for /api/users/google-login/
export type GoogleLoginPayload = {
  access_token: string;
};

// User profile shape returned by /api/users/me/
export type UserProfile = {
  id: number;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  image_url: string;
  image_ref?: string;
  gender: string;
  date_of_birth: string;
  created_at: string;
  updated_at: string;
};

// Editable fields for PATCH /api/users/me/
export type UpdateUserProfilePayload = {
  first_name?: string;
  last_name?: string;
  image_url?: string;
  image_ref?: string;
  gender?: string;
  date_of_birth?: string;
};

// Register a user; no auth required.
export const registerUser = (payload: RegisterUserPayload) =>
  apiFetch<RegisterUserResponse>("/api/users/register/", {
    method: "POST",
    // No auth headers for registration.
    body: JSON.stringify(payload),
  });

// Activate a user account; no auth required.
export const activateUser = (payload: ActivateUserPayload) =>
  apiFetch<ActivateUserResponse>("/api/users/activate/", {
    method: "POST",
    // No auth headers for activation.
    body: JSON.stringify(payload),
  });

// Request a login OTP; no auth required.
export const sendOtp = (payload: SendOtpPayload) =>
  apiFetch<SendOtpResponse>("/api/users/send-otp/", {
    method: "POST",
    // No auth headers for sending OTP.
    body: JSON.stringify(payload),
  });

// Login user and establish a cookie-backed session.
export const loginUser = (payload: LoginUserPayload) =>
  appFetch<AuthenticatedUser>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

// Login user with Google OAuth and establish a cookie-backed session.
export const googleLogin = (payload: GoogleLoginPayload) =>
  appFetch<AuthenticatedUser>("/api/auth/google-login/", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getSession = () =>
  appFetch<AuthSessionResponse>("/api/auth/session/", {
    method: "GET",
  });

export const logoutUser = () =>
  appFetch<{ ok: true }>("/api/auth/logout/", {
    method: "POST",
  });

// Internal helper: fetch profile using the server-side auth cookie.
const getMe = () =>
  appFetch<UserProfile>("/api/proxy/users/me/", {
    method: "GET",
  });

// Internal helper: update profile using the server-side auth cookie.
const updateMeRequest = (payload: UpdateUserProfilePayload) =>
  appFetch<UserProfile>("/api/proxy/users/me/", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

// Auth-aware profile APIs that use the server-side auth cookie.
export const useUserApi = () => {
  const { auth } = useAuth();
  const isAuthenticated = Boolean(auth?.user);

  // Fetch the current user's profile.
  const getCurrentUser = useCallback(async () => {
    if (!isAuthenticated) {
      throw new Error("You must be signed in.");
    }
    return getMe();
  }, [isAuthenticated]);

  // Update the current user's profile.
  const updateMe = useCallback(
    async (payload: UpdateUserProfilePayload) => {
      if (!isAuthenticated) {
        throw new Error("You must be signed in.");
      }
      return updateMeRequest(payload);
    },
    [isAuthenticated]
  );

  return { getMe: getCurrentUser, updateMe };
};

// Public API surface for user endpoints.
export const userApi = {
  registerUser,
  activateUser,
  sendOtp,
  loginUser,
  googleLogin,
  useUserApi,
};
