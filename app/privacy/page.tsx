"use client";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white px-4 py-12">
      <div className="mx-auto w-full max-w-4xl text-gray-800">
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[#4C1C59]">Endoville Health</p>
          <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="text-sm text-gray-500">Effective date: March 17, 2026</p>
        </div>

        <div className="mt-8 space-y-8 text-sm leading-6 text-gray-700">
          <section className="space-y-3">
            <p>
              Endoville Health (“Endoville”, “we”, “us”) respects your privacy. This Privacy Policy
              explains what information we collect, how we use it, and your choices when using our
              websites, apps, and related services (collectively, the “Services”).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">1. Information We Collect</h2>
            <p>We may collect the following categories of information:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                Contact information (name, email, phone number, shipping address, and billing
                address).
              </li>
              <li>Account credentials (email and password).</li>
              <li>Order history and product preferences.</li>
              <li>
                Payment information (processed securely by our payment providers; we do not store
                full card details).
              </li>
              <li>Communications with customer support.</li>
              <li>Device and usage data (IP address, browser, device type, and interactions).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">2. How We Use Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc space-y-2 pl-6">
              <li>Process orders, payments, deliveries, and returns.</li>
              <li>Create and manage your account.</li>
              <li>Provide customer support and respond to requests.</li>
              <li>Personalize your shopping experience.</li>
              <li>Send transactional communications and (if you opt in) marketing messages.</li>
              <li>Improve our Services, security, and fraud prevention.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">3. Cookies & Tracking</h2>
            <p>
              We use cookies and similar technologies to keep you signed in, remember preferences,
              analyze traffic, and improve the Services. You can control cookies through your
              browser settings, but some features may not work properly if cookies are disabled.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">4. Sharing of Information</h2>
            <p>
              We share information with trusted service providers that help us operate the Services
              (hosting, payment processing, shipping, analytics, and customer support). We may also
              disclose information if required by law, to protect our rights, or in connection with
              a business transaction.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">5. Data Retention</h2>
            <p>
              We keep personal information as long as necessary for our relationship with you, legal
              obligations, or legitimate business purposes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">6. Your Choices & Rights</h2>
            <p>
              You can update your account details, manage marketing preferences, or request access
              to or deletion of your personal data by contacting us. Certain rights may vary based
              on your location.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">7. Children’s Privacy</h2>
            <p>
              Our Services are not intended for children under 16. We do not knowingly collect
              personal information from children.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The effective date will be
              updated when changes are posted.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-gray-900">9. Contact Us</h2>
            <p>
              For privacy questions or requests, contact us at
              <span className="font-semibold"> support@endovillehealth.com</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
