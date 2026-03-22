import { NextResponse } from "next/server";
import Stripe from "stripe";

function getPriceId(plan) {
  if (plan === "yearly") {
    return process.env.STRIPE_YEARLY_PRICE_ID;
  }

  return process.env.STRIPE_MONTHLY_PRICE_ID;
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

    const { plan, userId, customerEmail } = await request.json();
    const priceId = getPriceId(plan);

    if (!priceId) {
      return NextResponse.json(
        {
          error:
            "Missing Stripe price ID. Add STRIPE_MONTHLY_PRICE_ID and STRIPE_YEARLY_PRICE_ID.",
        },
        { status: 500 },
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const origin = request.nextUrl.origin;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: customerEmail || undefined,
      client_reference_id: userId || undefined,
      metadata: {
        plan: plan || "monthly",
        userId: userId || "",
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error?.message ??
          "Stripe checkout session could not be created.",
      },
      { status: 500 },
    );
  }
}
