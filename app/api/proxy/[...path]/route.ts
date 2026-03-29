import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearTokenCookieOptions,
} from "@/lib/server/auth-cookies";
import { proxyToBackend } from "@/lib/server/backend-proxy";

const allowedRoutePatterns = [
  { pattern: /^\/api\/users\/me\/$/, methods: ["GET", "PATCH"] },
  { pattern: /^\/api\/orders\/orders\/$/, methods: ["GET", "POST"] },
  { pattern: /^\/api\/orders\/orders\/\d+\/$/, methods: ["GET"] },
  { pattern: /^\/api\/orders\/payments\/$/, methods: ["POST"] },
];

const resolveBackendPath = (segments: string[]) => {
  const backendPath = `/api/${segments.join("/")}/`;
  return allowedRoutePatterns.some(({ pattern }) => pattern.test(backendPath)) ? backendPath : null;
};

const isAllowedRequest = (backendPath: string, method: string) =>
  allowedRoutePatterns.some(
    ({ pattern, methods }) => pattern.test(backendPath) && methods.includes(method.toUpperCase())
  );

async function handleRequest(request: NextRequest, segments: string[]) {
  const backendPath = resolveBackendPath(segments);
  if (!backendPath || !isAllowedRequest(backendPath, request.method)) {
    return NextResponse.json({ detail: "Route not supported." }, { status: 404 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return NextResponse.json({ detail: "Authentication required." }, { status: 401 });
  }

  const body =
    request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
  const response = await proxyToBackend({
    path: backendPath,
    method: request.method,
    accessToken,
    body,
  });

  const nextResponse = new NextResponse(response.body, {
    status: response.status,
    headers: { "Content-Type": response.contentType },
  });

  if (response.status === 401) {
    nextResponse.cookies.set(ACCESS_TOKEN_COOKIE, "", clearTokenCookieOptions);
    nextResponse.cookies.set(REFRESH_TOKEN_COOKIE, "", clearTokenCookieOptions);
  }

  return nextResponse;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return handleRequest(request, path);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return handleRequest(request, path);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return handleRequest(request, path);
}
