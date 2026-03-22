"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function formatDate(value) {
  if (!value) {
    return "No date";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "No date";
  }

  return parsed.toLocaleDateString();
}

function getSubscriptionBadgeClass(status) {
  if (status === "active") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "lapsed") {
    return "bg-amber-100 text-amber-700";
  }

  if (status === "cancelled") {
    return "bg-rose-100 text-rose-700";
  }

  return "bg-slate-100 text-slate-700";
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingScore, setSavingScore] = useState(false);
  const [savingCharity, setSavingCharity] = useState(false);
  const [savingSubscription, setSavingSubscription] = useState(false);
  const [startingCheckout, setStartingCheckout] = useState(false);
  const [deletingScoreId, setDeletingScoreId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [profile, setProfile] = useState(null);
  const [scores, setScores] = useState([]);
  const [results, setResults] = useState([]);
  const [charities, setCharities] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [scoreValue, setScoreValue] = useState("");
  const [scoreDate, setScoreDate] = useState("");
  const [editingScoreId, setEditingScoreId] = useState(null);
  const [message, setMessage] = useState("");
  const [charityMessage, setCharityMessage] = useState("");
  const [subscriptionMessage, setSubscriptionMessage] = useState("");
  const [selectedCharityId, setSelectedCharityId] = useState("");
  const [selectedCharityName, setSelectedCharityName] = useState("");
  const [contributionInput, setContributionInput] = useState("10");
  const [subscriptionPlan, setSubscriptionPlan] = useState("monthly");
  const [subscriptionStatusInput, setSubscriptionStatusInput] = useState("active");
  const [renewalDateInput, setRenewalDateInput] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        router.push("/login");
        return;
      }

      const [
        profileResponse,
        scoresResponse,
        resultsResponse,
        charitiesResponse,
        subscriptionsResponse,
      ] =
        await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase
            .from("scores")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("results")
            .select("*, draws(numbers, created_at)")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase.from("charities").select("*").order("name", { ascending: true }),
          supabase
            .from("subscriptions")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1),
        ]);

      if (!isMounted) {
        return;
      }

      const nextProfile = profileResponse.data ?? null;
      const charityRows = charitiesResponse.error ? [] : (charitiesResponse.data ?? []);
      const nextSubscription = subscriptionsResponse.data?.[0] ?? null;

      setUserEmail(user.email ?? "");
      setProfile(nextProfile);
      setScores(scoresResponse.data ?? []);
      setResults(resultsResponse.data ?? []);
      setCharities(charityRows);
      setSubscription(nextSubscription);
      setSelectedCharityId(String(nextProfile?.charity_id ?? ""));
      setSelectedCharityName(
        nextProfile?.charity_name ?? nextProfile?.charity ?? "",
      );
      setContributionInput(
        String(
          nextProfile?.charity_percentage ??
            nextProfile?.contribution_percentage ??
            10,
        ),
      );
      setSubscriptionPlan(nextSubscription?.plan ?? "monthly");
      setSubscriptionStatusInput(nextSubscription?.status ?? "active");
      setRenewalDateInput(
        nextSubscription?.renewal_date
          ? new Date(nextSubscription.renewal_date).toISOString().slice(0, 10)
          : "",
      );

      if (charitiesResponse.error) {
        setCharityMessage(
          "Charity options table is not ready yet. You can still save a charity name to your profile.",
        );
      }

      setLoading(false);
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const refreshScores = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      return;
    }

    const { data } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setScores(data ?? []);
  };

  const refreshResults = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      return;
    }

    const { data } = await supabase
      .from("results")
      .select("*, draws(numbers, created_at)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setResults(data ?? []);
  };

  const refreshProfile = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    setProfile(data ?? null);
  };

  const refreshSubscription = async () => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      return;
    }

    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const nextSubscription = data?.[0] ?? null;
    setSubscription(nextSubscription);
  };

  const trimScoresToLatestFive = async (userId) => {
    const { data: updatedScores } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const safeScores = updatedScores ?? [];

    if (safeScores.length > 5) {
      const scoreIdsToDelete = safeScores.slice(5).map((score) => score.id);

      if (scoreIdsToDelete.length > 0) {
        await supabase.from("scores").delete().in("id", scoreIdsToDelete);
      }
    }
  };

  const saveScoreRecord = async (scorePayload, currentUserId) => {
    const payloadWithDate = {
      ...scorePayload,
      played_at: scoreDate || null,
    };

    const operation = editingScoreId
      ? supabase.from("scores").update(payloadWithDate).eq("id", editingScoreId)
      : supabase.from("scores").insert([payloadWithDate]);

    let { error } = await operation;

    if (error?.message?.toLowerCase().includes("played_at")) {
      const fallbackPayload = { ...scorePayload };

      const fallbackOperation = editingScoreId
        ? supabase
            .from("scores")
            .update(fallbackPayload)
            .eq("id", editingScoreId)
        : supabase.from("scores").insert([fallbackPayload]);

      const fallbackResult = await fallbackOperation;
      error = fallbackResult.error;

      if (!error) {
        setMessage(
          "Score saved, but your database still needs a score date column like played_at.",
        );
      }
    }

    if (!error && !editingScoreId) {
      await trimScoresToLatestFive(currentUserId);
    }

    return error;
  };

  const resetScoreForm = () => {
    setScoreValue("");
    setScoreDate("");
    setEditingScoreId(null);
  };

  const handleSaveScore = async () => {
    const numericScore = Number(scoreValue);

    if (!Number.isInteger(numericScore) || numericScore < 1 || numericScore > 45) {
      setMessage("Please enter a score between 1 and 45.");
      return;
    }

    setSavingScore(true);
    setMessage("");

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      setSavingScore(false);
      router.push("/login");
      return;
    }

    const error = await saveScoreRecord(
      {
        user_id: user.id,
        value: numericScore,
      },
      user.id,
    );

    if (error) {
      setSavingScore(false);
      setMessage(error.message);
      return;
    }

    await refreshScores();
    await refreshResults();
    setSavingScore(false);
    resetScoreForm();
    setMessage(
      editingScoreId
        ? "Score updated successfully."
        : "Score saved. Only your latest 5 scores are kept.",
    );
  };

  const handleEditScore = (score) => {
    setEditingScoreId(score.id);
    setScoreValue(String(score.value ?? ""));

    const dateValue = score.played_at ?? score.created_at;
    const parsed = dateValue ? new Date(dateValue) : null;

    if (parsed && !Number.isNaN(parsed.getTime())) {
      setScoreDate(parsed.toISOString().slice(0, 10));
    } else {
      setScoreDate("");
    }

    setMessage("Editing score. Update the fields and save your changes.");
  };

  const handleDeleteScore = async (scoreId) => {
    setDeletingScoreId(scoreId);
    setMessage("");

    const { error } = await supabase.from("scores").delete().eq("id", scoreId);

    if (error) {
      setDeletingScoreId(null);
      setMessage(error.message);
      return;
    }

    if (editingScoreId === scoreId) {
      resetScoreForm();
    }

    await refreshScores();
    setDeletingScoreId(null);
    setMessage("Score deleted successfully.");
  };

  const handleSaveCharity = async () => {
    const numericContribution = Number(contributionInput);

    if (
      !Number.isFinite(numericContribution) ||
      numericContribution < 10 ||
      numericContribution > 100
    ) {
      setCharityMessage("Please enter a contribution percentage between 10 and 100.");
      return;
    }

    setSavingCharity(true);
    setCharityMessage("");

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      setSavingCharity(false);
      router.push("/login");
      return;
    }

    const selectedCharity = charities.find(
      (charity) => String(charity.id) === selectedCharityId,
    );
    const fallbackCharityName = selectedCharity?.name ?? selectedCharityName.trim();
    const candidatePayloads = [
      {
        charity_id: selectedCharityId || null,
        charity_name: fallbackCharityName || null,
        charity_percentage: numericContribution,
        contribution_percentage: numericContribution,
      },
      {
        charity_name: fallbackCharityName || null,
        charity_percentage: numericContribution,
      },
      {
        charity_name: fallbackCharityName || null,
      },
      {
        contribution_percentage: numericContribution,
      },
    ];

    let saveSucceeded = false;
    let lastError = null;

    for (const payload of candidatePayloads) {
      const { error } = await supabase
        .from("profiles")
        .update(payload)
        .eq("id", user.id);

      if (!error) {
        saveSucceeded = true;
        lastError = null;
        break;
      }

      lastError = error;
    }

    if (!saveSucceeded) {
      setSavingCharity(false);
      setCharityMessage(
        "Your charity settings could not be saved because the profiles table is missing the needed columns. Add charity_name and contribution_percentage first.",
      );
      return;
    }

    await refreshProfile();
    setSavingCharity(false);
    setProfile((currentProfile) => ({
      ...currentProfile,
      charity_name:
        fallbackCharityName ||
        currentProfile?.charity_name ||
        currentProfile?.charity ||
        null,
      contribution_percentage:
        numericContribution,
      charity_percentage:
        numericContribution,
      charity_id:
        selectedCharityId || null,
    }));
    setCharityMessage(
      lastError
        ? "Charity preferences saved with a limited fallback because some profile columns are still missing."
        : "Charity preferences saved successfully.",
    );
  };

  const handleSaveSubscription = async () => {
    setSavingSubscription(true);
    setSubscriptionMessage("");

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      setSavingSubscription(false);
      router.push("/login");
      return;
    }

    const basePayload = {
      user_id: user.id,
      plan: subscriptionPlan,
      status: subscriptionStatusInput,
      renewal_date: renewalDateInput || null,
    };

    const candidatePayloads = [
      basePayload,
      {
        user_id: user.id,
        plan: subscriptionPlan,
        status: subscriptionStatusInput,
      },
      {
        user_id: user.id,
        plan: subscriptionPlan,
      },
    ];

    let saveSucceeded = false;
    let lastError = null;

    for (const payload of candidatePayloads) {
      const { error } = subscription?.id
        ? await supabase
            .from("subscriptions")
            .update(payload)
            .eq("id", subscription.id)
        : await supabase.from("subscriptions").insert([payload]);

      if (!error) {
        saveSucceeded = true;
        lastError = null;
        break;
      }

      lastError = error;
    }

    if (!saveSucceeded) {
      setSavingSubscription(false);
      setSubscriptionMessage(
        "Subscription could not be saved. Check that the subscriptions table includes user_id, plan, status, and optionally renewal_date.",
      );
      return;
    }

    await refreshSubscription();
    setSavingSubscription(false);
    setSubscription((currentSubscription) => ({
      ...currentSubscription,
      user_id: user.id,
      plan: subscriptionPlan,
      status: subscriptionStatusInput,
      renewal_date: renewalDateInput || null,
    }));
    setSubscriptionMessage(
      lastError
        ? "Subscription saved with a limited fallback because some columns are still missing."
        : "Subscription updated successfully.",
    );
  };

  const handleStartCheckout = async () => {
    setStartingCheckout(true);
    setSubscriptionMessage("");

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      setStartingCheckout(false);
      router.push("/login");
      return;
    }

    try {
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: subscriptionPlan,
          userId: user.id,
          customerEmail: user.email ?? userEmail,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.url) {
        setStartingCheckout(false);
        setSubscriptionMessage(
          payload.error ??
            "Stripe checkout could not be started. Check your Stripe environment variables.",
        );
        return;
      }

      window.location.href = payload.url;
    } catch {
      setStartingCheckout(false);
      setSubscriptionMessage(
        "Stripe checkout could not be started right now. Please try again.",
      );
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return <div className="p-10">Loading dashboard...</div>;
  }

  const totalWon = results.reduce(
    (sum, result) => sum + Number(result.prize ?? 0),
    0,
  );
  const paidResults = results.filter((result) => result.status === "paid").length;
  const linkedCharity = charities.find(
    (charity) => String(charity.id) === String(profile?.charity_id ?? selectedCharityId),
  );
  const charityName =
    linkedCharity?.name ??
    profile?.charity_name ??
    profile?.charity ??
    "No charity selected yet";
  const contributionRate =
    profile?.charity_percentage ?? profile?.contribution_percentage ?? 10;
  const subscriptionStatus = subscription?.status ?? "inactive";
  const subscriptionRenewalDate = formatDate(subscription?.renewal_date);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8f4ea_0%,#eef4fb_42%,#f8fafc_100%)] p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex justify-end gap-3">
          <button
            onClick={() => router.push("/admin")}
            className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm"
          >
            Open Admin
          </button>
          <button
            onClick={handleLogout}
            className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-sm"
          >
            Logout
          </button>
        </div>

        <section className="overflow-hidden rounded-[30px] border border-white/70 bg-slate-950 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
          <div className="bg-[linear-gradient(135deg,rgba(245,158,11,0.18),rgba(59,130,246,0.14),rgba(255,255,255,0.04))] p-8">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-slate-300">
                Subscriber Dashboard
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                Welcome back
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-300">
                Manage your subscription, scores, charity contribution, and
                monthly winnings from one dashboard.
              </p>
              <p className="mt-4 text-sm text-slate-400">Signed in as {userEmail}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-5 shadow-sm backdrop-blur">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Latest Scores Stored
            </p>
            <p className="mt-3 text-4xl font-semibold text-slate-900">
              {scores.length}/5
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-5 shadow-sm backdrop-blur">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Draw Entries
            </p>
            <p className="mt-3 text-4xl font-semibold text-slate-900">
              {results.length}
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-5 shadow-sm backdrop-blur">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Total Won
            </p>
            <p className="mt-3 text-4xl font-semibold text-slate-900">
              ${totalWon.toFixed(2)}
            </p>
          </div>

          <div className="rounded-[24px] border border-slate-200/70 bg-white/90 p-5 shadow-sm backdrop-blur">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Paid Results
            </p>
            <p className="mt-3 text-4xl font-semibold text-slate-900">
              {paidResults}
            </p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[30px] border border-slate-200/70 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                  Score Management
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Latest 5 Scores
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Enter one stableford score at a time. The app keeps only your
                  most recent 5 scores.
                </p>
              </div>
              <div className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
                Range 1-45
              </div>
            </div>

            <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_1fr_auto_auto]">
              <input
                type="number"
                min="1"
                max="45"
                value={scoreValue}
                onChange={(event) => setScoreValue(event.target.value)}
                placeholder="Enter score"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              />
              <input
                type="date"
                value={scoreDate}
                onChange={(event) => setScoreDate(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              />
              <button
                onClick={handleSaveScore}
                disabled={savingScore}
                className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {savingScore
                  ? "Saving..."
                  : editingScoreId
                    ? "Update Score"
                    : "Save Score"}
              </button>
              {editingScoreId && (
                <button
                  onClick={resetScoreForm}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700"
                >
                  Cancel
                </button>
              )}
            </div>

            {message && (
              <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {message}
              </p>
            )}

            <div className="mt-8 space-y-3">
                {scores.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
                    No scores added yet. Add your first score to get started.
                  </div>
                ) : (
                  scores.map((score, index) => (
                    <div
                      key={score.id ?? `${score.value}-${index}`}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                          Score #{index + 1}
                        </p>
                          <p className="mt-2 text-2xl font-semibold text-slate-900">
                          {score.value}
                        </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500">
                          {formatDate(score.played_at ?? score.created_at)}
                        </p>
                          <div className="mt-3 flex flex-wrap justify-end gap-2">
                          <button
                            onClick={() => handleEditScore(score)}
                            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteScore(score.id)}
                            disabled={deletingScoreId === score.id}
                            className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm text-red-600 disabled:opacity-60"
                          >
                            {deletingScoreId === score.id ? "Deleting..." : "Delete"}
                          </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-[30px] border border-slate-200/70 bg-white/90 p-6 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Subscription Status
              </p>
              <div className="mt-3 flex items-center gap-3">
                <h2 className="text-2xl font-semibold text-slate-900">
                  Membership
                </h2>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${getSubscriptionBadgeClass(
                    subscriptionStatus,
                  )}`}
                >
                  {subscriptionStatus}
                </span>
              </div>
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                <p className="text-sm font-medium text-emerald-900">
                  Real payment checkout
                </p>
                <p className="mt-1 text-sm text-emerald-800">
                  Use Stripe Checkout for the selected plan. After a successful
                  payment, this dashboard can mark your subscription active.
                </p>
                <button
                  onClick={handleStartCheckout}
                  disabled={startingCheckout}
                  className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                >
                  {startingCheckout
                    ? "Redirecting to Stripe..."
                    : `Checkout ${subscriptionPlan === "yearly" ? "Yearly" : "Monthly"} Plan`}
                </button>
              </div>
              <div className="mt-4 grid gap-3">
                <select
                  value={subscriptionPlan}
                  onChange={(event) => setSubscriptionPlan(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                >
                  <option value="monthly">Monthly Plan</option>
                  <option value="yearly">Yearly Plan</option>
                </select>

                <select
                  value={subscriptionStatusInput}
                  onChange={(event) => setSubscriptionStatusInput(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="lapsed">Lapsed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <input
                  type="date"
                  value={renewalDateInput}
                  onChange={(event) => setRenewalDateInput(event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                />

                <button
                  onClick={handleSaveSubscription}
                  disabled={savingSubscription}
                  className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-medium text-slate-950 disabled:opacity-60"
                >
                  {savingSubscription ? "Saving..." : "Save Subscription"}
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Plan
                  </p>
                  <p className="mt-2 text-lg font-medium text-slate-900">
                    {subscription?.plan ?? "No plan selected yet"}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Status
                  </p>
                  <p className="mt-2 text-lg font-medium capitalize text-slate-900">
                    {subscriptionStatus}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Renewal
                  </p>
                  <p className="mt-2 text-lg font-medium text-slate-900">
                    {subscriptionRenewalDate}
                  </p>
                </div>
              </div>
              {subscriptionMessage && (
                <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {subscriptionMessage}
                </p>
              )}
            </section>

            <section className="rounded-[30px] border border-slate-200/70 bg-white/90 p-6 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Charity Settings
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Choose Your Cause
              </h2>
              <div className="mt-4 space-y-3">
                {charities.length > 0 ? (
                  <select
                    value={selectedCharityId}
                    onChange={(event) => {
                      const nextId = event.target.value;
                      const nextCharity = charities.find(
                        (charity) => String(charity.id) === nextId,
                      );
                      setSelectedCharityId(nextId);
                      setSelectedCharityName(nextCharity?.name ?? "");
                    }}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                  >
                    <option value="">Select a charity</option>
                    {charities.map((charity) => (
                      <option key={charity.id} value={charity.id}>
                        {charity.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={selectedCharityName}
                    onChange={(event) => setSelectedCharityName(event.target.value)}
                    placeholder="Enter charity name"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                  />
                )}

                <input
                  type="number"
                  min="10"
                  max="100"
                  value={contributionInput}
                  onChange={(event) => setContributionInput(event.target.value)}
                  placeholder="Contribution percentage"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700"
                />

                <button
                  onClick={handleSaveCharity}
                  disabled={savingCharity}
                  className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
                >
                  {savingCharity ? "Saving..." : "Save Charity Preferences"}
                </button>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Selected Charity
                  </p>
                  <p className="mt-2 text-lg font-medium text-slate-900">
                    {charityName}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                    Contribution Rate
                  </p>
                  <p className="mt-2 text-lg font-medium text-slate-900">
                    {contributionRate}%
                  </p>
                </div>
              </div>
              {charityMessage && (
                <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {charityMessage}
                </p>
              )}
            </section>

            <section className="rounded-[30px] border border-slate-200/70 bg-white/90 p-6 shadow-sm backdrop-blur">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                Winnings Overview
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Recent Results
              </h2>
              <div className="mt-4 space-y-3">
                {results.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
                    No winnings yet. Once you qualify in a draw, your results
                    will appear here.
                  </div>
                ) : (
                  results.slice(0, 5).map((result) => (
                    <div
                      key={result.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4"
                    >
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        Draw {formatDate(result.draws?.created_at ?? result.created_at)}
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        Numbers: {result.draws?.numbers?.join(", ") ?? "N/A"}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                        <span>Match count: {result.match_count}</span>
                        <span>Prize: ${Number(result.prize ?? 0).toFixed(2)}</span>
                        <span className="capitalize">
                          Status: {result.status ?? "pending"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
