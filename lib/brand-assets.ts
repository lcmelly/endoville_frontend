"use client";

import { useMemo } from "react";
import { Brand, useBrandsQuery } from "@/lib/api/products";

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const matchesAny = (value: string, candidates: string[]) => {
  const normalizedValue = normalize(value);
  return candidates.some((candidate) => normalizedValue.includes(normalize(candidate)));
};

const scoreBrand = (brand: Brand) => {
  const normalizedName = normalize(brand.name);

  if (normalizedName === "endoville") {
    return 100;
  }
  if (normalizedName.startsWith("endoville")) {
    return 90;
  }
  if (normalizedName.includes("endoville")) {
    return 80;
  }
  if (normalizedName.includes("end")) {
    return 20;
  }
  return 0;
};

const pickClosestEndovilleBrand = (brands: Brand[]) =>
  brands
    .slice()
    .sort((firstBrand, secondBrand) => scoreBrand(secondBrand) - scoreBrand(firstBrand))[0] ?? null;

const getBrandImages = (brand: Brand | null) => {
  if (!brand) {
    return [];
  }

  return (brand.image_urls ?? [])
    .map((url, index) => ({
      url,
      label: brand.image_labels?.[index] ?? "",
    }))
    .filter((image) => Boolean(image.url));
};

const pickImageByLabel = (brand: Brand | null, preferredLabels: string[]) => {
  const brandImages = getBrandImages(brand);

  for (const preferredLabel of preferredLabels) {
    const exactMatch = brandImages.find((image) => normalize(image.label) === normalize(preferredLabel));
    if (exactMatch) {
      return exactMatch.url;
    }
  }

  return brandImages.find((image) => matchesAny(image.label, preferredLabels))?.url ?? null;
};

const pickNonLogoBrandImage = (brand: Brand | null) =>
  getBrandImages(brand).find((image) => !matchesAny(image.label, ["logo"]))?.url ?? null;

export const getEndovilleBrandAssets = (brands: Brand[] | undefined) => {
  const endovilleBrand = pickClosestEndovilleBrand(brands ?? []);
  const fallbackNonLogo = pickNonLogoBrandImage(endovilleBrand);

  return {
    brand: endovilleBrand,
    logoUrl:
      pickImageByLabel(endovilleBrand, ["logo_white", "logo white", "logowhite", "logo"]) ??
      "/logo_white.png",
    hero1Url:
      pickImageByLabel(endovilleBrand, ["hero1", "hero 1", "hero_one"]) ??
      fallbackNonLogo ??
      "/hero1.jpg",
    hero2Url:
      pickImageByLabel(endovilleBrand, ["hero2", "hero 2", "hero_two"]) ??
      fallbackNonLogo ??
      "/hero2.jpg",
  };
};

export const useEndovilleBrandAssets = () => {
  const { data: brands } = useBrandsQuery();
  return useMemo(() => getEndovilleBrandAssets(brands), [brands]);
};
