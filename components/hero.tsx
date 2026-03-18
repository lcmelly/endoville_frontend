"use client";

import Link from "next/link";
import { CheckCircle, Phone, Star } from "lucide-react";
import { useEndovilleBrandAssets } from "@/lib/brand-assets";

export default function Hero() {
  // Placeholder data - to be replaced with actual data later
  const rating = 4.8; // Placeholder: getAverageRating()
  const phoneNumber = "(123) 456-7890"; // Placeholder: getPhoneNumber()
  const { hero1Url, hero2Url } = useEndovilleBrandAssets();

  return (
    <section className="relative bg-transparent pt-30 pb-20 md:py-55 lg:py-20 overflow-hidden">
      <div className="container mx-auto pl-2 pr-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center relative">
          {/* Left Content */}
          <div className="text-left space-y-6 relative z-10 mt-[-10%]">
            {/* Subheading/Tagline */}
            <div>
              <span className="text-sm font-medium text-gray-700">
                Wellness. Vitality. Health.
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl md:text-3xl lg:text-5xl font-bold text-gray-900 leading-tight">
            Premium Health Supplements & Vitamins for Your Wellness Journey
            </h1>

            {/* Description */}
            <p className="text-base md:text-lg text-gray-600 leading-relaxed max-w-xl">
              Discover our premium collection of health supplements, vitamins, and wellness products
              carefully curated to support your journey to optimal health and vitality.
            </p>

            {/* CTA Button */}
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-block px-8 py-4 bg-[#361340] text-white rounded-lg font-semibold text-lg hover:bg-[#2a0f32] transition-colors"
              >
                Shop Now
              </Link>
            </div>

            {/* Rating Section */}
            <div className="flex items-center gap-4 pt-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(rating)
                        ? "text-[#F2BA52] fill-[#F2BA52]"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm text-gray-700">
                <span className="font-semibold">{rating}</span> rating on{" "}
                <span className="font-semibold">Google</span>
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex items-center gap-2 text-gray-700 pt-2">
              <Phone className="h-5 w-5 text-[#F2BA52]" />
              <span className="text-lg">{phoneNumber}</span>
            </div>
          </div>

          {/* Right Side - Images */}
          <div className="relative h-[500px] md:h-[600px] lg:h-[700px]">
            {/* Image Container */}
            <div className="relative z-10 h-full flex items-center justify-center">
              {/* Placeholder for overlapping images */}
              <div className="relative w-full h-full max-w-lg">
                {/* Top Image (larger, behind) */}
                <div className="absolute top-0 left-0 lg:w-[90%] w-[70%] aspect-4/5 rounded-[10%] shadow-lg overflow-hidden z-10 lg:ms-[-10%] xlg:ms-[-20%]">
                  <img
                    src={hero1Url}
                    alt="Premium supplements"
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Bottom Image (smaller, overlapping, in front) */}
                <div className="absolute xlg:bottom-2 bottom-[10%] xlg:right-[-20%] lg:right-[-20%] lg:w-[70%] right-[-1%] w-[50%] aspect-4/5 rounded-[10%] shadow-lg overflow-hidden z-20 ms-[-15%] bg-[#B1D989]">
                  <img
                    src={hero2Url}
                    alt="Wellness products"
                    style={{
                      backgroundColor: "#B1D989",
                    }}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-[-10px] lg:mt-[-36px] text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
            Why Choose Endoville Health?
          </h2>
          <ul className="relative mt-6 h-8 text-gray-700 max-w-3xl mx-auto">
            <li className="absolute inset-0 flex items-center justify-center gap-3 rotating-line" style={{ animationDelay: "0s" }}>
              <CheckCircle className="h-5 w-5 text-[#2a0f32]" />
              <span className="mt-6">
                <strong>Science-Backed Formulations</strong> — Every supplement is developed with
                clinically-researched ingredients at effective dosages.
              </span>
            </li>
            <li className="absolute inset-0 flex items-center justify-center gap-3 rotating-line" style={{ animationDelay: "6s" }}>
              <CheckCircle className="h-5 w-5 text-[#2a0f32]" />
              <span className="truncate">
                <strong>Third-Party Tested</strong> — Independent lab testing ensures purity,
                potency, and safety in every batch.
              </span>
            </li>
            <li className="absolute inset-0 flex items-center justify-center gap-3 rotating-line" style={{ animationDelay: "12s" }}>
              <CheckCircle className="h-5 w-5 text-[#2a0f32]" />
              <span className="truncate">
                <strong>Sustainably Sourced</strong> — We prioritize eco-friendly packaging
                and ethically sourced ingredients.
              </span>
            </li>
            <li className="absolute inset-0 flex items-center justify-center gap-3 rotating-line" style={{ animationDelay: "18s" }}>
              <CheckCircle className="h-5 w-5 text-[#2a0f32]" />
              <span className="truncate">
                <strong>Expert-Curated Selection</strong> — Our team of nutritionists and health
                professionals handpick every product.
              </span>
            </li>
          </ul>
        </div>
      </div>
      <style jsx>{`
        .rotating-line {
          opacity: 0;
          animation: rotateLine 24s ease-in-out infinite;
        }

        @keyframes rotateLine {
          0% {
            opacity: 0;
            transform: translateY(6px);
          }
          5% {
            opacity: 1;
            transform: translateY(0);
          }
          20% {
            opacity: 1;
            transform: translateY(0);
          }
          25% {
            opacity: 0;
            transform: translateY(-6px);
          }
          100% {
            opacity: 0;
            transform: translateY(6px);
          }
        }
      `}</style>
    </section>
  );
}
