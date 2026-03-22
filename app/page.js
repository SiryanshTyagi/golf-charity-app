"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const impactItems = [
  {
    label: "Support a cause",
    value: "Choose your charity and send part of every subscription toward real impact.",
  },
  {
    label: "Track your game",
    value: "Log your last five stableford scores and stay ready for the monthly draw.",
  },
  {
    label: "Win monthly prizes",
    value: "Subscribers enter a recurring draw with equal prize splits across winning tiers.",
  },
];

const featureCards = [
  {
    title: "Subscription-led access",
    text: "Simple monthly or yearly participation with a dashboard built around status, renewal, and prize activity.",
  },
  {
    title: "Charity-first experience",
    text: "The platform leads with contribution and community impact instead of traditional golf aesthetics.",
  },
  {
    title: "Admin draw controls",
    text: "Preview draws, review winner estimates, manage charities, and verify payouts from the admin panel.",
  },
];

export default function Home() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const { data } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      setIsSignedIn(Boolean(data.user));
      setAuthLoading(false);
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f8f4ea_0%,#eef4fb_42%,#f8fafc_100%)] text-slate-900">
      <section className="relative">
        <div className="absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.22),transparent_42%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_36%)]" />

        <div className="mx-auto max-w-7xl px-6 pb-20 pt-8 md:px-10">
          <nav className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-slate-500">
                Golf Charity Platform
              </p>
              <p className="mt-2 text-lg font-semibold">Play with purpose</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push("/login")}
                className="rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-sm text-slate-700"
              >
                Login
              </button>
              <button
                onClick={() => router.push(isSignedIn ? "/dashboard" : "/signup")}
                className="rounded-full bg-slate-950 px-5 py-2 text-sm font-medium text-white"
              >
                {isSignedIn ? "Open Dashboard" : "Get Started"}
              </button>
            </div>
          </nav>

          <div className="mt-16 grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-amber-700">
                Charity-led golf rewards
              </p>
              <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-tight tracking-tight md:text-6xl">
                Turn every round into charity impact and monthly prize chances.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Subscribers track stableford scores, support a chosen cause, and
                enter monthly draws through a product designed to feel modern,
                warm, and mission-driven.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={() => router.push(isSignedIn ? "/dashboard" : "/signup")}
                  className="rounded-full bg-amber-500 px-6 py-3 text-sm font-medium text-slate-950"
                >
                  {isSignedIn ? "Go To Dashboard" : "Join The Platform"}
                </button>
                <button
                  onClick={() => router.push("/login")}
                  className="rounded-full border border-slate-300 bg-white/80 px-6 py-3 text-sm font-medium text-slate-700"
                >
                  {authLoading ? "Checking Session..." : "Existing Member Login"}
                </button>
                <button
                  onClick={() => router.push("/charities")}
                  className="rounded-full border border-slate-300 bg-white/80 px-6 py-3 text-sm font-medium text-slate-700"
                >
                  Browse Charities
                </button>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {impactItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-white/70 bg-white/70 p-5 shadow-sm backdrop-blur"
                  >
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 top-10 hidden h-32 w-32 rounded-full bg-amber-200/60 blur-3xl md:block" />
              <div className="absolute -right-4 bottom-12 hidden h-28 w-28 rounded-full bg-sky-200/70 blur-3xl md:block" />

              <div className="relative rounded-[32px] border border-slate-200/70 bg-slate-950 p-7 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
                <div className="rounded-[28px] border border-white/10 bg-white/5 p-6">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                    Monthly cycle
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold">
                    Track, contribute, draw, verify.
                  </h2>

                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl bg-white/5 p-4">
                      <p className="text-sm text-slate-300">1. Choose your cause</p>
                      <p className="mt-2 text-sm text-slate-400">
                        Set the charity you want to support and define your
                        contribution percentage.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4">
                      <p className="text-sm text-slate-300">2. Save your scores</p>
                      <p className="mt-2 text-sm text-slate-400">
                        Keep your latest five stableford rounds ready for monthly
                        prize matching.
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/5 p-4">
                      <p className="text-sm text-slate-300">3. Enter the draw</p>
                      <p className="mt-2 text-sm text-slate-400">
                        Admin-controlled draws generate winners, prize splits, and
                        payout reviews.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-white/5 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Match 3
                    </p>
                    <p className="mt-2 text-2xl font-semibold">25%</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Match 4
                    </p>
                    <p className="mt-2 text-2xl font-semibold">35%</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                      Match 5
                    </p>
                    <p className="mt-2 text-2xl font-semibold">40%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20 md:px-10">
        <div className="rounded-[32px] border border-slate-200/70 bg-white/90 p-8 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-slate-500">
                Why it works
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                A modern golf product built around contribution, not cliche.
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-slate-600">
              The experience is structured for three audiences at once: visitors
              who need a compelling concept, subscribers who need a simple
              dashboard, and admins who need operational control.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {featureCards.map((card) => (
              <div
                key={card.title}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
              >
                <h3 className="text-xl font-semibold text-slate-900">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {card.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => router.push("/charities")}
              className="rounded-full bg-slate-950 px-6 py-3 text-sm font-medium text-white"
            >
              View Public Charity Directory
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
