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
  buildMenuContentDescription,
  buildQualitySuffix,
  buildConstraintDirectives,
  buildVariationPrompt,
  FALLBACK_VARIANT_PROMPTS,
} from "@/lib/prompts";
import type { VariantPrompt } from "@/lib/prompts";
import { redirect } from "next/navigation";
import type { MenuData, MenuFormat, PageLayout } from "@/types/menu";

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

  // Deduct credit
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

  // Extract enriched context from menu data
  const menuData = (menu.edited_json || menu.extracted_json) as MenuData | null;
  const menuFormat = menu.menu_format as MenuFormat | null;
  const enrichedCtx = extractEnrichedContext(menuData, menu.restaurant_name || "");

  // Build prompt tiers (computed once, shared across all 4 variants)
  const identity = buildIdentity(enrichedCtx.restaurantName, menu.cuisine_type, enrichedCtx.priceTier);
  const formatModifier = buildFormatModifier(menuFormat, menu.cuisine_type);
  const layoutModifier = buildLayoutModifier(menu.page_layout as PageLayout | null, enrichedCtx.itemCount);
  const artDirection = buildArtDirection(styleContext, cuisineContext, formatModifier, layoutModifier);
  const colorAndMaterial = buildColorAndMaterial(menu.color_palette as string[] | null, menuFormat);
  const contentGuidance = buildMenuContentDescription(menuData, menu.restaurant_name || "");
  const qualitySuffix = buildQualitySuffix(menuFormat);
  const constraints = buildConstraintDirectives(menuFormat);
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

  if (!images) return { images: [], allDone: false };

  const allDone = images.every(
    (img) => img.status === "completed" || img.status === "failed",
  );

  return { images, allDone };
}

export async function checkAndUpdateImages(generationId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Load pending images that have prediction IDs
  const { data: pendingImages } = await supabase
    .from("ai_generation_images")
    .select("*")
    .eq("generation_id", generationId)
    .eq("status", "generating");

  if (!pendingImages || pendingImages.length === 0) return;

  const { getPrediction, normalizeOutput } = await import("@/lib/replicate");

  for (const img of pendingImages) {
    if (!img.provider_prediction_id) continue;

    try {
      const prediction = await getPrediction(img.provider_prediction_id);

      if (prediction.status === "succeeded" && prediction.output) {
        const imageUrl = normalizeOutput(prediction.output);

        await supabase
          .from("ai_generation_images")
          .update({
            status: "completed",
            image_url: imageUrl,
            completed_at: new Date().toISOString(),
          })
          .eq("id", img.id);
      } else if (prediction.status === "failed") {
        await supabase
          .from("ai_generation_images")
          .update({
            status: "failed",
            error_message: prediction.error || "Generation failed",
          })
          .eq("id", img.id);
      }
    } catch (err) {
      console.error(`Failed to check prediction ${img.provider_prediction_id}:`, err);
    }
  }

  // Check if all images are done — update generation and menu status
  const { data: allImages } = await supabase
    .from("ai_generation_images")
    .select("status")
    .eq("generation_id", generationId);

  if (allImages?.every((i) => i.status === "completed" || i.status === "failed")) {
    const hasCompleted = allImages.some((i) => i.status === "completed");

    await supabase
      .from("ai_generations")
      .update({
        status: hasCompleted ? "completed" : "failed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", generationId);

    // Load generation to get menu_id
    const { data: gen } = await supabase
      .from("ai_generations")
      .select("menu_id")
      .eq("id", generationId)
      .single();

    if (gen) {
      await supabase
        .from("menus")
        .update({ status: hasCompleted ? "samples_ready" : "failed" })
        .eq("id", gen.menu_id);
    }
  }
}

export async function selectSample(menuId: string, imageId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("menus")
    .update({
      selected_image_id: imageId,
      status: "sample_selected",
    })
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
