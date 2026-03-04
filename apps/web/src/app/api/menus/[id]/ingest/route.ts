import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  bufferToBase64,
  extractJsonObject,
  getAnthropicPreferredModel,
  sendAnthropicMessage,
} from "@/lib/anthropic";
import {
  countMenuItems,
  countMenuItemsWithDescription,
  countMenuItemsWithPrice,
  getMenuStructureSignals,
  parseExtractedMenuData,
  parseMenuFromRawTextHeuristic,
} from "@/lib/menu-data";

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

const SUPPORTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function updateMenuResilient(args: {
  supabase: ServerSupabaseClient;
  menuId: string;
  userId: string;
  primary: Record<string, unknown>;
  fallback: Record<string, unknown>;
}) {
  const primaryResult = await args.supabase
    .from("menus")
    .update(args.primary)
    .eq("id", args.menuId)
    .eq("user_id", args.userId);

  if (!primaryResult.error) return { error: null as null };

  const fallbackResult = await args.supabase
    .from("menus")
    .update(args.fallback)
    .eq("id", args.menuId)
    .eq("user_id", args.userId);

  return { error: fallbackResult.error || primaryResult.error };
}

function getMenuQuality(menuData: ReturnType<typeof parseExtractedMenuData>["menuData"]) {
  const items = countMenuItems(menuData);
  const priced = countMenuItemsWithPrice(menuData);
  const described = countMenuItemsWithDescription(menuData);
  return {
    items,
    priced,
    described,
    score: items * 3 + priced * 9 + described * 6,
  };
}

function shouldFallbackToHeuristic(
  aiMenuData: ReturnType<typeof parseExtractedMenuData>["menuData"],
  heuristicMenuData: ReturnType<typeof parseExtractedMenuData>["menuData"],
) {
  const aiQuality = getMenuQuality(aiMenuData);
  if (aiQuality.items < 1) return true;

  const heuristicQuality = getMenuQuality(heuristicMenuData);
  const aiSignals = getMenuStructureSignals(aiMenuData);
  const heuristicSignals = getMenuStructureSignals(heuristicMenuData);

  if (aiSignals.invalidSections > 0) return true;
  if (
    aiSignals.compositeNameRatio > 0.34 &&
    heuristicSignals.compositeNameRatio + 0.1 < aiSignals.compositeNameRatio
  ) {
    return true;
  }

  if (
    heuristicQuality.items >= 4 &&
    aiQuality.items < Math.max(1, Math.floor(heuristicQuality.items * 0.45))
  ) {
    return true;
  }

  if (
    heuristicQuality.priced >= 4 &&
    aiQuality.priced < Math.max(1, Math.floor(heuristicQuality.priced * 0.4))
  ) {
    return true;
  }

  return false;
}

function buildExtractionInstruction(restaurantName: string) {
  return `Extract this restaurant menu into strict JSON.
Return JSON only (no markdown) with this shape:
{
  "confidence": 0.0,
  "menu_data": {
    "restaurant_name": "${restaurantName || "My Restaurant"}",
    "sections": [
      {
        "name": "Section Name",
        "items": [
          {
            "name": "Item name",
            "description": "Item description",
            "price": 0,
            "currency": "USD",
            "is_vegetarian": false,
            "is_vegan": false,
            "is_gluten_free": false,
            "is_spicy": false,
            "is_halal": false
          }
        ]
      }
    ]
  }
}
Rules:
- Keep text exactly as visible when possible.
- Include all sections and all items.
- Price must be numeric.
- If currency is not explicit, infer from context or use USD.
- Never invent sections or items that are not present.
- If one input line contains multiple dishes/prices, split them into separate items.
- Never combine two different dishes into one item name.
- Set dietary flags to true only when the text explicitly indicates them; otherwise keep false.`;
}

async function extractFromRawText(rawText: string, restaurantName: string) {
  const responseText = await sendAnthropicMessage({
    model: getAnthropicPreferredModel(),
    temperature: 0,
    maxTokens: 4096,
    system:
      "You are a menu parser. Convert menu text into strict JSON following the provided schema. Output JSON only.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `${buildExtractionInstruction(restaurantName)}\n\nMenu text:\n${rawText}`,
          },
        ],
      },
    ],
  });

  return extractJsonObject(responseText);
}

async function extractFromFile(
  fileBytes: Uint8Array,
  mimeType: string,
  fileName: string,
  restaurantName: string,
) {
  const sourceType = mimeType === "application/pdf" ? "document" : "image";
  const responseText = await sendAnthropicMessage({
    model: getAnthropicPreferredModel(),
    temperature: 0,
    maxTokens: 4096,
    system:
      "You are an OCR and structuring assistant for restaurant menus. Output JSON only.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `${buildExtractionInstruction(restaurantName)}\n\nFile name: ${fileName}`,
          },
          {
            type: sourceType,
            source: {
              type: "base64",
              media_type: mimeType,
              data: bufferToBase64(fileBytes),
            },
          },
        ],
      },
    ],
  });

  return extractJsonObject(responseText);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: menuId } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: menu } = await supabase
    .from("menus")
    .select("id, restaurant_name")
    .eq("id", menuId)
    .eq("user_id", user.id)
    .single();

  if (!menu) {
    return NextResponse.json({ error: "Menu not found" }, { status: 404 });
  }

  let rawTextInput: string | null = null;
  let uploadInfo:
    | {
        bytes: Uint8Array;
        type: string;
        name: string;
      }
    | null = null;

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing file in multipart payload" },
        { status: 400 },
      );
    }

    if (!SUPPORTED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Use JPEG, PNG, WebP, or PDF." },
        { status: 400 },
      );
    }

    uploadInfo = {
      bytes: new Uint8Array(await file.arrayBuffer()),
      type: file.type,
      name: safeFileName(file.name || "menu-upload"),
    };
  } else {
    const payload = (await request.json()) as {
      raw_text_input?: string;
    };
    rawTextInput = payload.raw_text_input?.trim() || null;

    if (!rawTextInput) {
      return NextResponse.json(
        { error: "Missing raw_text_input in JSON payload" },
        { status: 400 },
      );
    }
  }

  await updateMenuResilient({
    supabase,
    menuId,
    userId: user.id,
    primary: {
      status: "ocr_processing",
      processing_error: null,
      updated_at: new Date().toISOString(),
    },
    fallback: {
      status: "ocr_processing",
      updated_at: new Date().toISOString(),
    },
  });

  try {
    let uploadedPublicUrl: string | null = null;
    let extractedModel = getAnthropicPreferredModel();

    if (uploadInfo) {
      const storagePath = `${user.id}/${menuId}/${Date.now()}-${uploadInfo.name}`;
      const { error: uploadError } = await admin.storage
        .from("menu-originals")
        .upload(storagePath, uploadInfo.bytes, {
          contentType: uploadInfo.type,
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`File upload failed: ${uploadError.message}`);
      }

      const { data: publicData } = admin.storage
        .from("menu-originals")
        .getPublicUrl(storagePath);

      uploadedPublicUrl = publicData.publicUrl;

      await supabase
        .from("menus")
        .update({
          original_filename: uploadInfo.name,
          original_image_url: uploadedPublicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", menuId)
        .eq("user_id", user.id);
    }

    let menuData: ReturnType<typeof parseExtractedMenuData>["menuData"];
    let confidence: number | null = null;

    if (uploadInfo) {
      const extractedRaw = await extractFromFile(
        uploadInfo.bytes,
        uploadInfo.type,
        uploadInfo.name,
        menu.restaurant_name || "",
      );
      const parsed = parseExtractedMenuData(extractedRaw, menu.restaurant_name || "");
      menuData = parsed.menuData;
      confidence = parsed.confidence;
    } else {
      const text = rawTextInput as string;
      const heuristic = parseMenuFromRawTextHeuristic(
        text,
        menu.restaurant_name || "",
      );

      try {
        const extractedRaw = await extractFromRawText(
          text,
          menu.restaurant_name || "",
        );
        const parsed = parseExtractedMenuData(
          extractedRaw,
          menu.restaurant_name || "",
        );
        if (shouldFallbackToHeuristic(parsed.menuData, heuristic.menuData)) {
          menuData = heuristic.menuData;
          confidence = heuristic.confidence;
          extractedModel = "heuristic-parser-v1";
        } else {
          menuData = parsed.menuData;
          confidence = parsed.confidence;
          extractedModel = getAnthropicPreferredModel();
        }
      } catch {
        menuData = heuristic.menuData;
        confidence = heuristic.confidence;
        extractedModel = "heuristic-parser-v1";
      }
    }

    if (countMenuItems(menuData) === 0) {
      throw new Error("No menu items were extracted. Please edit manually or upload a clearer file.");
    }

    const { error: updateError } = await updateMenuResilient({
      supabase,
      menuId,
      userId: user.id,
      primary: {
        raw_text_input: rawTextInput,
        extracted_json: menuData,
        edited_json: menuData,
        restaurant_name: menuData.restaurant_name || menu.restaurant_name,
        ocr_model: extractedModel,
        ocr_confidence: confidence,
        processing_error: null,
        status: "ocr_complete",
        updated_at: new Date().toISOString(),
      },
      fallback: {
        raw_text_input: rawTextInput,
        extracted_json: menuData,
        edited_json: menuData,
        restaurant_name: menuData.restaurant_name || menu.restaurant_name,
        status: "ocr_complete",
        updated_at: new Date().toISOString(),
      },
    });

    if (updateError) {
      throw new Error(`Failed to persist extracted menu: ${updateError.message}`);
    }

    return NextResponse.json({
      success: true,
      menu_data: menuData,
      confidence,
      original_image_url: uploadedPublicUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown ingestion error";

    await updateMenuResilient({
      supabase,
      menuId,
      userId: user.id,
      primary: {
        status: "failed",
        processing_error: message,
        updated_at: new Date().toISOString(),
      },
      fallback: {
        status: "failed",
        updated_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
