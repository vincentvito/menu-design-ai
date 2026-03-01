import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const supabase = getSupabase();

  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata;

    if (!metadata) {
      return NextResponse.json({ received: true });
    }

    if (metadata.type === "credit_purchase") {
      await handleCreditPurchase(supabase, metadata, session.payment_intent as string);
    } else if (metadata.type === "menu_order") {
      await handleMenuOrder(supabase, metadata, session);
    }
  }

  return NextResponse.json({ received: true });
}

async function handleCreditPurchase(
  supabase: SupabaseClient,
  metadata: Record<string, string>,
  paymentIntent: string,
) {
  const userId = metadata.user_id;
  const credits = parseInt(metadata.credits, 10);

  if (!userId || !credits) {
    console.error("Missing credit purchase metadata", metadata);
    return;
  }

  const { data, error } = await supabase.rpc("add_credits", {
    p_user_id: userId,
    p_amount: credits,
    p_stripe_pi: paymentIntent,
  });

  if (error) {
    console.error("Failed to add credits:", error);
  } else {
    console.log(
      `Added ${credits} credits to user ${userId}. New balance: ${data}`,
    );
  }
}

async function handleMenuOrder(
  supabase: SupabaseClient,
  metadata: Record<string, string>,
  session: Stripe.Checkout.Session,
) {
  const userId = metadata.user_id;
  const menuId = metadata.menu_id;

  if (!userId || !menuId) {
    console.error("Missing menu order metadata", metadata);
    return;
  }

  await supabase
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("stripe_session_id", session.id);

  await supabase
    .from("menus")
    .update({ status: "paid" })
    .eq("id", menuId)
    .eq("user_id", userId);

  console.log(`Menu order paid: menu=${menuId}, user=${userId}`);
}
