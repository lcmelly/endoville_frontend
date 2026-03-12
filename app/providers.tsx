"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/state/auth-context";
import { CartProvider } from "@/lib/state/cart-context";
import { LocationProvider } from "@/lib/state/location-context";
import { ToastProvider } from "@/lib/state/toast-context";
import ToastHost from "@/components/toast-host";

type ProvidersProps = {
  children: React.ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {/* AuthProvider persists login responses across the app. */}
      <AuthProvider>
        <LocationProvider>
          <CartProvider>
            <ToastProvider>
              {children}
              <ToastHost />
            </ToastProvider>
          </CartProvider>
        </LocationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
