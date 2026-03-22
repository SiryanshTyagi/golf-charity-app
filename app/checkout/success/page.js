"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Confirming your payment...");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    async function confirmStripeSession() {
      const sessionId = searchParams.get("session_id");

      if (!sessionId) {
        setMessage("Payment completed, but the Stripe session ID is missing.");
        return;
      }

      try {
        const response = await fetch("/api/stripe/confirm-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        });

        const payload = await response.json();

        if (!response.ok) {
          setMessage(
            payload.error ??
              "Payment succeeded, but the subscription could not be updated automatically.",
          );
          return;
        }

        setConfirmed(true);
        setMessage(
          `Payment confirmed. Your ${payload.plan ?? "selected"} subscription is now active.`,
        );
      } catch {
        setMessage(
          "Payment succeeded, but the subscription confirmation request failed.",
        );
      }
    }

    confirmStripeSession();
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8f4ea_0%,#eef4fb_42%,#f8fafc_100%)] px-6 py-16">
      <div className="mx-auto max-w-2xl rounded-[30px] border border-slate-200/70 bg-white/90 p-8 text-center shadow-sm">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
          Stripe Checkout
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">
          Payment successful
        </h1>
        <p className="mt-4 text-sm text-slate-600">{message}</p>
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
        {!confirmed && (
          <p className="mt-4 text-xs text-slate-500">
            If the dashboard does not update immediately, refresh it once after
            returning.
          </p>
        )}
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[linear-gradient(180deg,#f8f4ea_0%,#eef4fb_42%,#f8fafc_100%)] px-6 py-16">
          <div className="mx-auto max-w-2xl rounded-[30px] border border-slate-200/70 bg-white/90 p-8 text-center shadow-sm">
            <p className="text-sm text-slate-600">Confirming your payment...</p>
          </div>
        </main>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
