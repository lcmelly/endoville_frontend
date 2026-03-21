"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#2a0f32] bg-[#1c0922] text-white">
      <div className="container mx-auto px-4 py-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <Link href="/" className="inline-flex items-center">
              <img
                src="/logo_dark.png"
                alt="Endoville Health"
                className="h-20 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-white">
              Premium supplements, vitamins, and wellness essentials delivered with care.
            </p>
          </div>
          <div className="space-y-2 text-sm text-white">
            <p className="text-sm font-bold uppercase tracking-wide text-white underline underline-offset-4">
              Explore
            </p>
            <Link href="/products" className="block hover:text-white">
              Shop products
            </Link>
            <Link href="/endoville-living" className="block hover:text-white">
              Endoville Living
            </Link>
            <Link href="/cart" className="block hover:text-white">
              Cart
            </Link>
          </div>
          <div className="space-y-2 text-sm text-white">
            <p className="text-sm font-bold uppercase tracking-wide text-white underline underline-offset-4">
              Company
            </p>
            <Link href="/terms" className="block hover:text-white">
              Terms of Use
            </Link>
            <Link href="/privacy" className="block hover:text-white">
              Privacy Policy
            </Link>
            <a href="mailto:support@endovillehealth.com" className="block hover:text-white">
              support@endovillehealth.com
            </a>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-white/15 pt-6 text-xs text-white sm:flex-row sm:items-center">
          <span>© {new Date().getFullYear()} Endoville Health. All rights reserved.</span>
          <div className="flex flex-col gap-2 text-white/60 sm:items-end">
            <span>Wellness with integrity.</span>
            <span>Powered by Guntu IT Solutions.</span>
            <div className="flex flex-wrap items-center gap-3 text-white">
              <Link href="/privacy" className="hover:text-white">
                Privacy
              </Link>
              <span className="text-white/40">•</span>
              <Link href="/terms" className="hover:text-white">
                Terms
              </Link>
              <span className="text-white/40">•</span>
              <button
                type="button"
                onClick={() =>
                  window.dispatchEvent(new Event("open-cookie-settings"))
                }
                className="hover:text-white"
              >
                Cookie settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
