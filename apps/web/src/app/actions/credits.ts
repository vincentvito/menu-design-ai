"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function getCreditsBalance(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("user_credits")
    .select("balance")
    .eq("user_id", user.id)
    .single();

  return data?.balance ?? 0;
}

export async function createCheckoutSession(packageId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load the credit package
  const { data: pkg } = await supabase
    .from("credit_packages")
    .select("*")
    .eq("id", packageId)
    .eq("is_active", true)
    .single();

  if (!pkg) {
    return { error: "Package not found" };
  }

  if (!pkg.stripe_price_id) {
    return { error: "Package not configured for payment yet" };
  }

  // Load or create Stripe customer ID
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const stripe = await getStripe();

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: pkg.stripe_price_id, quantity: 1 }],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits?purchased=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits/buy`,
    metadata: {
      type: "credit_purchase",
      user_id: user.id,
      package_id: pkg.id,
      credits: String(pkg.credits),
    },
  });

  return { url: session.url };
}

export async function createMenuOrderCheckout(menuId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify menu ownership and status
  const { data: menu } = await supabase
    .from("menus")
    .select("id, status, selected_image_id, restaurant_name")
    .eq("id", menuId)
    .eq("user_id", user.id)
    .single();

  if (!menu || menu.status !== "sample_selected") {
    return { error: "Menu not ready for order" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const stripe = await getStripe();

  let customerId = profile?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Menu Design — ${menu.restaurant_name || "Custom Menu"}`,
            description:
              "Professional menu design based on your selected AI sample",
          },
          unit_amount: 19900, // $199.00
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/menus/${menuId}?paid=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/menus/${menuId}/order`,
    metadata: {
      type: "menu_order",
      user_id: user.id,
      menu_id: menuId,
    },
  });

  // Create order record
  await supabase.from("orders").insert({
    menu_id: menuId,
    user_id: user.id,
    stripe_session_id: session.id,
    amount: 199,
    currency: "usd",
    status: "checkout_created",
    selected_image_id: menu.selected_image_id,
  });

  return { url: session.url };
}

async function getStripe() {
  const Stripe = (await import("stripe")).default;
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });
}
