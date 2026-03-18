"use client";

import { useEffect, useState } from "react";

type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

const STORAGE_KEY = "endoville-cookie-consent";

const defaultConsent: ConsentState = {
  necessary: true,
  analytics: false,
  marketing: false,
};

export default function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [consent, setConsent] = useState<ConsentState>(defaultConsent);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setIsOpen(true);
        return;
      }
      const parsed = JSON.parse(stored) as ConsentState;
      setConsent({
        necessary: true,
        analytics: Boolean(parsed.analytics),
        marketing: Boolean(parsed.marketing),
      });
    } catch {
      setIsOpen(true);
    }
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setShowCustomize(true);
    };

    window.addEventListener("open-cookie-settings", handleOpen);
    return () => window.removeEventListener("open-cookie-settings", handleOpen);
  }, []);

  const saveConsent = (nextConsent: ConsentState) => {
    setConsent(nextConsent);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextConsent));
    setIsOpen(false);
    setShowCustomize(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 bg-white/95 shadow-[0_-10px_30px_rgba(0,0,0,0.08)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 text-sm text-gray-700 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-base font-semibold text-gray-900">Cookies & Privacy</p>
          <p>
            We use necessary cookies to keep the site running. You can choose whether to allow
            analytics and marketing cookies.
          </p>
          {showCustomize && (
            <div className="mt-3 space-y-2 rounded-lg border border-gray-200 bg-white p-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">Necessary</p>
                  <p className="text-xs text-gray-500">
                    Required for core site functionality. Always on.
                  </p>
                </div>
                <span className="text-xs font-semibold text-gray-600">On</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">Analytics</p>
                  <p className="text-xs text-gray-500">
                    Helps us understand usage and improve the experience.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={consent.analytics}
                  onChange={(event) =>
                    setConsent((prev) => ({ ...prev, analytics: event.target.checked }))
                  }
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[#4C1C59] focus:ring-[#4C1C59]"
                />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">Marketing</p>
                  <p className="text-xs text-gray-500">
                    Used to show more relevant offers and content.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={consent.marketing}
                  onChange={(event) =>
                    setConsent((prev) => ({ ...prev, marketing: event.target.checked }))
                  }
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[#4C1C59] focus:ring-[#4C1C59]"
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowCustomize((prev) => !prev)}
            className="h-10 rounded-md border border-gray-200 px-4 text-sm font-medium text-gray-700 transition-colors hover:border-[#4C1C59]/40 hover:bg-[#4C1C59]/5"
          >
            {showCustomize ? "Hide settings" : "Customize"}
          </button>
          <button
            type="button"
            onClick={() => saveConsent({ necessary: true, analytics: false, marketing: false })}
            className="h-10 rounded-md border border-gray-200 px-4 text-sm font-medium text-gray-700 transition-colors hover:border-[#4C1C59]/40 hover:bg-[#4C1C59]/5"
          >
            Reject non-essential
          </button>
          <button
            type="button"
            onClick={() => saveConsent({ necessary: true, analytics: true, marketing: true })}
            className="h-10 rounded-md bg-[#4C1C59] px-4 text-sm font-medium text-white transition-colors hover:bg-[#361340]"
          >
            Accept all
          </button>
          {showCustomize && (
            <button
              type="button"
              onClick={() => saveConsent(consent)}
              className="h-10 rounded-md bg-[#2f1238] px-4 text-sm font-medium text-white transition-colors hover:bg-[#2a0f32]"
            >
              Save preferences
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
