import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist_Mono, Lato, Raleway } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import Providers from "@/app/providers";
import AnimatedBackground from "@/components/animated-background";
import CookieConsent from "@/components/cookie-consent";
import Footer from "@/components/footer";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Endoville Health | Premium Supplements & Vitamins for Wellness | Shop Online | Across the USA | Delivery to Kenya",
  keywords: ["Endoville Health", "Premium Supplements", "Vitamins for Wellness", "Shop Online", "Across the USA", "Delivery to Kenya", "Health supplements", "Vitamins", "Wellness Products", "Dietary Supplements", "Immunity boosters", "Energy supplements", "natural supplements", "premium vitamins"],
  description: "Shop premium health supplements, vitamins, and wellness products at Endoville. Science-backed formulations for energy, immunity, and vitality. Free shipping on orders over $50. 4.8★ rated. 100% satisfaction guaranteed. Delivered to Kenya from the USA.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${lato.variable} ${raleway.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <AnimatedBackground>
            <Suspense fallback={null}>
              <Navbar />
            </Suspense>
            <div className="pt-[140px]">{children}</div>
          </AnimatedBackground>
          <Footer />
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
