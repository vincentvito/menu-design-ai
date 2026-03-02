import type { MenuFormat } from "@/types/menu";

const REPLICATE_API_URL = "https://api.replicate.com/v1";

// ---------------------------------------------------------------------------
// Model routing
// ---------------------------------------------------------------------------

export type ModelId = "google/nano-banana-2" | "ideogram-ai/ideogram-v3-turbo";

/** Pick the best model for a given menu format. */
export function getModelForFormat(format: MenuFormat | null): ModelId {
  if (format === "text_only") return "ideogram-ai/ideogram-v3-turbo";
  return "google/nano-banana-2";
}

// ---------------------------------------------------------------------------
// Prediction types
// ---------------------------------------------------------------------------

interface Prediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output: string | string[] | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

/** Normalize the output from any model into a single URL string. */
export function normalizeOutput(output: Prediction["output"]): string | null {
  if (!output) return null;
  if (typeof output === "string") return output;
  if (Array.isArray(output) && output.length > 0) return output[0];
  return null;
}

// ---------------------------------------------------------------------------
// Create prediction
// ---------------------------------------------------------------------------

export async function createPrediction(
  prompt: string,
  opts: {
    model?: ModelId;
    aspectRatio?: string;
    outputFormat?: string;
    imageInput?: string[];
  } = {},
): Promise<{ id: string; model: ModelId }> {
  const model = opts.model ?? "google/nano-banana-2";
  const aspectRatio = opts.aspectRatio ?? "3:4";

  // Build model-specific input
  let input: Record<string, unknown>;

  if (model === "ideogram-ai/ideogram-v3-turbo") {
    input = {
      prompt,
      aspect_ratio: aspectRatio,
      style_type: "Design",
      magic_prompt_option: "Off",
      negative_prompt:
        "blurry text, illegible text, gibberish, misspelled words, distorted letters, low quality, watermark, 3D render, photo of menu on table",
    };
  } else {
    // google/nano-banana-2
    input = {
      prompt,
      aspect_ratio: aspectRatio,
      output_format: opts.outputFormat ?? "png",
      resolution: "1K",
    };

    if (opts.imageInput && opts.imageInput.length > 0) {
      input.image_input = opts.imageInput;
    }
  }

  const response = await fetch(
    `${REPLICATE_API_URL}/models/${model}/predictions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Replicate API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  return { id: data.id, model };
}

// ---------------------------------------------------------------------------
// Poll prediction
// ---------------------------------------------------------------------------

export async function getPrediction(predictionId: string): Promise<Prediction> {
  const response = await fetch(
    `${REPLICATE_API_URL}/predictions/${predictionId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Replicate API error: ${response.status}`);
  }

  return response.json();
}
