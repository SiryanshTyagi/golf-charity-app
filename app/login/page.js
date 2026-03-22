"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      router.push("/dashboard");
    }
  };

  const handleResetPassword = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      alert(error.message);
    } else {
      alert("Password reset email sent!");
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f3e8_0%,#eef3f7_100%)] px-6 py-10 md:px-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <section className="rounded-[32px] border border-slate-200/70 bg-white/95 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
            Member Login
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            Welcome back
          </h1>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
            Sign in to manage your golf scores, monthly draw participation,
            charity preferences, and winnings in one place.
          </p>

          <div className="mt-8 space-y-4">
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              type="email"
              placeholder="Email"
              onChange={(event) => setEmail(event.target.value)}
            />
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              type="password"
              placeholder="Password"
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
              onClick={handleLogin}
            >
              Login
            </button>
            <button
              onClick={handleResetPassword}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
            >
              Forgot Password
            </button>
          </div>

          <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
            <button
              onClick={() => router.push("/")}
              className="font-medium text-slate-800"
            >
              Back to home
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="font-medium text-slate-800"
            >
              Create account
            </button>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200/60 bg-[linear-gradient(160deg,#18252d,#31424c,#97a6ad)] p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.14)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-300">
            Golf Charity Platform
          </p>
          <h2 className="mt-4 max-w-lg text-4xl font-semibold leading-tight tracking-tight">
            Keep your game moving, and your impact visible.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200">
            This dashboard flow is built for returning members who want quick
            access to score entry, charity contribution, subscriptions, and draw
            outcomes without friction.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                Scores
              </p>
              <p className="mt-2 text-sm text-white">
                Track your latest five stableford rounds.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                Charity
              </p>
              <p className="mt-2 text-sm text-white">
                Keep your contribution aligned with your chosen cause.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                Draws
              </p>
              <p className="mt-2 text-sm text-white">
                Follow monthly results and payout status.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
