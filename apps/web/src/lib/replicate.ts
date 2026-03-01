const REPLICATE_API_URL = "https://api.replicate.com/v1";

interface PredictionInput {
  prompt: string;
  aspect_ratio?: string;
  num_images?: number;
}

interface Prediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output: string[] | null;
  error: string | null;
  created_at: string;
  completed_at: string | null;
}

export async function createPrediction(
  prompt: string,
  aspectRatio: string = "3:4",
): Promise<{ id: string }> {
  const response = await fetch(`${REPLICATE_API_URL}/models/google/nano-banana/predictions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: {
        prompt,
        aspect_ratio: aspectRatio,
        num_images: 1,
      } satisfies PredictionInput,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Replicate API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  return { id: data.id };
}

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
