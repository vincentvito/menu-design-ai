import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";

export async function GET(
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

  const url = new URL(request.url);
  const format = url.searchParams.get("format") || "png";
  if (format !== "png" && format !== "svg") {
    return NextResponse.json(
      { error: "Invalid format. Use png or svg." },
      { status: 400 },
    );
  }

  const { data: menu } = await supabase
    .from("menus")
    .select("restaurant_name, digital_unlocked, public_published, public_slug")
    .eq("id", menuId)
    .eq("user_id", user.id)
    .single();

  if (!menu) {
    return NextResponse.json({ error: "Menu not found" }, { status: 404 });
  }

  if (!menu.digital_unlocked || !menu.public_published || !menu.public_slug) {
    return NextResponse.json(
      { error: "Publish your digital menu before downloading QR files." },
      { status: 409 },
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || url.origin;
  const targetUrl = `${appUrl}/m/${menu.public_slug}`;
  const filenameBase = `${menu.restaurant_name || "menu"}-qr`
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .toLowerCase();

  if (format === "svg") {
    const svg = await QRCode.toString(targetUrl, {
      type: "svg",
      width: 1024,
      margin: 1,
      errorCorrectionLevel: "M",
    });

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `attachment; filename="${filenameBase}.svg"`,
      },
    });
  }

  const pngBuffer = await QRCode.toBuffer(targetUrl, {
    type: "png",
    width: 1024,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  return new NextResponse(new Uint8Array(pngBuffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${filenameBase}.png"`,
    },
  });
}
