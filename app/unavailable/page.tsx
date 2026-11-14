export default function UnavailablePage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <div className="w-full rounded-[28px] border border-[#4C1C59]/10 bg-linear-to-b from-[#f7ecfb] via-white to-[#fff6ef] px-6 py-12 shadow-sm sm:px-10">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4C1C59]">
          Endoville Health
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
          We&apos;re currently available in Kenya and the USA
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-600">
          Thanks for visiting. Our online store and wellness content are only open to
          customers browsing from Kenya or the United States right now.
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-500">
          If you believe you&apos;re seeing this by mistake, try again from a Kenya or USA
          connection, or reach out and we&apos;ll help.
        </p>
        <div className="mt-8">
          <a
            href="mailto:support@endovillehealth.com"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#4C1C59] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#361340]"
          >
            Contact support
          </a>
        </div>
      </div>
    </main>
  );
}
