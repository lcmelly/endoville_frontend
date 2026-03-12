"use client";

import { X } from "lucide-react";
import { useToast } from "@/lib/state/toast-context";

export default function ToastHost() {
  const { toasts, dismissToast } = useToast();

  return (
    <div className="fixed bottom-6 right-6 z-70 space-y-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-3 rounded-xl border border-[#4C1C59]/20 bg-white px-4 py-3 text-sm text-[#4C1C59] shadow-lg"
        >
          <span className="font-medium">{toast.message}</span>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="rounded-md p-1 text-[#4C1C59]/70 transition-colors hover:bg-[#F4ECFF] hover:text-[#4C1C59]"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
