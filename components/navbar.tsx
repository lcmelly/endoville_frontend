"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  MapPin,
  Globe,
  Phone,
  ChevronDown,
  Tag,
  SlidersHorizontal,
  ShoppingBag,
  Settings,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/state/auth-context";
import { useLocation } from "@/lib/state/location-context";
import { useCart } from "@/lib/state/cart-context";
import { useCategoriesQuery } from "@/lib/api/products";
import { useEndovilleBrandAssets } from "@/lib/brand-assets";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const { location, setLocation } = useLocation();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { auth, clearAuth } = useAuth();
  const { itemCount } = useCart();
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const [searchInput, setSearchInput] = useState(searchParams.get("search") ?? "");
  const isLoggedIn = Boolean(auth?.user);
  const displayName =
    auth?.user?.first_name || auth?.user?.last_name || auth?.user?.email || "Account";

  // Placeholder data - to be replaced with actual data later
  const language = "EN"; // Placeholder: getLanguage()
  const mobileLocationLabel = location === "Kenya" ? "KE" : "US";

  const navigationItems = [
    { label: "Categories", href: "/categories" },
    { label: "Endoville Living", href: "/endoville-living" },
  ];

  const locationOptions = ["USA", "Kenya"] as const;
  const { data: categories } = useCategoriesQuery();
  const { logoUrl } = useEndovilleBrandAssets();

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const applySearch = (query: string, mode: "push" | "replace" = "push") => {
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("search", query.trim());
    } else {
      params.delete("search");
    }
    params.delete("page");
    const next = params.toString();
    const basePath = pathname.startsWith("/endoville-living")
      ? "/endoville-living"
      : "/products";
    const nextUrl = next ? `${basePath}?${next}` : basePath;

    if (mode === "replace") {
      router.replace(nextUrl);
      return;
    }

    router.push(nextUrl);
  };

  const handleSearch = (query: string) => {
    applySearch(query, "push");
  };

  const handleOpenFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("filters", "1");
    const next = params.toString();
    router.push(next ? `/products?${next}` : "/products?filters=1");
  };

  const handleCartClick = () => {
    router.push("/cart");
  };

  const handleLocationSelect = (option: (typeof locationOptions)[number]) => {
    setLocation(option);
    setLocationMenuOpen(false);
  };

  const handleLogout = () => {
    clearAuth();
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
    router.push("/");
  };

  useEffect(() => {
    if (!accountMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [accountMenuOpen]);

  useEffect(() => {
    setSearchInput(searchParams.get("search") ?? "");
  }, [searchParams]);

  useEffect(() => {
    if (pathname !== "/products") {
      return;
    }

    const currentSearch = searchParams.get("search") ?? "";
    if (searchInput === currentSearch) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      applySearch(searchInput, "replace");
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [pathname, searchInput, searchParams]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b bg-white/95 shadow-sm backdrop-blur">
      {/* Top Utility Bar */}
      <div className="border-b bg-[#361340] text-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-10 text-sm">
            {/* Offer Coupons - Left Side */}
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-[#F2BA52]" />
              <span className="text-xs sm:text-sm">
                <span className="hidden sm:inline">Special Offers & </span>Coupons Available
              </span>
            </div>

            {/* Right Side Items */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative">
                <button
                  onClick={() => setLocationMenuOpen((open) => !open)}
                  className="flex items-center gap-1.5 hover:text-[#F2BA52] transition-colors"
                  aria-expanded={locationMenuOpen}
                  aria-haspopup="menu"
                >
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">{location}</span>
                  <span className="sm:hidden">{mobileLocationLabel}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                {locationMenuOpen && (
                  <div className="absolute right-0 mt-2 w-32 rounded-md bg-white text-gray-800 shadow-lg ring-1 ring-black/5 z-50">
                    {locationOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleLocationSelect(option)}
                        className={cn(
                          "flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-100",
                          location === option && "font-semibold text-[#4C1C59]"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button className="flex items-center gap-1.5 hover:text-[#F2BA52] transition-colors">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{language}</span>
                <span className="sm:hidden">ENG</span>
                <ChevronDown className="h-3 w-3" />
              </button>
              <Link
                href="/contact"
                className="flex items-center gap-1.5 hover:text-[#F2BA52] transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span className="hidden md:inline">Customer Service</span>
                <span className="md:hidden">Support</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-3 md:h-20 md:gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <img
              src={logoUrl}
              alt="Endoville Health"
              className="h-8 md:h-12 lg:h-14 w-auto object-contain"
            />
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <div
              className={cn(
                "relative w-full transition-all duration-200",
                searchFocused && "ring-2 ring-[#4C1C59] rounded-lg"
              )}
            >
              <input
                type="text"
                value={searchInput}
                placeholder="Search products, brands, and more..."
                className={cn(
                  "w-full h-12 pl-12 pr-4 rounded-lg border-2 border-gray-200",
                  "focus:outline-none focus:border-[#4C1C59]",
                  "transition-all duration-200",
                  "text-gray-900 placeholder:text-gray-400"
                )}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch(e.currentTarget.value);
                  }
                }}
              />
              <Search
                className={cn(
                  "absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors",
                  searchFocused ? "text-[#4C1C59]" : "text-gray-400"
                )}
              />
              <button
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                  handleSearch(input.value);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4 bg-[#4C1C59] text-white rounded-md hover:bg-[#361340] transition-colors font-medium text-sm"
              >
                Search
              </button>
            </div>
          </div>

          {/* Right Side Actions - Desktop */}
          <div className="hidden md:flex items-center gap-4">
            {/* User Account */}
            {isLoggedIn ? (
              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => setAccountMenuOpen((open) => !open)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 transition-colors group"
                  aria-label="Open account menu"
                  aria-expanded={accountMenuOpen}
                  aria-haspopup="menu"
                >
                  <div className="relative">
                    <User className="h-6 w-6 text-[#361340] group-hover:text-[#4C1C59] transition-colors" />
                  </div>
                  <span className="text-xs text-gray-600 group-hover:text-[#4C1C59] transition-colors">
                    {`Hi, ${displayName}`}
                  </span>
                </button>
                {accountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-100 bg-white p-2 shadow-xl">
                    <Link
                      href="/orders"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-[#4C1C59]"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Orders
                    </Link>
                    <Link
                      href="/account"
                      onClick={() => setAccountMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-[#4C1C59]"
                    >
                      <Settings className="h-4 w-4" />
                      Account
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 transition-colors group"
                aria-label="Sign In"
              >
                <div className="relative">
                  <User className="h-6 w-6 text-[#361340] group-hover:text-[#4C1C59] transition-colors" />
                </div>
                <span className="text-xs text-gray-600 group-hover:text-[#4C1C59] transition-colors">
                  Sign In
                </span>
              </Link>
            )}

            {/* Shopping Cart */}
            <button
              onClick={handleCartClick}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 transition-colors group relative"
              aria-label="Shopping Cart"
            >
              <div className="relative">
                <ShoppingCart className="h-6 w-6 text-[#361340] group-hover:text-[#4C1C59] transition-colors" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#F2BA52] text-[#361340] rounded-full flex items-center justify-center text-xs font-bold">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-600 group-hover:text-[#4C1C59] transition-colors">
                Cart
              </span>
            </button>
          </div>

          {/* Mobile Cart + Menu */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={handleCartClick}
              className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="h-6 w-6 text-[#361340]" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#F2BA52] text-[#361340] rounded-full flex items-center justify-center text-xs font-bold">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-[#361340]" />
              ) : (
                <Menu className="h-6 w-6 text-[#361340]" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation Links - Desktop */}
        <div className="hidden md:flex items-center gap-8 pb-4 ms-0.1">
          {(categories ?? []).slice(0, 5).map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.id}`}
              className="font-heading group relative text-sm font-bold text-gray-700 transition-colors hover:text-[#4C1C59]"
            >
              {category.name}
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#4C1C59] transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
          {navigationItems.map((item) => {
            const active = isActive(item.href);
            if (item.label === "Categories") {
              return null;
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative group text-sm transition-colors",
                  item.label === "Endoville Living" && "font-heading font-bold",
                  active
                    ? item.label === "Endoville Living"
                      ? "text-[#7B9450]"
                      : "text-[#4C1C59] font-semibold"
                    : item.label === "Endoville Living"
                      ? "text-[#7B9450] hover:text-[#6B8447]"
                      : "text-gray-700 hover:text-[#4C1C59]"
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "absolute bottom-0 left-0 h-0.5 transition-all duration-300",
                    item.label === "Endoville Living" ? "bg-[#7B9450]" : "bg-[#4C1C59]",
                    active ? "w-full" : "w-0 group-hover:w-full"
                  )}
                />
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-3 pb-2 mt-[-5px]">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchInput}
              placeholder="Search products..."
              className="w-full h-11 pl-10 pr-4 rounded-2xl border-2 border-gray-200 focus:outline-none focus:border-[#4C1C59] text-gray-900 placeholder:text-gray-400"
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(e.currentTarget.value);
                }
              }}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <button
            type="button"
            onClick={handleOpenFilters}
            className="h-11 me-7.5 w-11 rounded-2xl border border-gray-200 text-gray-600 transition-colors hover:border-[#4C1C59]/40 hover:text-[#4C1C59]"
            aria-label="Open filters"
          >
            <SlidersHorizontal className="mx-auto h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* Mobile Navigation Links */}
            {navigationItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block py-2 transition-colors",
                    item.label === "Endoville Living" && "font-heading font-bold",
                    active
                      ? item.label === "Endoville Living"
                        ? "border-l-4 border-[#7B9450] pl-3 text-[#7B9450]"
                        : "text-[#4C1C59] font-semibold border-l-4 border-[#4C1C59] pl-3"
                      : item.label === "Endoville Living"
                        ? "text-[#7B9450] hover:text-[#6B8447]"
                        : "text-gray-700 hover:text-[#4C1C59]"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Mobile Actions */}
            <div className="pt-4 border-t space-y-3">
              <div className="flex items-center gap-4">
                <Link
                  href={isLoggedIn ? "/account" : "/login"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors w-full"
                >
                  <User className="h-5 w-5 text-[#361340]" />
                  <span className="text-sm font-medium text-gray-700">
                    {isLoggedIn ? `Hi, ${displayName}` : "Sign In"}
                  </span>
                </Link>
              </div>

              {isLoggedIn && (
                <div className="space-y-1 rounded-xl bg-gray-50 p-2">
                  <Link
                    href="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-white hover:text-[#4C1C59]"
                  >
                    Orders
                  </Link>
                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-white hover:text-[#4C1C59]"
                  >
                    Account
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-white"
                  >
                    Logout
                  </button>
                </div>
              )}

              <button
                onClick={handleCartClick}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              >
                <ShoppingCart className="h-5 w-5 text-[#361340]" />
                <span className="text-sm font-medium text-gray-700">Cart</span>
                {itemCount > 0 && (
                  <span className="h-5 w-5 bg-[#F2BA52] text-[#361340] rounded-full flex items-center justify-center text-xs font-bold">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Utility Links */}
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <div className="flex items-center gap-2">
                  {locationOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => setLocation(option)}
                      className={cn(
                        "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                        location === option
                          ? "bg-[#4C1C59] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#4C1C59] transition-colors w-full">
                <Globe className="h-4 w-4" />
                <span>Language: {language}</span>
              </button>
              <Link
                href="/contact"
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#4C1C59] transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>Customer Service</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
