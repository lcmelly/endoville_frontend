"use client";

import { useEffect, useMemo, useState } from "react";
import Hero from "@/components/hero";
import FeaturedProducts from "@/components/featured-products";
import EndovilleLivingPreview from "@/components/endoville-living-preview";
import { getEndovilleBrandAssets } from "@/lib/brand-assets";
import { useBrandsQuery } from "@/lib/api/products";

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

const preloadImage = (src: string) =>
  new Promise<void>((resolve) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });

function HomePageLoader() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-16">
      <div className="relative flex flex-col items-center justify-center">
        <span className="loader-orb loader-orb-left" />
        <span className="loader-orb loader-orb-right" />
        <img
          src="/android-chrome-192x192.png"
          alt="Loading Endoville Health"
          className="h-28 w-28 loader-logo select-none sm:h-36 sm:w-36"
          draggable={false}
        />
        <p className="mt-5 text-sm font-semibold tracking-wide text-[#4C1C59]">
          Preparing your wellness experience...
        </p>
      </div>
      <style jsx>{`
        .loader-logo {
          animation:
            logoBounce 1.35s ease-in-out infinite,
            logoFloat 3s ease-in-out infinite;
          filter: drop-shadow(0 14px 24px rgba(76, 28, 89, 0.18));
        }

        .loader-orb {
          position: absolute;
          border-radius: 9999px;
          background: rgba(177, 217, 137, 0.85);
          box-shadow: 0 8px 18px rgba(76, 28, 89, 0.12);
        }

        .loader-orb-left {
          top: 8%;
          left: -18%;
          height: 18px;
          width: 18px;
          animation: orbFloatLeft 2.1s ease-in-out infinite;
        }

        .loader-orb-right {
          right: -14%;
          top: 22%;
          height: 14px;
          width: 14px;
          animation: orbFloatRight 1.8s ease-in-out infinite;
        }

        @keyframes logoBounce {
          0%,
          100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.03);
          }
        }

        @keyframes logoFloat {
          0%,
          100% {
            rotate: -2deg;
          }
          50% {
            rotate: 2deg;
          }
        }

        @keyframes orbFloatLeft {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(-6px, -12px, 0) scale(1.08);
          }
        }

        @keyframes orbFloatRight {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(8px, -10px, 0) scale(1.12);
          }
        }
      `}</style>
    </div>
  );
}

export default function HomePageShell() {
  const { data: brands, isLoading: brandsLoading } = useBrandsQuery();
  const { hero1Url, hero2Url } = useMemo(() => getEndovilleBrandAssets(brands), [brands]);
  const [isReady, setIsReady] = useState(false);
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

  useEffect(() => {
    let isCancelled = false;

    if (brandsLoading) {
      return;
    }

    if (!showHeroImages) {
      setIsReady(true);
      return;
    }

    setIsReady(false);
    Promise.all([preloadImage(hero1Url), preloadImage(hero2Url)]).finally(() => {
      if (!isCancelled) {
        setIsReady(true);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [brandsLoading, hero1Url, hero2Url, showHeroImages]);

  if (!isReady) {
    return <HomePageLoader />;
  }

  return (
    <>
      <Hero showImages={showHeroImages} />
      <FeaturedProducts />
      <EndovilleLivingPreview />
    </>
  );
}
