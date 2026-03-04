"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface MenuPublicationState {
  public_slug: string | null;
  public_published: boolean;
  public_visibility: "unlisted";
  digital_unlocked: boolean;
}

export async function getOrCreatePublicSlug(menuId: string) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const { data: menu } = await supabase
    .from("menus")
    .select("id, user_id, restaurant_name, public_slug")
    .eq("id", menuId)
    .eq("user_id", user.id)
    .single();

  if (!menu) {
    return { error: "Menu not found." };
  }

  if (menu.public_slug) {
    return { slug: menu.public_slug };
  }

  const slug = await assignUniqueSlug({
    supabase,
    menuId,
    userId: user.id,
    restaurantName: menu.restaurant_name,
  });

  if (!slug) {
    return { error: "Failed to generate a public slug." };
  }

  return { slug };
}

export async function toggleMenuPublish(menuId: string, published: boolean) {
  const supabase = await createClient();
  const user = await requireUser(supabase);

  const { data: menu } = await supabase
    .from("menus")
    .select(
      "id, user_id, restaurant_name, digital_unlocked, public_slug, public_published, public_visibility",
    )
    .eq("id", menuId)
    .eq("user_id", user.id)
    .single();

  if (!menu) {
    return { error: "Menu not found." };
  }

  if (published && !menu.digital_unlocked) {
    return { error: "Digital package required before publishing." };
  }

  let slug = menu.public_slug;
  if (published && !slug) {
    slug = await assignUniqueSlug({
      supabase,
      menuId,
      userId: user.id,
      restaurantName: menu.restaurant_name,
    });

    if (!slug) {
      return { error: "Failed to create public URL." };
    }
  }

  const { error } = await supabase
    .from("menus")
    .update({
      public_published: published,
      public_visibility: "unlisted",
      public_slug: slug,
      public_published_at: published ? new Date().toISOString() : null,
    })
    .eq("id", menuId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to update publish status." };
  }

  const publicUrl = slug
    ? `${process.env.NEXT_PUBLIC_APP_URL}/m/${slug}`
    : null;

  return {
    success: true,
    state: {
      public_slug: slug,
      public_published: published,
      public_visibility: "unlisted" as const,
      digital_unlocked: menu.digital_unlocked,
    },
    publicUrl,
  };
}

async function assignUniqueSlug({
  supabase,
  menuId,
  userId,
  restaurantName,
}: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  menuId: string;
  userId: string;
  restaurantName: string | null;
}) {
  const base = slugify(restaurantName || "menu");
  const maxAttempts = 6;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const suffix = randomUUID().slice(0, 6);
    const candidate = `${base}-${suffix}`;

    const { data, error } = await supabase
      .from("menus")
      .update({ public_slug: candidate })
      .eq("id", menuId)
      .eq("user_id", userId)
      .is("public_slug", null)
      .select("id")
      .maybeSingle();

    if (!error && data?.id) {
      return candidate;
    }

    if (!error) {
      return null;
    }

    // 23505 = unique_violation
    if ((error as { code?: string }).code !== "23505") {
      return null;
    }
  }

  return null;
}

function slugify(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "menu";
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

export type { MenuPublicationState };
