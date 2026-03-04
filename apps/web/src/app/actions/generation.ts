"use server";

import { createClient } from "@/lib/supabase/server";
import { createPrediction, getModelForFormat } from "@/lib/replicate";
import {
  extractEnrichedContext,
  extractVariables,
  resolveTemplate,
  buildFullPrompt,
  buildIdentity,
  buildFormatModifier,
  buildLayoutModifier,
  buildArtDirection,
  buildColorAndMaterial,
  buildStrictMenuContentBlock,
  buildQualitySuffix,
  buildConstraintDirectives,
  buildStrictFidelityConstraints,
  buildVariationPrompt,
  FALLBACK_VARIANT_PROMPTS,
} from "@/lib/prompts";
import type { VariantPrompt } from "@/lib/prompts";
import { countMenuItems } from "@/lib/menu-data";
import { runFidelityCheck, type FidelityMetadata } from "@/lib/fidelity";
import { redirect } from "next/navigation";
import type { MenuData, MenuFormat, MenuStatus, PageLayout } from "@/types/menu";

const MAX_FIDELITY_RETRIES = 2;
const HYBRID_ITEM_THRESHOLD = 30;

function mapModelId(modelId: string | null | undefined) {
  if (modelId === "ideogram-ai/ideogram-v3-turbo") {
    return "ideogram-ai/ideogram-v3-turbo" as const;
  }
  return "google/nano-banana-2" as const;
}

function asMetadata(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function getRetryCount(metadata: Record<string, unknown>) {
  const value = metadata.retry_count;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function buildHybridContentGuidance(
  menuData: MenuData,
  restaurantName: string,
): string {
  const sampleItems = menuData.sections
    .flatMap((section) => section.items)
    .slice(0, 3)
    .map((item) => item.name)
    .join(", ");

  return `HYBRID STYLE-CONCEPT MODE: This generation is a visual concept only, not the final fully typeset output. Show the restaurant name '${restaurantName}' prominently and at most a few short placeholder entries (for example: ${sampleItems || "Chef Special, Signature Dish, Seasonal Item"}). Do not attempt to render the full menu text in this stage.`;
}

function buildRetryPrompt(basePrompt: string, attemptNumber: number) {
  return `${basePrompt}\n\nSTRICT FIDELITY RETRY ${attemptNumber}: You previously changed or omitted menu text. Keep the exact provided section headers, item names, descriptions, and prices without any modification.`;
}

export async function generateSamples(menuId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load menu with ownership check
  const { data: menu } = await supabase
    .from("menus")
    .select(
      "id, user_id, restaurant_name, cuisine_type, template_id, extracted_json, edited_json, menu_format, page_layout, color_palette",
    )
    .eq("id", menuId)
    .eq("user_id", user.id)
    .single();

  if (!menu) {
    return { error: "Menu not found" };
  }

  const menuData = (menu.edited_json || menu.extracted_json) as MenuData | null;
  const itemCount = countMenuItems(menuData);

  if (!menuData || itemCount === 0) {
    return {
      error:
        "No structured menu content found. Please extract or edit your menu content before generating.",
    };
  }
  if (!menu.template_id || !menu.cuisine_type || !menu.menu_format || !menu.page_layout) {
    return {
      error:
        "Please complete style, cuisine, format, and layout setup before generating.",
    };
  }

  // Deduct credit only after validation checks pass
  const { data: newBalance, error: creditError } = await supabase.rpc(
    "deduct_credit",
    {
      p_user_id: user.id,
      p_menu_id: menuId,
    },
  );

  if (creditError || newBalance === -1) {
    return { error: "Insufficient credits. Please buy more credits." };
  }

  // Load style template context
  let styleContext: string | null = null;
  if (menu.template_id) {
    const { data: style } = await supabase
      .from("style_templates")
      .select("base_prompt_context")
      .eq("id", menu.template_id)
      .single();
    styleContext = style?.base_prompt_context ?? null;
  }

  // Load cuisine context
  let cuisineContext: string | null = null;
  if (menu.cuisine_type) {
    const { data: cuisine } = await supabase
      .from("cuisine_types")
      .select("prompt_modifier")
      .eq("slug", menu.cuisine_type)
      .single();
    cuisineContext = cuisine?.prompt_modifier ?? null;
  }

  const menuFormat = menu.menu_format as MenuFormat | null;
  const pageLayout = menu.page_layout as PageLayout | null;
  const enrichedCtx = extractEnrichedContext(menuData, menu.restaurant_name || "");
  const isHybridMode = itemCount > HYBRID_ITEM_THRESHOLD || pageLayout === "booklet";

  // Build prompt tiers (computed once, shared across all 4 variants)
  const identity = buildIdentity(
    enrichedCtx.restaurantName,
    menu.cuisine_type,
    enrichedCtx.priceTier,
  );
  const formatModifier = buildFormatModifier(menuFormat, menu.cuisine_type);
  const layoutModifier = buildLayoutModifier(pageLayout, enrichedCtx.itemCount);
  const artDirection = buildArtDirection(
    styleContext,
    cuisineContext,
    formatModifier,
    layoutModifier,
  );
  const colorAndMaterial = buildColorAndMaterial(
    menu.color_palette as string[] | null,
    menuFormat,
  );

  const contentGuidance = isHybridMode
    ? buildHybridContentGuidance(menuData, menu.restaurant_name || "")
    : buildStrictMenuContentBlock(menuData, menu.restaurant_name || "");

  const qualitySuffix = buildQualitySuffix(menuFormat);
  const constraints = isHybridMode
    ? buildConstraintDirectives(menuFormat, false)
    : buildStrictFidelityConstraints(menuFormat);
  const technicalQuality = qualitySuffix + "\n" + constraints;

  // Load prompt templates or use fallbacks
  let variantPrompts: (VariantPrompt | string)[] = FALLBACK_VARIANT_PROMPTS;
  if (menu.template_id && menu.cuisine_type) {
    const { data: templates } = await supabase
      .from("prompt_templates")
      .select("prompt_template, variant_index")
      .eq("style_template_id", menu.template_id)
      .eq("cuisine_type", menu.cuisine_type)
      .eq("is_active", true)
      .order("variant_index");

    if (templates && templates.length === 4) {
      // DB templates may use {{variable}} placeholders — resolve them
      const variables = extractVariables(menuData, menu.restaurant_name || "");
      variantPrompts = templates.map((t) => resolveTemplate(t.prompt_template, variables));
    }
  }

  // Select model based on menu format
  const model = getModelForFormat(menuFormat);

  // Create generation record
  const { data: generation, error: genError } = await supabase
    .from("ai_generations")
    .insert({
      menu_id: menuId,
      user_id: user.id,
      style_template_id: menu.template_id,
      cuisine_type: menu.cuisine_type || "general",
      status: "generating",
      provider: "replicate",
      model_id: model,
    })
    .select("id")
    .single();

  if (genError || !generation) {
    return { error: "Failed to create generation record" };
  }

  // Build 4 prompts and fire predictions
  const imageInserts = [];
  for (let i = 0; i < 4; i++) {
    const variant = variantPrompts[i];
    const variantText = typeof variant === "string" ? variant : variant.prompt;

    const fullPrompt = buildFullPrompt({
      identity,
      artDirection,
      colorAndMaterial,
      contentGuidance,
      variantPersonality: variantText,
      technicalQuality,
    });

    let predictionId: string | null = null;
    let status: "pending" | "generating" | "failed" = "generating";
    let errorMessage: string | null = null;

    try {
      const prediction = await createPrediction(fullPrompt, { model });
      predictionId = prediction.id;
    } catch (err) {
      status = "failed";
      errorMessage = err instanceof Error ? err.message : "Unknown error";
    }

    imageInserts.push({
      generation_id: generation.id,
      variant_index: i,
      prompt_text: fullPrompt,
      provider_prediction_id: predictionId,
      status,
      error_message: errorMessage,
      metadata: {
        hybrid_mode: isHybridMode,
        retry_count: 0,
        fidelity_passed: isHybridMode,
      },
    });
  }

  await supabase.from("ai_generation_images").insert(imageInserts);

  // Update menu status
  await supabase
    .from("menus")
    .update({ status: "generating_samples" })
    .eq("id", menuId);

  return { generationId: generation.id, balance: newBalance, hybridMode: isHybridMode };
}

export async function pollGeneration(generationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load images for this generation
  const { data: images } = await supabase
    .from("ai_generation_images")
    .select("*")
    .eq("generation_id", generationId)
    .order("variant_index");

  if (!images) return { images: [], allDone: false, allVisible: false };

  const allDone = images.every(
    (img) => img.status === "completed" || img.status === "failed",
  );

  const allVisible = images.every(
    (img) =>
      img.status === "ready" ||
      img.status === "completed" ||
      img.status === "failed",
  );

  return { images, allDone, allVisible };
}

// ---------------------------------------------------------------------------
// Phase 1: Fast — check Replicate status, make images visible immediately
// ---------------------------------------------------------------------------

async function reuploadToStorage(
  imageUrl: string,
  generationId: string,
  variantIndex: number,
): Promise<string> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();

  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Failed to download: ${response.status}`);

  const buffer = new Uint8Array(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") || "image/png";
  const ext = contentType.includes("webp") ? "webp" : "png";
  const path = `generations/${generationId}/${variantIndex}.${ext}`;

  const { error } = await admin.storage
    .from("generated-images")
    .upload(path, buffer, { contentType, upsert: true });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = admin.storage.from("generated-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function checkImageReadiness(generationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load images still waiting on Replicate
  const { data: pendingImages } = await supabase
    .from("ai_generation_images")
    .select("*")
    .eq("generation_id", generationId)
    .eq("status", "generating");

  if (!pendingImages || pendingImages.length === 0) return;

  const { getPrediction, normalizeOutput } = await import("@/lib/replicate");

  // Poll all predictions in parallel (fast HTTP calls)
  const results = await Promise.all(
    pendingImages
      .filter((img) => img.provider_prediction_id)
      .map(async (img) => {
        try {
          const prediction = await getPrediction(img.provider_prediction_id!);
          return { img, prediction, error: null };
        } catch (err) {
          return { img, prediction: null, error: err };
        }
      }),
  );

  for (const { img, prediction, error } of results) {
    if (error || !prediction) {
      console.error(`Failed to check prediction ${img.provider_prediction_id}:`, error);
      continue; // Don't fail the image — retry on next poll
    }

    if (prediction.status === "succeeded" && prediction.output) {
      const replicateUrl = normalizeOutput(prediction.output);

      if (!replicateUrl) {
        await supabase
          .from("ai_generation_images")
          .update({
            status: "failed",
            error_message: "Prediction succeeded but returned no usable image URL",
          })
          .eq("id", img.id);
        continue;
      }

      const metadata = asMetadata(img.metadata);
      const isHybridMode = metadata.hybrid_mode === true;

      // Re-upload to Supabase Storage for permanent URL
      let permanentUrl = replicateUrl;
      try {
        permanentUrl = await reuploadToStorage(replicateUrl, generationId, img.variant_index);
      } catch (err) {
        console.error("Re-upload to storage failed, using CDN URL:", err);
      }

      if (isHybridMode) {
        // Hybrid: skip fidelity, go directly to completed
        await supabase
          .from("ai_generation_images")
          .update({
            status: "completed",
            image_url: permanentUrl,
            completed_at: new Date().toISOString(),
            metadata: {
              ...metadata,
              fidelity_passed: true,
              fidelity_status: "passed",
              missing_tokens: [],
              changed_prices: [],
              description_match_ratio: 1,
            },
          })
          .eq("id", img.id);
      } else {
        // Non-hybrid: mark as "ready" (visible, fidelity pending)
        await supabase
          .from("ai_generation_images")
          .update({
            status: "ready",
            image_url: permanentUrl,
            metadata: {
              ...metadata,
              fidelity_status: "pending",
            },
          })
          .eq("id", img.id);
      }
    } else if (prediction.status === "failed") {
      await supabase
        .from("ai_generation_images")
        .update({
          status: "failed",
          error_message: prediction.error || "Generation failed",
        })
        .eq("id", img.id);
    }
    // "starting" or "processing" → leave as "generating", poll again next cycle
  }
}

// ---------------------------------------------------------------------------
// Phase 2: Background — fidelity checks (slow, concurrent, non-blocking)
// ---------------------------------------------------------------------------

export async function runBackgroundFidelityChecks(generationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: generation } = await supabase
    .from("ai_generations")
    .select("id, menu_id, user_id, model_id, parent_generation_id")
    .eq("id", generationId)
    .single();

  if (!generation) return;

  const { data: menu } = await supabase
    .from("menus")
    .select("edited_json, extracted_json")
    .eq("id", generation.menu_id)
    .single();

  const menuData = (menu?.edited_json || menu?.extracted_json) as MenuData | null;

  // Load images that are ready for fidelity checking
  const { data: readyImages } = await supabase
    .from("ai_generation_images")
    .select("*")
    .eq("generation_id", generationId)
    .eq("status", "ready");

  if (!readyImages || readyImages.length === 0) {
    // No ready images, but check if everything is done for finalization
    await finalizeGenerationIfDone(supabase, generationId, generation);
    return;
  }

  // Guard against double-execution: atomically set fidelity_status to "checking"
  const imagesToCheck = [];
  for (const img of readyImages) {
    const metadata = asMetadata(img.metadata);
    if (metadata.fidelity_status === "checking") continue; // Already being checked

    const { error } = await supabase
      .from("ai_generation_images")
      .update({
        metadata: { ...metadata, fidelity_status: "checking" },
      })
      .eq("id", img.id)
      .eq("status", "ready");

    if (!error) {
      imagesToCheck.push(img);
    }
  }

  if (imagesToCheck.length === 0) {
    await finalizeGenerationIfDone(supabase, generationId, generation);
    return;
  }

  if (!menuData) {
    // No menu data — mark all as failed
    for (const img of imagesToCheck) {
      await supabase
        .from("ai_generation_images")
        .update({
          status: "failed",
          error_message: "Missing menu content for fidelity validation",
        })
        .eq("id", img.id);
    }
    await finalizeGenerationIfDone(supabase, generationId, generation);
    return;
  }

  // Run ALL fidelity checks concurrently
  await Promise.allSettled(
    imagesToCheck.map(async (img) => {
      const metadata = asMetadata(img.metadata);

      try {
        const fidelity = await runFidelityCheck(img.image_url!, menuData);

        if (fidelity.fidelity_passed) {
          await supabase
            .from("ai_generation_images")
            .update({
              status: "completed",
              completed_at: new Date().toISOString(),
              metadata: {
                ...metadata,
                ...fidelity,
                fidelity_status: "passed",
              },
            })
            .eq("id", img.id);
        } else {
          const retryCount = getRetryCount(metadata);
          if (retryCount < MAX_FIDELITY_RETRIES) {
            // Retry: create new prediction, go back to "generating"
            // but KEEP image_url so the image stays visible
            const retryPrompt = buildRetryPrompt(img.prompt_text, retryCount + 1);
            const retryPrediction = await createPrediction(retryPrompt, {
              model: mapModelId(generation.model_id),
            });

            await supabase
              .from("ai_generation_images")
              .update({
                provider_prediction_id: retryPrediction.id,
                prompt_text: retryPrompt,
                status: "generating",
                error_message: null,
                metadata: {
                  ...metadata,
                  ...fidelity,
                  retry_count: retryCount + 1,
                  fidelity_status: "retrying",
                },
              })
              .eq("id", img.id);
          } else {
            // Max retries exhausted — mark completed with fidelity_passed: false
            await supabase
              .from("ai_generation_images")
              .update({
                status: "completed",
                completed_at: new Date().toISOString(),
                metadata: {
                  ...metadata,
                  ...fidelity,
                  fidelity_status: "failed",
                  retry_count: retryCount,
                },
              })
              .eq("id", img.id);
          }
        }
      } catch (err) {
        console.error(`Fidelity check failed for image ${img.id}:`, err);
        // On error, mark completed with fidelity error so image is still usable
        await supabase
          .from("ai_generation_images")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            metadata: {
              ...metadata,
              fidelity_status: "error",
              fidelity_passed: false,
            },
          })
          .eq("id", img.id);
      }
    }),
  );

  await finalizeGenerationIfDone(supabase, generationId, generation);
}

// ---------------------------------------------------------------------------
// Finalization: update generation + menu status when all images are terminal
// ---------------------------------------------------------------------------

async function finalizeGenerationIfDone(
  supabase: Awaited<ReturnType<typeof createClient>>,
  generationId: string,
  generation: { menu_id: string; user_id: string; parent_generation_id: string | null },
) {
  const { data: allImages } = await supabase
    .from("ai_generation_images")
    .select("status")
    .eq("generation_id", generationId);

  if (!allImages) return;

  // Only finalize if no images are still in progress
  const allTerminal = allImages.every(
    (i) => i.status === "completed" || i.status === "failed",
  );

  if (!allTerminal) return;

  const hasCompleted = allImages.some((i) => i.status === "completed");

  await supabase
    .from("ai_generations")
    .update({
      status: hasCompleted ? "completed" : "failed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", generationId);

  const menuStatus: MenuStatus = hasCompleted
    ? "samples_ready"
    : generation.parent_generation_id
      ? "samples_ready"
      : "style_selected";

  await supabase
    .from("menus")
    .update({ status: menuStatus })
    .eq("id", generation.menu_id);

  if (!hasCompleted) {
    try {
      await supabase.rpc("refund_credit", {
        p_user_id: generation.user_id,
        p_menu_id: generation.menu_id,
        p_reason: "All generated variants failed fidelity checks",
      });
    } catch (err) {
      console.error("Failed to refund credit after fidelity failure:", err);
    }
  }
}

export async function selectSample(menuId: string, imageId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: menu } = await supabase
    .from("menus")
    .select("status")
    .eq("id", menuId)
    .eq("user_id", user.id)
    .single();

  if (!menu) {
    return { error: "Menu not found" };
  }

  const { data: image } = await supabase
    .from("ai_generation_images")
    .select("id, status, metadata, generation_id")
    .eq("id", imageId)
    .single();

  if (!image || image.status !== "completed") {
    return { error: "Only completed, fidelity-checked images can be selected" };
  }

  const { data: ownerGen } = await supabase
    .from("ai_generations")
    .select("menu_id")
    .eq("id", image.generation_id)
    .single();

  if (!ownerGen || ownerGen.menu_id !== menuId) {
    return { error: "Invalid image selection for this menu" };
  }

  const metadata = asMetadata(image.metadata);
  if (metadata.fidelity_passed !== true) {
    return { error: "This image did not pass text fidelity checks" };
  }

  const currentStatus = menu.status as MenuStatus;
  const shouldAdvanceStatus =
    currentStatus === "samples_ready" || currentStatus === "generating_samples";

  const updatePayload: {
    selected_image_id: string;
    status?: MenuStatus;
  } = {
    selected_image_id: imageId,
  };

  if (shouldAdvanceStatus) {
    updatePayload.status = "sample_selected";
  }

  const { error } = await supabase
    .from("menus")
    .update(updatePayload)
    .eq("id", menuId)
    .eq("user_id", user.id);

  if (error) {
    return { error: "Failed to select sample" };
  }

  return { success: true };
}

export async function generateVariations(
  menuId: string,
  sourceImageId: string,
  freeTextInstruction: string,
  selectedTagInstructions: string[],
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verify menu ownership
  const { data: menu } = await supabase
    .from("menus")
    .select("id, user_id")
    .eq("id", menuId)
    .eq("user_id", user.id)
    .single();

  if (!menu) {
    return { error: "Menu not found" };
  }

  // Load source image (original prompt + image URL + parent generation)
  const { data: sourceImage } = await supabase
    .from("ai_generation_images")
    .select("id, generation_id, prompt_text, image_url, status")
    .eq("id", sourceImageId)
    .single();

  if (!sourceImage || sourceImage.status !== "completed" || !sourceImage.image_url) {
    return { error: "Source image not available" };
  }

  // Verify the source generation belongs to this menu
  const { data: parentGen } = await supabase
    .from("ai_generations")
    .select("id, menu_id, style_template_id, cuisine_type")
    .eq("id", sourceImage.generation_id)
    .single();

  if (!parentGen || parentGen.menu_id !== menuId) {
    return { error: "Invalid source image" };
  }

  // Deduct credit
  const { data: newBalance, error: creditError } = await supabase.rpc(
    "deduct_credit",
    { p_user_id: user.id, p_menu_id: menuId },
  );

  if (creditError || newBalance === -1) {
    return { error: "Insufficient credits. Please buy more credits." };
  }

  // Combine instructions for storage
  const combinedInstructions = [
    ...(freeTextInstruction.trim() ? [freeTextInstruction.trim()] : []),
    ...selectedTagInstructions,
  ].join(" | ");

  // Variations always use Nano Banana 2 (needs image_input for reference)
  const variationModel = "google/nano-banana-2" as const;

  // Create variation generation record
  const { data: generation, error: genError } = await supabase
    .from("ai_generations")
    .insert({
      menu_id: menuId,
      user_id: user.id,
      style_template_id: parentGen.style_template_id,
      cuisine_type: parentGen.cuisine_type,
      status: "generating",
      provider: "replicate",
      model_id: variationModel,
      parent_generation_id: parentGen.id,
      source_image_id: sourceImageId,
      variation_instructions: combinedInstructions,
    })
    .select("id")
    .single();

  if (genError || !generation) {
    return { error: "Failed to create variation record" };
  }

  // Build 4 variation prompts and fire predictions
  const imageInserts = [];
  for (let i = 0; i < 4; i++) {
    const fullPrompt = buildVariationPrompt(
      sourceImage.prompt_text,
      freeTextInstruction,
      selectedTagInstructions,
      i,
    );

    let predictionId: string | null = null;
    let status: "pending" | "generating" | "failed" = "generating";
    let errorMessage: string | null = null;

    try {
      const prediction = await createPrediction(fullPrompt, {
        model: variationModel,
        imageInput: [sourceImage.image_url],
      });
      predictionId = prediction.id;
    } catch (err) {
      status = "failed";
      errorMessage = err instanceof Error ? err.message : "Unknown error";
    }

    imageInserts.push({
      generation_id: generation.id,
      variant_index: i,
      prompt_text: fullPrompt,
      provider_prediction_id: predictionId,
      status,
      error_message: errorMessage,
      metadata: {
        retry_count: 0,
        hybrid_mode: false,
      },
    });
  }

  await supabase.from("ai_generation_images").insert(imageInserts);

  // Update menu status
  await supabase
    .from("menus")
    .update({ status: "generating_samples" })
    .eq("id", menuId);

  return { generationId: generation.id, balance: newBalance };
}
