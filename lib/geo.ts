export const ALLOWED_COUNTRY_CODES = new Set(["US", "KE"]);

export const GEO_BLOCK_ENABLED_ENV = "GEO_BLOCK_ENABLED";

export const isGeoBlockEnabled = () =>
  process.env.GEO_BLOCK_ENABLED === "true";

export const isAllowedCountry = (countryCode: string | null | undefined) => {
  if (!countryCode) {
    return false;
  }
  return ALLOWED_COUNTRY_CODES.has(countryCode.toUpperCase());
};

export const normalizeCountryCode = (value: string | null | undefined) => {
  const trimmed = value?.trim().toUpperCase();
  if (!trimmed || trimmed.length !== 2) {
    return null;
  }
  return trimmed;
};
