"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function getStatusBadgeClass(status) {
  if (status === "approved") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "rejected") {
    return "bg-red-100 text-red-700";
  }

  if (status === "paid") {
    return "bg-violet-100 text-violet-700";
  }

  return "bg-slate-100 text-slate-700";
}

export default function Admin() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [isRunningDraw, setIsRunningDraw] = useState(false);
  const [isSimulatingDraw, setIsSimulatingDraw] = useState(false);
  const [isSavingCharity, setIsSavingCharity] = useState(false);
  const [updatingSubscriptionId, setUpdatingSubscriptionId] = useState(null);
  const [deletingCharityId, setDeletingCharityId] = useState(null);
  const [drawNumbers, setDrawNumbers] = useState([]);
  const [results, setResults] = useState([]);
  const [draws, setDraws] = useState([]);
  const [charities, setCharities] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [simulationNumbers, setSimulationNumbers] = useState([]);
  const [simulationSummary, setSimulationSummary] = useState(null);
  const [charityName, setCharityName] = useState("");
  const [charityDescription, setCharityDescription] = useState("");
  const [editingCharityId, setEditingCharityId] = useState(null);
  const [charityMessage, setCharityMessage] = useState("");
  const [subscriptionMessage, setSubscriptionMessage] = useState("");
  const [drawMessage, setDrawMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadAdminPage() {
      const [
        { data: userData },
        resultsResponse,
        drawsResponse,
        charitiesResponse,
        subscriptionsResponse,
        profilesResponse,
      ] =
        await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from("results")
            .select("*, profiles(email), draws(numbers)")
            .order("created_at", { ascending: false }),
          supabase.from("draws").select("*").order("created_at", {
            ascending: false,
          }),
          supabase.from("charities").select("*").order("name", { ascending: true }),
          supabase
            .from("subscriptions")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase.from("profiles").select("id, email"),
        ]);

      const user = userData.user;

      if (!user) {
        router.push("/login");
        if (isMounted) {
          setIsCheckingAccess(false);
        }
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single();

      if (!isMounted) {
        return;
      }

      setResults(resultsResponse.data ?? []);
      setDraws(drawsResponse.data ?? []);
      setCharities(charitiesResponse.data ?? []);
      setSubscriptions(subscriptionsResponse.data ?? []);
      setProfiles(profilesResponse.data ?? []);

      if (!profile?.is_admin) {
        setIsCheckingAccess(false);
        router.push("/dashboard");
        return;
      }

      setIsAdmin(true);
      setIsCheckingAccess(false);
    }

    loadAdminPage();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function fetchResults() {
    const { data } = await supabase
      .from("results")
      .select("*, profiles(email), draws(numbers)")
      .order("created_at", { ascending: false });

    setResults(data ?? []);
  }

  async function fetchDraws() {
    const { data } = await supabase
      .from("draws")
      .select("*")
      .order("created_at", { ascending: false });

    setDraws(data ?? []);
  }

  async function fetchCharities() {
    const { data } = await supabase
      .from("charities")
      .select("*")
      .order("name", { ascending: true });

    setCharities(data ?? []);
  }

  async function fetchSubscriptions() {
    const [subscriptionsResponse, profilesResponse] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, email"),
    ]);

    setSubscriptions(subscriptionsResponse.data ?? []);
    setProfiles(profilesResponse.data ?? []);
  }

  function generateDrawNumbers() {
    const generatedNumbers = [];

    while (generatedNumbers.length < 5) {
      const nextNumber = Math.floor(Math.random() * 45) + 1;
      if (!generatedNumbers.includes(nextNumber)) {
        generatedNumbers.push(nextNumber);
      }
    }

    return generatedNumbers.sort((a, b) => a - b);
  }

  async function buildSimulationSummary(numbers) {
    const { data: users } = await supabase.from("profiles").select("*");

    let match3 = 0;
    let match4 = 0;
    let match5 = 0;

    for (const user of users ?? []) {
      const { data: scores } = await supabase
        .from("scores")
        .select("value")
        .eq("user_id", user.id);

      const userScores = (scores ?? []).map((score) => score.value);
      const matchCount = userScores.filter((score) => numbers.includes(score)).length;

      if (matchCount === 3) {
        match3 += 1;
      }

      if (matchCount === 4) {
        match4 += 1;
      }

      if (matchCount === 5) {
        match5 += 1;
      }
    }

    return {
      totalUsers: (users ?? []).length,
      match3,
      match4,
      match5,
    };
  }

  async function executeDraw(numbers) {
    const TOTAL_POOL = 1000;

    setDrawNumbers(numbers);

    const { data: drawData } = await supabase
      .from("draws")
      .insert([{ numbers }])
      .select()
      .single();

    if (!drawData) {
      alert("Failed to create draw.");
      return false;
    }

    const drawId = drawData.id;
    const { data: users } = await supabase.from("profiles").select("*");

    for (const user of users ?? []) {
      const { data: scores } = await supabase
        .from("scores")
        .select("value")
        .eq("user_id", user.id);

      const userScores = (scores ?? []).map((score) => score.value);
      const matchCount = userScores.filter((score) => numbers.includes(score)).length;

      if (matchCount >= 3) {
        await supabase.from("results").insert([
          {
            user_id: user.id,
            draw_id: drawId,
            match_count: matchCount,
            prize: 0,
          },
        ]);
      }
    }

    const { data: winners } = await supabase
      .from("results")
      .select("*")
      .eq("draw_id", drawId);

    const winnerRows = winners ?? [];
    const match3 = winnerRows.filter((winner) => winner.match_count === 3);
    const match4 = winnerRows.filter((winner) => winner.match_count === 4);
    const match5 = winnerRows.filter((winner) => winner.match_count === 5);

    const pool3 = TOTAL_POOL * 0.25;
    const pool4 = TOTAL_POOL * 0.35;
    let pool5 = TOTAL_POOL * 0.4;

    if (match5.length === 0) {
      pool5 = 0;
    }

    const distributePrize = async (winnersArray, pool) => {
      if (winnersArray.length === 0) return;

      const prizePerUser = pool / winnersArray.length;

      for (const winner of winnersArray) {
        await supabase
          .from("results")
          .update({ prize: prizePerUser })
          .eq("id", winner.id);
      }
    };

    await distributePrize(match3, pool3);
    await distributePrize(match4, pool4);
    await distributePrize(match5, pool5);

    return true;
  }

  const simulateDraw = async () => {
    setIsSimulatingDraw(true);
    setDrawMessage("");

    const numbers = generateDrawNumbers();
    const summary = await buildSimulationSummary(numbers);

    setSimulationNumbers(numbers);
    setSimulationSummary(summary);
    setIsSimulatingDraw(false);
    setDrawMessage("Preview ready. Review the numbers and confirm when you want to publish.");
  };

  const runDraw = async () => {
    const numbers = simulationNumbers.length > 0 ? simulationNumbers : generateDrawNumbers();

    setIsRunningDraw(true);
    setDrawMessage("");

    const success = await executeDraw(numbers);

    setIsRunningDraw(false);

    if (!success) {
      setDrawMessage("Failed to create draw.");
      return;
    }

    setSimulationNumbers([]);
    setSimulationSummary(null);
    setDrawMessage("Draw completed and prizes distributed.");
    fetchResults();
    fetchDraws();
  };

  const updateStatus = async (id, newStatus) => {
    await supabase.from("results").update({ status: newStatus }).eq("id", id);
    fetchResults();
  };

  const resetCharityForm = () => {
    setCharityName("");
    setCharityDescription("");
    setEditingCharityId(null);
  };

  const handleSaveCharity = async () => {
    if (!charityName.trim()) {
      setCharityMessage("Please enter a charity name.");
      return;
    }

    setIsSavingCharity(true);
    setCharityMessage("");

    const payload = {
      name: charityName.trim(),
      description: charityDescription.trim(),
    };

    const { error } = editingCharityId
      ? await supabase.from("charities").update(payload).eq("id", editingCharityId)
      : await supabase.from("charities").insert([payload]);

    if (error) {
      setIsSavingCharity(false);
      setCharityMessage(error.message);
      return;
    }

    await fetchCharities();
    setIsSavingCharity(false);
    resetCharityForm();
    setCharityMessage(
      editingCharityId
        ? "Charity updated successfully."
        : "Charity added successfully.",
    );
  };

  const handleEditCharity = (charity) => {
    setEditingCharityId(charity.id);
    setCharityName(charity.name ?? "");
    setCharityDescription(charity.description ?? "");
    setCharityMessage("Editing charity. Update the fields and save changes.");
  };

  const handleDeleteCharity = async (charityId) => {
    setDeletingCharityId(charityId);
    setCharityMessage("");

    const { error } = await supabase.from("charities").delete().eq("id", charityId);

    if (error) {
      setDeletingCharityId(null);
      setCharityMessage(error.message);
      return;
    }

    if (editingCharityId === charityId) {
      resetCharityForm();
    }

    await fetchCharities();
    setDeletingCharityId(null);
    setCharityMessage("Charity deleted successfully.");
  };

  const handleUpdateSubscriptionStatus = async (subscriptionId, nextStatus) => {
    setUpdatingSubscriptionId(subscriptionId);
    setSubscriptionMessage("");

    const { error } = await supabase
      .from("subscriptions")
      .update({ status: nextStatus })
      .eq("id", subscriptionId);

    if (error) {
      setUpdatingSubscriptionId(null);
      setSubscriptionMessage(error.message);
      return;
    }

    await fetchSubscriptions();
    setUpdatingSubscriptionId(null);
    setSubscriptionMessage("Subscription status updated successfully.");
  };

  if (isCheckingAccess) {
    return <div className="p-10">Checking admin access...</div>;
  }

  if (!isAdmin) {
    return <div className="p-10">Redirecting...</div>;
  }

  const totalPrizePayout = results.reduce(
    (sum, result) => sum + Number(result.prize ?? 0),
    0,
  );
  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === "active",
  ).length;
  const lapsedSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === "lapsed",
  ).length;
  const cancelledSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === "cancelled",
  ).length;
  const charityContributionTotal = profiles.reduce((sum, profile) => {
    const contribution =
      Number(
        profile?.charity_percentage ?? profile?.contribution_percentage ?? 0,
      ) || 0;

    return sum + contribution;
  }, 0);
  const approvedWinners = results.filter(
    (result) => result.status === "approved",
  ).length;
  const rejectedWinners = results.filter(
    (result) => result.status === "rejected",
  ).length;
  const paidWinners = results.filter((result) => result.status === "paid").length;
  const latestDrawDate = draws[0]?.created_at
    ? new Date(draws[0].created_at).toLocaleDateString()
    : "No draw yet";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f7f4ea,_#eef4ff_45%,_#e7edf8)] p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-white/70 bg-slate-950 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
          <div className="bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(59,130,246,0.12),rgba(255,255,255,0.03))] p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-300">
                  Operations Console
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                  Admin Panel
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-300">
                  Run monthly draws, manage charities, review subscriptions, and
                  handle winner approvals from one place.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Total Users
                  </p>
                  <p className="mt-2 text-3xl font-semibold">{profiles.length}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Total Payout
                  </p>
                  <p className="mt-2 text-3xl font-semibold">
                    ${totalPrizePayout.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    Active Subs
                  </p>
                  <p className="mt-2 text-3xl font-semibold">{activeSubscriptions}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Reports And Analytics
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Platform Snapshot
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                A quick read on user activity, subscriptions, draws, and winner
                outcomes.
              </p>
            </div>
            <p className="text-sm text-slate-500">Latest draw: {latestDrawDate}</p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Charities Listed
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {charities.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Avg Charity %
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {profiles.length > 0
                  ? `${(charityContributionTotal / profiles.length).toFixed(1)}%`
                  : "0%"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Draws Completed
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {draws.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Winner Records
              </p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">
                {results.length}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5">
              <p className="text-sm font-medium text-slate-900">
                Subscription Breakdown
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Active</span>
                  <span className="font-medium text-slate-900">
                    {activeSubscriptions}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Lapsed</span>
                  <span className="font-medium text-slate-900">
                    {lapsedSubscriptions}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cancelled</span>
                  <span className="font-medium text-slate-900">
                    {cancelledSubscriptions}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5">
              <p className="text-sm font-medium text-slate-900">
                Winner Status Breakdown
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Approved</span>
                  <span className="font-medium text-slate-900">
                    {approvedWinners}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Rejected</span>
                  <span className="font-medium text-slate-900">
                    {rejectedWinners}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Paid</span>
                  <span className="font-medium text-slate-900">
                    {paidWinners}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5">
              <p className="text-sm font-medium text-slate-900">
                Draw Health
              </p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Latest Preview Ready</span>
                  <span className="font-medium text-slate-900">
                    {simulationNumbers.length > 0 ? "Yes" : "No"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Preview 5-Matches</span>
                  <span className="font-medium text-slate-900">
                    {simulationSummary?.match5 ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Total Prize Payout</span>
                  <span className="font-medium text-slate-900">
                    ${totalPrizePayout.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Draw Control
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                Monthly Draw Actions
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Preview numbers first, then confirm the same set when you are ready
                to publish the real draw.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={simulateDraw}
                disabled={isSimulatingDraw || isRunningDraw}
                className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {isSimulatingDraw ? "Generating Preview..." : "Preview Draw"}
              </button>

              <button
                onClick={runDraw}
                disabled={isRunningDraw || isSimulatingDraw}
                className="rounded-full bg-rose-500 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
              >
                {isRunningDraw
                  ? "Publishing Draw..."
                  : simulationNumbers.length > 0
                    ? "Confirm And Run Draw"
                    : "Run Monthly Draw"}
              </button>
            </div>
          </div>

          {drawMessage && (
            <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {drawMessage}
            </p>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Latest Draw
              </p>
              <p className="mt-3 text-xl font-semibold text-slate-900">
                {drawNumbers.length > 0 ? drawNumbers.join(", ") : "No draw yet"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Saved Draws
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {draws.length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Pending Winners
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {
                  results.filter((result) =>
                    !["approved", "rejected", "paid"].includes(result.status),
                  ).length
                }
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Paid Winners
              </p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">
                {results.filter((result) => result.status === "paid").length}
              </p>
            </div>
          </div>
        </section>

        {simulationNumbers.length > 0 && simulationSummary && (
          <section className="rounded-[28px] border border-amber-200/70 bg-[linear-gradient(135deg,#fff7ed,#ffffff)] p-6 shadow-sm">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-amber-700">
                  Preview Ready
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Draw Preview
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Preview numbers: {simulationNumbers.join(", ")}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-amber-100 bg-white px-5 py-4">
                <p className="text-sm text-slate-500">Users Checked</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {simulationSummary.totalUsers}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-white px-5 py-4">
                <p className="text-sm text-slate-500">Estimated 3 Matches</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {simulationSummary.match3}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-white px-5 py-4">
                <p className="text-sm text-slate-500">Estimated 4 Matches</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {simulationSummary.match4}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-100 bg-white px-5 py-4">
                <p className="text-sm text-slate-500">Estimated 5 Matches</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">
                  {simulationSummary.match5}
                </p>
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  Charity Management
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                  Manage Charities
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <input
                type="text"
                value={charityName}
                onChange={(event) => setCharityName(event.target.value)}
                placeholder="Charity name"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              />
              <textarea
                value={charityDescription}
                onChange={(event) => setCharityDescription(event.target.value)}
                placeholder="Charity description"
                rows={4}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none"
              />
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSaveCharity}
                  disabled={isSavingCharity}
                  className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-60"
                >
                  {isSavingCharity
                    ? "Saving..."
                    : editingCharityId
                      ? "Update Charity"
                      : "Add Charity"}
                </button>
                {editingCharityId && (
                  <button
                    onClick={resetCharityForm}
                    className="rounded-full border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
              {charityMessage && (
                <p className="text-sm text-slate-600">{charityMessage}</p>
              )}
            </div>

            <div className="mt-6 space-y-3">
              {charities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  No charities added yet.
                </div>
              ) : (
                charities.map((charity) => (
                  <div
                    key={charity.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-lg font-medium text-slate-900">
                          {charity.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {charity.description || "No description added."}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCharity(charity)}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCharity(charity.id)}
                          disabled={deletingCharityId === charity.id}
                          className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm text-red-600 disabled:opacity-60"
                        >
                          {deletingCharityId === charity.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-sm backdrop-blur">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Subscription Management
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Review Subscriber Plans
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Review subscriber plans and update their current subscription
              status.
            </p>

            {subscriptionMessage && (
              <p className="mt-4 text-sm text-slate-600">{subscriptionMessage}</p>
            )}

            <div className="mt-6 space-y-3">
              {subscriptions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  No subscriptions found yet.
                </div>
              ) : (
                subscriptions.map((subscription) => {
                  const profile = profiles.find(
                    (entry) => entry.id === subscription.user_id,
                  );

                  return (
                    <div
                      key={subscription.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4"
                    >
                      <p className="text-sm text-slate-500">
                        {profile?.email ?? "Unknown user"}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <p className="text-lg font-medium capitalize text-slate-900">
                          {subscription.plan ?? "No plan"}
                        </p>
                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-white">
                          {subscription.status ?? "unknown"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        Renewal:{" "}
                        {subscription.renewal_date
                          ? new Date(subscription.renewal_date).toLocaleDateString()
                          : "Not set"}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {["active", "lapsed", "cancelled"].map((status) => (
                          <button
                            key={status}
                            onClick={() =>
                              handleUpdateSubscriptionStatus(subscription.id, status)
                            }
                            disabled={updatingSubscriptionId === subscription.id}
                            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm capitalize disabled:opacity-60"
                          >
                            {updatingSubscriptionId === subscription.id
                              ? "Updating..."
                              : `Mark ${status}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-sm backdrop-blur">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Draw History
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              All Draws
            </h2>

            <div className="mt-6 space-y-3">
              {draws.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  No draws have been saved yet.
                </div>
              ) : (
                draws.map((draw) => (
                  <div
                    key={draw.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-4"
                  >
                    <p className="text-sm text-slate-500">
                      {new Date(draw.created_at).toLocaleString()}
                    </p>
                    <p className="mt-2 text-lg font-medium text-slate-900">
                      {draw.numbers.join(", ")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200/70 bg-white/90 p-6 shadow-sm backdrop-blur">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Winner Verification
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">
              Winners
            </h2>

            <div className="mt-6 space-y-4">
              {results.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                  No winners found yet.
                </div>
              ) : (
                results.map((result) => (
                  <div
                    key={result.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <p className="text-sm text-slate-500">
                          {result.profiles?.email ?? "Unknown"}
                        </p>
                        <p className="text-lg font-medium text-slate-900">
                          Draw Numbers: {result.draws?.numbers?.join(", ") ?? "N/A"}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                          <span>Match Count: {result.match_count}</span>
                          <span>Prize: ${result.prize}</span>
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-3 lg:items-end">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${getStatusBadgeClass(
                            result.status,
                          )}`}
                        >
                          {result.status ?? "pending"}
                        </span>

                        {result.proof_url && (
                          <a
                            href={result.proof_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-blue-600"
                          >
                            View Proof
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={() => updateStatus(result.id, "approved")}
                        className="rounded-full bg-emerald-500 px-4 py-2 text-sm text-white"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => updateStatus(result.id, "rejected")}
                        className="rounded-full bg-red-500 px-4 py-2 text-sm text-white"
                      >
                        Reject
                      </button>

                      <button
                        onClick={() => updateStatus(result.id, "paid")}
                        className="rounded-full bg-violet-500 px-4 py-2 text-sm text-white"
                      >
                        Mark Paid
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
