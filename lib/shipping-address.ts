import type { ShippingAddressPayload } from "@/lib/api/orders";

export type PreferredShippingAddress = ShippingAddressPayload;

export const SHIPPING_ADDRESS_STORAGE_KEY = "endoville-shipping-address";
export const SHIPPING_ADDRESS_UPDATED_EVENT = "shipping-address-updated";

const isBrowser = () => typeof window !== "undefined";

const storageKeyForUser = (userId: number) =>
  `${SHIPPING_ADDRESS_STORAGE_KEY}:${userId}`;

export const emptyShippingAddress = (
  overrides: Partial<PreferredShippingAddress> = {}
): PreferredShippingAddress => ({
  full_name: "",
  phone: "",
  email: "",
  address_line_1: "",
  address_line_2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "USA",
  ...overrides,
});

export const normalizeShippingAddress = (
  value: Partial<PreferredShippingAddress> | null | undefined,
  fallbackCountry = "USA"
): PreferredShippingAddress =>
  emptyShippingAddress({
    full_name: value?.full_name?.trim() ?? "",
    phone: value?.phone?.trim() ?? "",
    email: value?.email?.trim() ?? "",
    address_line_1: value?.address_line_1?.trim() ?? "",
    address_line_2: value?.address_line_2?.trim() ?? "",
    city: value?.city?.trim() ?? "",
    state: value?.state?.trim() ?? "",
    postal_code: value?.postal_code?.trim() ?? "",
    country: value?.country?.trim() || fallbackCountry,
  });

export const readPreferredShippingAddress = (
  userId: number | null | undefined
): PreferredShippingAddress | null => {
  if (!isBrowser() || userId == null) {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(storageKeyForUser(userId));
    if (!stored) {
      return null;
    }
    return normalizeShippingAddress(
      JSON.parse(stored) as Partial<PreferredShippingAddress>
    );
  } catch {
    return null;
  }
};

export const writePreferredShippingAddress = (
  userId: number,
  address: PreferredShippingAddress
) => {
  if (!isBrowser()) {
    return;
  }

  const normalized = normalizeShippingAddress(address);
  window.localStorage.setItem(
    storageKeyForUser(userId),
    JSON.stringify(normalized)
  );
  window.dispatchEvent(
    new CustomEvent(SHIPPING_ADDRESS_UPDATED_EVENT, {
      detail: { userId, address: normalized },
    })
  );
};

export const clearPreferredShippingAddress = (
  userId: number | null | undefined
) => {
  if (!isBrowser() || userId == null) {
    return;
  }
  window.localStorage.removeItem(storageKeyForUser(userId));
};

export const shippingAddressHasContent = (
  address: PreferredShippingAddress | null | undefined
) =>
  Boolean(
    address &&
      (address.full_name ||
        address.phone ||
        address.address_line_1 ||
        address.city ||
        address.state ||
        address.postal_code)
  );
