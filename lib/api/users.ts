import { useCallback } from "react";
import { apiFetch } from "@/lib/api/client";
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

// Login response for /api/users/login/
export type LoginUserResponse = {
  access: string;
  refresh: string;
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

// Login user and retrieve access/refresh tokens; no auth required.
export const loginUser = (payload: LoginUserPayload) =>
  apiFetch<LoginUserResponse>("/api/users/login/", {
    method: "POST",
    // No auth headers for login.
    body: JSON.stringify(payload),
  });

// Internal helper: fetch profile using a supplied access token.
const getMeWithToken = (accessToken: string) =>
  apiFetch<UserProfile>("/api/users/me/", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

// Internal helper: update profile using a supplied access token.
const updateMeWithToken = (accessToken: string, payload: UpdateUserProfilePayload) =>
  apiFetch<UserProfile>("/api/users/me/", {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });

// Auth-aware profile APIs that pull the access token from global auth state.
export const useUserApi = () => {
  const { auth } = useAuth();
  const accessToken = auth?.access;

  // Fetch the current user's profile.
  const getMe = useCallback(async () => {
    if (!accessToken) {
      throw new Error("Missing access token.");
    }
    return getMeWithToken(accessToken);
  }, [accessToken]);

  // Update the current user's profile.
  const updateMe = useCallback(
    async (payload: UpdateUserProfilePayload) => {
      if (!accessToken) {
        throw new Error("Missing access token.");
      }
      return updateMeWithToken(accessToken, payload);
    },
    [accessToken]
  );

  return { getMe, updateMe };
};

// Public API surface for user endpoints.
export const userApi = {
  registerUser,
  activateUser,
  sendOtp,
  loginUser,
  useUserApi,
};
