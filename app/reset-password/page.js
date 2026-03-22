"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const router = useRouter();

  const updatePassword = async () => {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Password updated successfully!");
      router.push("/login");
    }
  };

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f3e8_0%,#eef3f7_100%)] px-6 py-10 md:px-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
        <section className="rounded-[32px] border border-slate-200/70 bg-white/95 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
            Secure Access
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
            Reset your password
          </h1>
          <p className="mt-3 max-w-md text-sm leading-7 text-slate-600">
            Set a new password to get back into your account and continue managing
            your scores, charity settings, and monthly draw activity.
          </p>

          <div className="mt-8 space-y-4">
            <input
              type="password"
              placeholder="New Password"
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
            />
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={updatePassword}
              className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
            >
              Update Password
            </button>
            <button
              onClick={() => router.push("/login")}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
            >
              Back to Login
            </button>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200/60 bg-[linear-gradient(160deg,#202a32,#3c4d57,#9ba9b1)] p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.14)]">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-300">
            Password Recovery
          </p>
          <h2 className="mt-4 max-w-lg text-4xl font-semibold leading-tight tracking-tight">
            Return to your membership with a clean reset flow.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-slate-200">
            This reset step is designed to be quick and clear so members can get
            back to their dashboard without unnecessary friction.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                Account
              </p>
              <p className="mt-2 text-sm text-white">
                Restore access to your member profile.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                Dashboard
              </p>
              <p className="mt-2 text-sm text-white">
                Return to scores, subscriptions, and charity settings.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">
                Security
              </p>
              <p className="mt-2 text-sm text-white">
                Update credentials and continue safely.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
