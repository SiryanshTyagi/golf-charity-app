"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Check your email for confirmation");
      router.push("/login");
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f3e8_0%,#eef3f7_100%)] px-6 py-10 md:px-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <section className="rounded-[32px] border border-slate-200/60 bg-[linear-gradient(160deg,#20312a,#355144,#a3b7a9)] p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.14)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-200">
            Join The Platform
          </p>
          <h2 className="mt-4 max-w-lg text-4xl font-semibold leading-tight tracking-tight">
            Start your golf membership with a cleaner, more purposeful flow.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-100">
            Create your account to store scores, choose a charity, manage your
            subscription, and take part in the monthly reward cycle.
          </p>

          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-sm font-medium text-white">1. Sign up</p>
              <p className="mt-2 text-sm text-slate-100">
                Create your member profile and access the dashboard.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-sm font-medium text-white">2. Save scores</p>
              <p className="mt-2 text-sm text-slate-100">
                Keep your latest five rounds ready for draw matching.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-sm font-medium text-white">3. Back a charity</p>
              <p className="mt-2 text-sm text-slate-100">
                Choose the cause you want your subscription to support.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200/70 bg-white/95 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
            Create Account
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            Sign up
          </h1>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
            Join the platform and start building your golf profile with monthly
            draw eligibility and charity contribution settings.
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
              onClick={handleSignup}
            >
              Sign Up
            </button>
            <button
              onClick={() => router.push("/login")}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
            >
              Already have an account?
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
