export type CookieConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

export const COOKIE_CONSENT_STORAGE_KEY = "endoville-cookie-consent";
export const COOKIE_CONSENT_UPDATED_EVENT = "cookie-consent-updated";
export const OPEN_COOKIE_SETTINGS_EVENT = "open-cookie-settings";

export const defaultCookieConsent: CookieConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
};

const isBrowser = () => typeof window !== "undefined";

export const normalizeCookieConsent = (
  value: Partial<CookieConsentState> | null | undefined
): CookieConsentState => ({
  necessary: true,
  analytics: Boolean(value?.analytics),
  marketing: Boolean(value?.marketing),
});

export const readCookieConsent = (): CookieConsentState | null => {
  if (!isBrowser()) {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!stored) {
      return null;
    }
    return normalizeCookieConsent(JSON.parse(stored) as Partial<CookieConsentState>);
  } catch {
    return null;
  }
};

export const hasAnalyticsConsent = () => Boolean(readCookieConsent()?.analytics);
export const hasMarketingConsent = () => Boolean(readCookieConsent()?.marketing);

export const applyCookieConsent = (consent: CookieConsentState) => {
  if (!isBrowser()) {
    return;
  }

  document.documentElement.dataset.cookieAnalytics = consent.analytics ? "1" : "0";
  document.documentElement.dataset.cookieMarketing = consent.marketing ? "1" : "0";
  window.dispatchEvent(
    new CustomEvent(COOKIE_CONSENT_UPDATED_EVENT, {
      detail: consent,
    })
  );
};

export const saveCookieConsent = (consent: CookieConsentState) => {
  if (!isBrowser()) {
    return consent;
  }

  const next = normalizeCookieConsent(consent);
  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(next));
  applyCookieConsent(next);
  return next;
};

export const openCookieSettings = () => {
  if (!isBrowser()) {
    return;
  }
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT));
};

export const subscribeToCookieConsent = (
  listener: (consent: CookieConsentState | null) => void
) => {
  if (!isBrowser()) {
    return () => undefined;
  }

  const handleUpdate = (event: Event) => {
    const detail = (event as CustomEvent<CookieConsentState>).detail;
    listener(normalizeCookieConsent(detail));
  };

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== COOKIE_CONSENT_STORAGE_KEY) {
      return;
    }
    listener(readCookieConsent());
  };

  window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, handleUpdate);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, handleUpdate);
    window.removeEventListener("storage", handleStorage);
  };
};
