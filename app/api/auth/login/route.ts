import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  buildTokenCookieOptions,
} from "@/lib/server/auth-cookies";
import { proxyToBackend } from "@/lib/server/backend-proxy";

type BackendLoginResponse = {
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

export async function POST(request: NextRequest) {
  const body = await request.text();
  const response = await proxyToBackend({
    path: "/api/users/login/",
    method: "POST",
    body,
  });

  if (!response.ok) {
    return new NextResponse(response.body, {
      status: response.status,
      headers: { "Content-Type": response.contentType },
    });
  }

  const auth = JSON.parse(response.body) as BackendLoginResponse;
  const nextResponse = NextResponse.json({ user: auth.user });

  nextResponse.cookies.set(
    ACCESS_TOKEN_COOKIE,
    auth.access,
    buildTokenCookieOptions(auth.access)
  );
  nextResponse.cookies.set(
    REFRESH_TOKEN_COOKIE,
    auth.refresh,
    buildTokenCookieOptions(auth.refresh)
  );

  return nextResponse;
}
