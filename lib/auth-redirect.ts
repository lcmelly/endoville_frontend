/**
 * Only allow same-origin relative paths (open-redirect safe).
 */
export const getSafeNextPath = (value: string | null | undefined, fallback = "/") => {
  if (!value) {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.includes("://")) {
    return fallback;
  }

  return trimmed;
};

export const withNextParam = (path: string, nextPath: string | null | undefined) => {
  const safeNext = getSafeNextPath(nextPath, "");
  if (!safeNext || safeNext === "/") {
    return path;
  }

  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}next=${encodeURIComponent(safeNext)}`;
};
