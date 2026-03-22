import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8f4ea_0%,#eef4fb_42%,#f8fafc_100%)] px-6 py-16">
      <div className="mx-auto max-w-2xl rounded-[30px] border border-slate-200/70 bg-white/90 p-8 text-center shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
          Stripe Checkout
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Payment cancelled
        </h1>
        <p className="mt-4 text-sm text-slate-600">
          No charge was made. You can return to the dashboard and try checkout
          again whenever you are ready.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white"
          >
            Return to Dashboard
          </Link>
          <Link
            href="/"
            className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
