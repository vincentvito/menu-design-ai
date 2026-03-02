import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PDFDocument } from "pdf-lib";

export async function GET(
  _request: Request,
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

  // Fetch menu with selected image
  const { data: menu } = await supabase
    .from("menus")
    .select("restaurant_name, selected_image_id")
    .eq("id", menuId)
    .eq("user_id", user.id)
    .single();

  if (!menu?.selected_image_id) {
    return NextResponse.json(
      { error: "No design selected" },
      { status: 400 },
    );
  }

  // Fetch the image URL
  const { data: img } = await supabase
    .from("ai_generation_images")
    .select("image_url")
    .eq("id", menu.selected_image_id)
    .single();

  if (!img?.image_url) {
    return NextResponse.json(
      { error: "Image not found" },
      { status: 404 },
    );
  }

  // Download the image
  const imageResponse = await fetch(img.image_url);
  if (!imageResponse.ok) {
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 502 },
    );
  }

  const imageBytes = new Uint8Array(await imageResponse.arrayBuffer());
  const contentType = imageResponse.headers.get("content-type") ?? "";

  // Create PDF with the image
  const pdfDoc = await PDFDocument.create();

  let pdfImage;
  if (contentType.includes("png")) {
    pdfImage = await pdfDoc.embedPng(imageBytes);
  } else {
    pdfImage = await pdfDoc.embedJpg(imageBytes);
  }

  // Use image dimensions to set page size (scale to fit standard print size)
  const { width, height } = pdfImage;
  const page = pdfDoc.addPage([width, height]);
  page.drawImage(pdfImage, { x: 0, y: 0, width, height });

  const pdfBytes = await pdfDoc.save();
  const filename = `${menu.restaurant_name || "menu"}-design.pdf`
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .toLowerCase();

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
