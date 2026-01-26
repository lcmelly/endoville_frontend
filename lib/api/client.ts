"use client";

/**
 * Root of the backend REST API.
 * Keep this as the single source of truth for all endpoints.
 */
export const API_BASE_URL = "https://source.endovillehealth.com/";

/**
 * Safely join the base URL with a relative API path.
 * Example: buildApiUrl("/api/users/") -> "https://source.endovillehealth.com/api/users/"
 */
export const buildApiUrl = (path: string) => {
  const trimmedBase = API_BASE_URL.replace(/\/+$/, "");
  const trimmedPath = path.replace(/^\/+/, "");
  return `${trimmedBase}/${trimmedPath}`;
};

/**
 * Minimal JSON fetch wrapper used by all API modules.
 * - Prefixes the path with the base URL.
 * - Sets JSON content headers by default.
 * - Throws on non-OK responses.
 */
export const apiFetch = async <T>(
  path: string,
  init?: RequestInit
): Promise<T> => {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let errorData: unknown = null;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }
    throw new ApiError(response.status, errorData);
  }

  return response.json() as Promise<T>;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super(`API request failed: ${status}`);
    this.status = status;
    this.data = data;
  }
}
