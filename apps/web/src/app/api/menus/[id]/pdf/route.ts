import { NextResponse } from "next/server";
import QRCode from "qrcode";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import { createClient } from "@/lib/supabase/server";
import { countMenuItems } from "@/lib/menu-data";
import type { MenuData } from "@/types/menu";

const HYBRID_ITEM_THRESHOLD = 30;

interface MenuPdfRow {
  restaurant_name: string | null;
  selected_image_id: string | null;
  menu_format: string | null;
  page_layout: string | null;
  edited_json: unknown;
  extracted_json: unknown;
  digital_unlocked: boolean;
  public_published: boolean;
  public_slug: string | null;
}

interface MenuImageRow {
  image_url: string | null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: menuId } = await params;
  const url = new URL(request.url);
  const includeQr = ["1", "true", "yes"].includes(
    (url.searchParams.get("includeQr") || "").toLowerCase(),
  );

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: menuRow } = await supabase
    .from("menus")
    .select(
      [
        "restaurant_name",
        "selected_image_id",
        "menu_format",
        "page_layout",
        "edited_json",
        "extracted_json",
        "digital_unlocked",
        "public_published",
        "public_slug",
      ].join(", "),
    )
    .eq("id", menuId)
    .eq("user_id", user.id)
    .single();

  const menu = menuRow as unknown as MenuPdfRow | null;

  if (!menu?.selected_image_id) {
    return NextResponse.json({ error: "No design selected" }, { status: 400 });
  }

  let qrPngBytes: Buffer | null = null;
  if (includeQr) {
    if (!menu.digital_unlocked || !menu.public_published || !menu.public_slug) {
      return NextResponse.json(
        { error: "Publish your digital menu before exporting PDF with QR." },
        { status: 409 },
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || url.origin;
    const targetUrl = `${appUrl}/m/${menu.public_slug}`;
    qrPngBytes = await QRCode.toBuffer(targetUrl, {
      type: "png",
      width: 1024,
      margin: 1,
      errorCorrectionLevel: "M",
    });
  }

  const { data: imageRow } = await supabase
    .from("ai_generation_images")
    .select("image_url")
    .eq("id", menu.selected_image_id)
    .single();

  const img = imageRow as unknown as MenuImageRow | null;

  if (!img?.image_url) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const imageResponse = await fetch(img.image_url);
  if (!imageResponse.ok) {
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 502 },
    );
  }

  const imageBytes = new Uint8Array(await imageResponse.arrayBuffer());
  const contentType = imageResponse.headers.get("content-type") ?? "";

  const menuData = (menu.edited_json || menu.extracted_json) as MenuData | null;
  const itemCount = countMenuItems(menuData);
  const isHybridMode =
    !!menuData &&
    (itemCount > HYBRID_ITEM_THRESHOLD || menu.page_layout === "booklet");

  if (isHybridMode && menuData) {
    const pdfDoc = await PDFDocument.create();
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let backgroundImage:
      | Awaited<ReturnType<typeof pdfDoc.embedPng>>
      | Awaited<ReturnType<typeof pdfDoc.embedJpg>>
      | null = null;

    try {
      backgroundImage = contentType.includes("png")
        ? await pdfDoc.embedPng(imageBytes)
        : await pdfDoc.embedJpg(imageBytes);
    } catch {
      backgroundImage = null;
    }

    const PAGE_WIDTH = 595;
    const PAGE_HEIGHT = 842;
    const MARGIN_X = 48;
    const MARGIN_TOP = 64;
    const MARGIN_BOTTOM = 56;
    const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;

    const ensureNewPage = (state: { page: PDFPage | null; y: number }) => {
      if (state.page && state.y >= MARGIN_BOTTOM) {
        return state as { page: PDFPage; y: number };
      }

      const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      if (backgroundImage) {
        page.drawImage(backgroundImage, {
          x: 0,
          y: 0,
          width: PAGE_WIDTH,
          height: PAGE_HEIGHT,
          opacity: 0.08,
        });
      }

      page.drawRectangle({
        x: MARGIN_X - 14,
        y: MARGIN_BOTTOM - 18,
        width: CONTENT_WIDTH + 28,
        height: PAGE_HEIGHT - MARGIN_BOTTOM - MARGIN_TOP + 30,
        color: rgb(1, 1, 1),
        opacity: 0.9,
      });

      const title = menuData.restaurant_name || menu.restaurant_name || "Restaurant Menu";
      page.drawText(title, {
        x: MARGIN_X,
        y: PAGE_HEIGHT - MARGIN_TOP,
        size: 24,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1),
      });

      page.drawText("Exact Content Render", {
        x: MARGIN_X,
        y: PAGE_HEIGHT - MARGIN_TOP - 18,
        size: 9,
        font: regularFont,
        color: rgb(0.35, 0.35, 0.35),
      });

      return { page, y: PAGE_HEIGHT - MARGIN_TOP - 46 };
    };

    let state = ensureNewPage({ page: null, y: 0 });

    for (const section of menuData.sections) {
      state = ensureNewPage(state);
      state.page.drawText(section.name, {
        x: MARGIN_X,
        y: state.y,
        size: 14,
        font: boldFont,
        color: rgb(0.06, 0.06, 0.06),
      });
      state.y -= 18;

      for (const item of section.items) {
        state = ensureNewPage(state);
        const priceText = `${item.price.toFixed(2)} ${item.currency}`;
        const priceWidth = boldFont.widthOfTextAtSize(priceText, 10);

        state.page.drawText(item.name, {
          x: MARGIN_X,
          y: state.y,
          size: 10.5,
          font: boldFont,
          color: rgb(0.1, 0.1, 0.1),
          maxWidth: CONTENT_WIDTH - priceWidth - 10,
        });
        state.page.drawText(priceText, {
          x: MARGIN_X + CONTENT_WIDTH - priceWidth,
          y: state.y,
          size: 10,
          font: boldFont,
          color: rgb(0.15, 0.15, 0.15),
        });
        state.y -= 14;

        if (item.description && item.description.trim()) {
          state = ensureNewPage(state);
          state.page.drawText(item.description.trim(), {
            x: MARGIN_X + 8,
            y: state.y,
            size: 9,
            font: regularFont,
            color: rgb(0.3, 0.3, 0.3),
            maxWidth: CONTENT_WIDTH - 8,
            lineHeight: 11,
          });
          state.y -= 16;
        }
      }

      state.y -= 10;
    }

    if (qrPngBytes) {
      const pages = pdfDoc.getPages();
      if (pages.length > 0) {
        const qrImage = await pdfDoc.embedPng(qrPngBytes);
        drawQrStamp(pages[0], qrImage, regularFont);
      }
    }

    const pdfBytes = await pdfDoc.save();
    const filename = getPdfFilename(menu.restaurant_name, includeQr);
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const pdfDoc = await PDFDocument.create();
  const pdfImage = contentType.includes("png")
    ? await pdfDoc.embedPng(imageBytes)
    : await pdfDoc.embedJpg(imageBytes);

  const { width, height } = pdfImage;
  const page = pdfDoc.addPage([width, height]);
  page.drawImage(pdfImage, { x: 0, y: 0, width, height });

  if (qrPngBytes) {
    const qrImage = await pdfDoc.embedPng(qrPngBytes);
    const labelFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    drawQrStamp(page, qrImage, labelFont);
  }

  const pdfBytes = await pdfDoc.save();
  const filename = getPdfFilename(menu.restaurant_name, includeQr);

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

function getPdfFilename(restaurantName: string | null, includeQr: boolean) {
  const base = `${restaurantName || "menu"}${includeQr ? "-with-qr" : ""}-design.pdf`;
  return base.replace(/[^a-zA-Z0-9.-]/g, "_").toLowerCase();
}

function drawQrStamp(
  page: PDFPage,
  qrImage: PDFImage,
  font: PDFFont,
) {
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const qrSize = Math.max(72, Math.min(140, Math.min(pageWidth, pageHeight) * 0.16));
  const padding = 10;
  const label = "Scan for digital menu";
  const labelSize = 8;

  const x = pageWidth - qrSize - 24;
  const y = 24;

  page.drawRectangle({
    x: x - padding,
    y: y - padding,
    width: qrSize + padding * 2,
    height: qrSize + padding * 2 + 14,
    color: rgb(1, 1, 1),
    opacity: 0.9,
  });

  page.drawImage(qrImage, {
    x,
    y,
    width: qrSize,
    height: qrSize,
  });

  const labelWidth = font.widthOfTextAtSize(label, labelSize);
  page.drawText(label, {
    x: x + (qrSize - labelWidth) / 2,
    y: y + qrSize + 5,
    size: labelSize,
    font,
    color: rgb(0.2, 0.2, 0.2),
  });
}
