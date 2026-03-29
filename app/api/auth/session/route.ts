import { NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearTokenCookieOptions,
} from "@/lib/server/auth-cookies";
import { proxyToBackend } from "@/lib/server/backend-proxy";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json({ user: null });
  }

  const response = await proxyToBackend({
    path: "/api/users/me/",
    method: "GET",
    accessToken,
  });

  if (response.ok) {
    return NextResponse.json({ user: JSON.parse(response.body) });
  }

  if (response.status === 401) {
    const nextResponse = NextResponse.json({ user: null });
    nextResponse.cookies.set(ACCESS_TOKEN_COOKIE, "", clearTokenCookieOptions);
    nextResponse.cookies.set(REFRESH_TOKEN_COOKIE, "", clearTokenCookieOptions);
    return nextResponse;
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers: { "Content-Type": response.contentType },
  });
}
