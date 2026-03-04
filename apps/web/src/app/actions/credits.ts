"use server";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  MENU_PACKAGES,
  isPaidMenuPackage,
  type PaidMenuPackage,
} from "@/lib/menu-packages";
import type { MenuPackage } from "@/types/menu";

type MenuForCheckout = {
  id: string;
  status: string;
  selected_image_id: string | null;
  restaurant_name: string | null;
  output_package: MenuPackage | null;
  digital_unlocked: boolean | null;
};

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
  const user = await requireUser(supabase);

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

  const stripe = await getStripe();
  const customerId = await getOrCreateStripeCustomerId(supabase, user);

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

export async function activateBasicPackage(menuId: string) {
  const supabase = await createClient();
  const user = await requireUser(supabase);
  const menu = await getOwnedMenuForCheckout(supabase, menuId, user.id);

  if (!menu) {
    return { error: "Menu not found" };
  }

  if (!menu.selected_image_id) {
    return { error: "Please select a design first." };
  }

  const nextOutputPackage =
    menu.output_package === "digital" || menu.output_package === "pro"
      ? menu.output_package
      : "basic";

  const payload: { output_package?: MenuPackage; status?: string } = {};
  if (menu.output_package !== nextOutputPackage) {
    payload.output_package = nextOutputPackage;
  }
  if (menu.status === "samples_ready") {
    payload.status = "sample_selected";
  }

  if (Object.keys(payload).length > 0) {
    const { error } = await supabase
      .from("menus")
      .update(payload)
      .eq("id", menuId)
      .eq("user_id", user.id);

    if (error) {
      return { error: "Failed to activate Basic package." };
    }
  }

  return { success: true, outputPackage: nextOutputPackage };
}

export async function createMenuPackageCheckout(
  menuId: string,
  packageType: PaidMenuPackage,
) {
  if (!isPaidMenuPackage(packageType)) {
    return { error: "Invalid package type" };
  }

  const supabase = await createClient();
  const user = await requireUser(supabase);
  const menu = await getOwnedMenuForCheckout(supabase, menuId, user.id);

  if (!menu) {
    return { error: "Menu not found" };
  }

  if (!menu.selected_image_id) {
    return { error: "Please select a design first." };
  }

  if (packageType === "digital" && menu.digital_unlocked) {
    return { error: "Digital package already unlocked for this menu." };
  }

  if (packageType === "pro" && menu.output_package === "pro") {
    return { error: "Pro package is already active for this menu." };
  }

  const pkg = MENU_PACKAGES[packageType];
  const stripe = await getStripe();
  const customerId = await getOrCreateStripeCustomerId(supabase, user);

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${pkg.name} Package — ${menu.restaurant_name || "Menu"}`,
            description: pkg.description,
          },
          unit_amount: pkg.priceCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/menus/${menuId}/package?packagePurchased=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/menus/${menuId}/package`,
    metadata: {
      type: "menu_package",
      user_id: user.id,
      menu_id: menuId,
      package_type: packageType,
    },
  });

  await supabase.from("orders").insert({
    menu_id: menuId,
    user_id: user.id,
    stripe_session_id: session.id,
    amount: pkg.priceUsd,
    currency: "usd",
    status: "checkout_created",
    selected_image_id: menu.selected_image_id,
    package_type: packageType,
  });

  return { url: session.url };
}

// Backward-compatible wrapper used by older UI routes.
export async function createMenuOrderCheckout(menuId: string) {
  return createMenuPackageCheckout(menuId, "pro");
}

async function getOwnedMenuForCheckout(
  supabase: Awaited<ReturnType<typeof createClient>>,
  menuId: string,
  userId: string,
): Promise<MenuForCheckout | null> {
  const { data } = await supabase
    .from("menus")
    .select(
      "id, status, selected_image_id, restaurant_name, output_package, digital_unlocked",
    )
    .eq("id", menuId)
    .eq("user_id", userId)
    .single();

  return data as MenuForCheckout | null;
}

async function requireUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

async function getOrCreateStripeCustomerId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: User,
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id;
  if (customerId) {
    return customerId;
  }

  const stripe = await getStripe();
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { supabase_user_id: user.id },
  });

  customerId = customer.id;
  await supabase
    .from("profiles")
    .update({ stripe_customer_id: customerId })
    .eq("id", user.id);

  return customerId;
}

async function getStripe() {
  const Stripe = (await import("stripe")).default;
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-02-25.clover",
  });
}
