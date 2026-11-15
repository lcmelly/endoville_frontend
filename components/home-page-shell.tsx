"use client";

import { useEffect, useState } from "react";
import Hero from "@/components/hero";
import FeaturedProducts from "@/components/featured-products";
import EndovilleLivingPreview from "@/components/endoville-living-preview";

type NetworkInformation = {
  effectiveType?: string;
  saveData?: boolean;
  addEventListener?: (type: "change", listener: () => void) => void;
  removeEventListener?: (type: "change", listener: () => void) => void;
};

const isSlowConnection = (connection?: NetworkInformation) => {
  if (!connection) {
    return false;
  }

  if (connection.saveData) {
    return true;
  }

  return ["slow-2g", "2g", "3g"].includes(connection.effectiveType ?? "");
};

export default function HomePageShell() {
  const [showHeroImages, setShowHeroImages] = useState(true);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;

    const updateConnectionState = () => {
      setShowHeroImages(!isSlowConnection(connection));
    };

    updateConnectionState();
    connection?.addEventListener?.("change", updateConnectionState);

    return () => {
      connection?.removeEventListener?.("change", updateConnectionState);
    };
  }, []);

  return (
    <>
      <Hero showImages={showHeroImages} />
      <FeaturedProducts />
      <EndovilleLivingPreview />
    </>
  );
}
