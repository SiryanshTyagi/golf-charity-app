"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function CharitiesPage() {
  const router = useRouter();
  const [charities, setCharities] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCharities() {
      const { data } = await supabase
        .from("charities")
        .select("*")
        .order("name", { ascending: true });

      if (!isMounted) {
        return;
      }

      setCharities(data ?? []);
      setLoading(false);
    }

    loadCharities();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCharities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return charities;
    }

    return charities.filter((charity) => {
      const name = String(charity.name ?? "").toLowerCase();
      const description = String(charity.description ?? "").toLowerCase();

      return (
        name.includes(normalizedQuery) || description.includes(normalizedQuery)
      );
    });
  }, [charities, query]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8f4ea_0%,#eef4fb_42%,#f8fafc_100%)] px-6 py-10 md:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-[32px] border border-slate-200/70 bg-white/92 p-8 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                Charity Directory
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                Explore the causes behind the platform
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                Every subscriber can choose a charity to support. This public
                directory gives visitors a quick look at the causes currently
                available inside the platform.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/")}
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700"
              >
                Back to Home
              </button>
              <button
                onClick={() => router.push("/signup")}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white"
              >
                Join the Platform
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200/70 bg-white/92 p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Search charities by name or description
              </p>
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search charities"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none lg:max-w-sm"
            />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <div className="rounded-[28px] border border-slate-200 bg-white/90 px-6 py-8 text-sm text-slate-500">
              Loading charities...
            </div>
          ) : filteredCharities.length === 0 ? (
            <div className="rounded-[28px] border border-slate-200 bg-white/90 px-6 py-8 text-sm text-slate-500">
              No charities matched your search.
            </div>
          ) : (
            filteredCharities.map((charity) => (
              <article
                key={charity.id}
                className="rounded-[28px] border border-slate-200 bg-white/92 p-6 shadow-sm"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Listed Charity
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {charity.name}
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {charity.description || "Description coming soon."}
                </p>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
