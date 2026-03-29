import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

export const ACCESS_TOKEN_COOKIE = "endoville.access";
export const REFRESH_TOKEN_COOKIE = "endoville.refresh";

const decodeJwtPayload = (token: string) => {
  const [, payload] = token.split(".");
  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = JSON.parse(Buffer.from(padded, "base64").toString("utf8")) as {
      exp?: number;
    };
    return decoded;
  } catch {
    return null;
  }
};

const getCookieExpiry = (token: string) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return undefined;
  }

  return new Date(payload.exp * 1000);
};

export const buildTokenCookieOptions = (token: string): Partial<ResponseCookie> => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  expires: getCookieExpiry(token),
});

export const clearTokenCookieOptions: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 0,
};
