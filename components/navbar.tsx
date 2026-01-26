"use client";

import { useState } from "react";
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
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import logoWhite from "@/assets/logo_white.png";
import { useAuth } from "@/lib/state/auth-context";

type LocationOption = "USA" | "Kenya";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const [location, setLocation] = useState<LocationOption>("Kenya");
  const pathname = usePathname();
  const { auth } = useAuth();
  const isLoggedIn = Boolean(auth?.user);
  const displayName =
    auth?.user?.first_name || auth?.user?.last_name || auth?.user?.email || "Account";

  // Placeholder data - to be replaced with actual data later
  const cartItemsCount = 0; // Placeholder: getCartItemsCount()
  const language = "EN"; // Placeholder: getLanguage()

  const navigationItems = [
    { label: "Home", href: "/" },
    { label: "Products", href: "/products" },
    { label: "Categories", href: "/categories" },
    { label: "Deals", href: "/deals" },
    { label: "Brands", href: "/brands" },
    { label: "Health & Wellness", href: "/health" },
  ];

  const locationOptions: LocationOption[] = ["USA", "Kenya"];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const handleSearch = (query: string) => {
    // Placeholder: implementSearch(query)
    console.log("Searching for:", query);
  };

  const handleCartClick = () => {
    // Placeholder: navigateToCart()
    console.log("Navigate to cart");
  };

  const handleLocationSelect = (option: LocationOption) => {
    setLocation(option);
    setLocationMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
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
                  <span className="sm:hidden">Loc</span>
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
                <span className="sm:hidden">Lang</span>
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
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src={logoWhite}
              alt="Endoville Health"
              height={220}
              width={480}
              className="h-10 md:h-12 lg:h-14 w-auto object-contain"
              priority
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
                placeholder="Search products, brands, and more..."
                className={cn(
                  "w-full h-12 pl-12 pr-4 rounded-lg border-2 border-gray-200",
                  "focus:outline-none focus:border-[#4C1C59]",
                  "transition-all duration-200",
                  "text-gray-900 placeholder:text-gray-400"
                )}
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
            <Link
              href={isLoggedIn ? "/account" : "/login"}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 transition-colors group"
              aria-label={isLoggedIn ? "My Account" : "Sign In"}
            >
              <div className="relative">
                <User className="h-6 w-6 text-[#361340] group-hover:text-[#4C1C59] transition-colors" />
              </div>
              <span className="text-xs text-gray-600 group-hover:text-[#4C1C59] transition-colors">
                {isLoggedIn ? `Hi, ${displayName}` : "Sign In"}
              </span>
            </Link>

            {/* Shopping Cart */}
            <button
              onClick={handleCartClick}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-100 transition-colors group relative"
              aria-label="Shopping Cart"
            >
              <div className="relative">
                <ShoppingCart className="h-6 w-6 text-[#361340] group-hover:text-[#4C1C59] transition-colors" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-[#F2BA52] text-[#361340] rounded-full flex items-center justify-center text-xs font-bold">
                    {cartItemsCount > 9 ? "9+" : cartItemsCount}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-600 group-hover:text-[#4C1C59] transition-colors">
                Cart
              </span>
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-[#361340]" />
            ) : (
              <Menu className="h-6 w-6 text-[#361340]" />
            )}
          </button>
        </div>

        {/* Navigation Links - Desktop */}
        <div className="hidden md:flex items-center gap-8 pb-4 ms-0.1">
          {navigationItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors relative group",
                  active
                    ? "text-[#4C1C59] font-semibold"
                    : "text-gray-700 hover:text-[#4C1C59]"
                )}
              >
                {item.label}
                <span
                  className={cn(
                    "absolute bottom-0 left-0 h-0.5 bg-[#4C1C59] transition-all duration-300",
                    active ? "w-full" : "w-0 group-hover:w-full"
                  )}
                />
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full h-11 pl-10 pr-4 rounded-lg border-2 border-gray-200 focus:outline-none focus:border-[#4C1C59] text-gray-900 placeholder:text-gray-400"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch(e.currentTarget.value);
              }
            }}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
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
                    "block py-2 font-medium transition-colors",
                    active
                      ? "text-[#4C1C59] font-semibold border-l-4 border-[#4C1C59] pl-3"
                      : "text-gray-700 hover:text-[#4C1C59]"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}

            {/* Mobile Actions */}
            <div className="pt-4 border-t flex items-center gap-4">
              <Link
                href={isLoggedIn ? "/account" : "/login"}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors w-full"
              >
                <User className="h-5 w-5 text-[#361340]" />
                <span className="text-sm font-medium text-gray-700">
                  {isLoggedIn ? `Hi, ${displayName}` : "Sign In"}
                </span>
              </Link>
              <button
                onClick={handleCartClick}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              >
                <ShoppingCart className="h-5 w-5 text-[#361340]" />
                <span className="text-sm font-medium text-gray-700">Cart</span>
                {cartItemsCount > 0 && (
                  <span className="h-5 w-5 bg-[#F2BA52] text-[#361340] rounded-full flex items-center justify-center text-xs font-bold">
                    {cartItemsCount > 9 ? "9+" : cartItemsCount}
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
