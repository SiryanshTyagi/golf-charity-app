import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createClient(url, anonKey);
}

export async function POST(request) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY." },
        { status: 500 },
      );
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId." },
        { status: 400 },
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const isPaid =
      session.status === "complete" || session.payment_status === "paid";

    if (!isPaid) {
      return NextResponse.json(
        { error: "Checkout session is not paid yet." },
        { status: 400 },
      );
    }

    const userId =
      session.metadata?.userId || session.client_reference_id || null;
    const plan = session.metadata?.plan || "monthly";

    if (!userId) {
      return NextResponse.json(
        { error: "Stripe session is missing a user reference." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase environment variables are missing." },
        { status: 500 },
      );
    }

    const subscriptionPayload = {
      user_id: userId,
      plan,
      status: "active",
    };

    const { data: existingSubscriptions, error: loadError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    if (loadError) {
      return NextResponse.json(
        { error: loadError.message },
        { status: 500 },
      );
    }

    const existingSubscription = existingSubscriptions?.[0] ?? null;
    const { error: saveError } = existingSubscription?.id
      ? await supabase
          .from("subscriptions")
          .update(subscriptionPayload)
          .eq("id", existingSubscription.id)
      : await supabase.from("subscriptions").insert([subscriptionPayload]);

    if (saveError) {
      return NextResponse.json(
        { error: saveError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error?.message ??
          "Stripe checkout session could not be confirmed.",
      },
      { status: 500 },
    );
  }
}
