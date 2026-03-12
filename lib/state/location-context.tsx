"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type LocationOption = "USA" | "Kenya";

type LocationContextValue = {
  location: LocationOption;
  setLocation: (value: LocationOption) => void;
};

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

const detectLocation = (): LocationOption => {
  if (typeof window === "undefined") {
    return "USA";
  }
  try {
    const locale = navigator.language?.toLowerCase() ?? "";
    if (locale.includes("-ke")) {
      return "Kenya";
    }
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone?.toLowerCase() ?? "";
    if (timeZone.includes("nairobi")) {
      return "Kenya";
    }
  } catch {
    // ignore detection errors
  }
  return "USA";
};

export const LocationProvider = ({ children }: { children: React.ReactNode }) => {
  const [location, setLocation] = useState<LocationOption>(() => detectLocation());

  const value = useMemo(
    () => ({
      location,
      setLocation,
    }),
    [location]
  );

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within LocationProvider.");
  }
  return context;
};
