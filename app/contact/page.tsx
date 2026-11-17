import type { Metadata } from "next";
import { Suspense } from "react";
import ContactForm from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact | Endoville Health",
  description: "Send a question or a note about an order to Endoville Health.",
};

export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <ContactForm />
    </Suspense>
  );
}
