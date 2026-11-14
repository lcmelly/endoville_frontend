import { NextRequest, NextResponse } from "next/server";
import {
  isAllowedCountry,
  isGeoBlockEnabled,
  normalizeCountryCode,
} from "@/lib/geo";

type NetlifyGeoContext = {
  context?: {
    geo?: {
      country?: {
        code?: string;
      };
    };
  };
};

const getNetlifyCountryCode = (): string | null => {
  try {
    const netlify = (globalThis as typeof globalThis & { Netlify?: NetlifyGeoContext })
      .Netlify;
    return normalizeCountryCode(netlify?.context?.geo?.country?.code);
  } catch {
    return null;
  }
};

const resolveCountryCode = (request: NextRequest): string | null => {
  if (process.env.NODE_ENV === "development") {
    const override = normalizeCountryCode(request.headers.get("x-geo-country"));
    if (override) {
      return override;
    }
  }

  return (
    getNetlifyCountryCode() ??
    normalizeCountryCode(request.headers.get("x-nf-country")) ??
    normalizeCountryCode(request.headers.get("x-country"))
  );
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/unavailable" || pathname.startsWith("/unavailable/")) {
    return NextResponse.next();
  }

  if (!isGeoBlockEnabled()) {
    return NextResponse.next();
  }

  const country = resolveCountryCode(request);
  const response = isAllowedCountry(country)
    ? NextResponse.next()
    : NextResponse.redirect(new URL("/unavailable", request.url));

  response.headers.set("x-endoville-country", country ?? "unknown");
  return response;
}

export const config = {
  matcher: [
    /*
     * Match page routes only. Skip APIs, Next internals, and static assets.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
