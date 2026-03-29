import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearTokenCookieOptions,
} from "@/lib/server/auth-cookies";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", clearTokenCookieOptions);
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", clearTokenCookieOptions);
  return response;
}
