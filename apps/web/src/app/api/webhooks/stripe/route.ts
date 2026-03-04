import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { isPaidMenuPackage, type PaidMenuPackage } from "@/lib/menu-packages";
import type { MenuPackage } from "@/types/menu";

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
      const paymentIntent =
        typeof session.payment_intent === "string" ? session.payment_intent : "";
      await handleCreditPurchase(supabase, metadata, paymentIntent);
    } else if (metadata.type === "menu_package") {
      await handleMenuPackage(supabase, metadata, session);
    } else if (metadata.type === "menu_order") {
      await handleMenuOrderLegacy(supabase, metadata, session);
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
  const credits = Number.parseInt(metadata.credits, 10);

  if (!userId || !credits) {
    console.error("Missing credit purchase metadata", metadata);
    return;
  }

  const { data, error } = await supabase.rpc("add_credits", {
    p_user_id: userId,
    p_amount: credits,
    p_stripe_pi: paymentIntent || null,
  });

  if (error) {
    console.error("Failed to add credits:", error);
  } else {
    console.log(
      `Added ${credits} credits to user ${userId}. New balance: ${data}`,
    );
  }
}

async function handleMenuPackage(
  supabase: SupabaseClient,
  metadata: Record<string, string>,
  session: Stripe.Checkout.Session,
) {
  const userId = metadata.user_id;
  const menuId = metadata.menu_id;
  const packageTypeRaw = metadata.package_type;

  if (!userId || !menuId || !packageTypeRaw || !isPaidMenuPackage(packageTypeRaw)) {
    console.error("Missing/invalid menu package metadata", metadata);
    return;
  }

  const packageType = packageTypeRaw as PaidMenuPackage;
  const orderState = await markOrderPaid(
    supabase,
    session.id,
    packageType,
  );

  if (orderState === "missing_order" || orderState === "failed") {
    return;
  }

  const { data: menu } = await supabase
    .from("menus")
    .select("status, output_package")
    .eq("id", menuId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!menu) {
    console.error(`Menu not found for paid package: menu=${menuId} user=${userId}`);
    return;
  }

  const payload: {
    digital_unlocked: boolean;
    output_package?: MenuPackage;
    status?: string;
  } = {
    digital_unlocked: true,
  };

  if (packageType === "pro") {
    payload.output_package = "pro";
    payload.status = "paid";
  } else {
    if (menu.output_package !== "pro") {
      payload.output_package = "digital";
    }
    if (menu.status === "samples_ready") {
      payload.status = "sample_selected";
    }
  }

  const { error: menuError } = await supabase
    .from("menus")
    .update(payload)
    .eq("id", menuId)
    .eq("user_id", userId);

  if (menuError) {
    console.error("Failed to update menu package state:", menuError);
    return;
  }

  console.log(
    `Menu package paid: menu=${menuId}, user=${userId}, package=${packageType}`,
  );
}

async function handleMenuOrderLegacy(
  supabase: SupabaseClient,
  metadata: Record<string, string>,
  session: Stripe.Checkout.Session,
) {
  await handleMenuPackage(
    supabase,
    {
      ...metadata,
      type: "menu_package",
      package_type: "pro",
    },
    session,
  );
}

async function markOrderPaid(
  supabase: SupabaseClient,
  stripeSessionId: string,
  packageType: PaidMenuPackage,
) {
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("id, status")
    .eq("stripe_session_id", stripeSessionId)
    .maybeSingle();

  if (!existingOrder) {
    console.error(`Order not found for stripe session ${stripeSessionId}`);
    return "missing_order";
  }

  if (existingOrder.status === "paid") {
    return "already_paid";
  }

  const { error } = await supabase
    .from("orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      package_type: packageType,
    })
    .eq("id", existingOrder.id);

  if (error) {
    console.error("Failed to mark order as paid:", error);
    return "failed";
  }

  return "paid";
}
