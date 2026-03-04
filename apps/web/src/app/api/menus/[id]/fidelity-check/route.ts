import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runFidelityCheck } from "@/lib/fidelity";
import type { MenuData } from "@/types/menu";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: menuId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json()) as {
    image_url?: string;
  };

  if (!payload.image_url) {
    return NextResponse.json({ error: "Missing image_url" }, { status: 400 });
  }

  const { data: menu } = await supabase
    .from("menus")
    .select("edited_json, extracted_json")
    .eq("id", menuId)
    .eq("user_id", user.id)
    .single();

  if (!menu) {
    return NextResponse.json({ error: "Menu not found" }, { status: 404 });
  }

  const menuData = (menu.edited_json || menu.extracted_json) as MenuData | null;
  if (!menuData) {
    return NextResponse.json(
      { error: "Menu has no structured content to validate against" },
      { status: 400 },
    );
  }

  try {
    const fidelity = await runFidelityCheck(payload.image_url, menuData);
    return NextResponse.json({ success: true, fidelity });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Fidelity validation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
