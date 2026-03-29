import { buildApiUrl } from "@/lib/api/client";

type ProxyRequestOptions = {
  path: string;
  method: string;
  accessToken?: string;
  body?: string;
};

export const proxyToBackend = async ({
  path,
  method,
  accessToken,
  body,
}: ProxyRequestOptions) => {
  const response = await fetch(buildApiUrl(path), {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    ...(body ? { body } : {}),
    cache: "no-store",
  });

  const rawText = await response.text();
  const contentType = response.headers.get("content-type") ?? "application/json";

  return {
    ok: response.ok,
    status: response.status,
    contentType,
    body: rawText,
  };
};
