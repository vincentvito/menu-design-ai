import type { MenuData } from "@/types/menu";
import {
  bufferToBase64,
  getAnthropicPreferredModel,
  sendAnthropicMessage,
} from "@/lib/anthropic";

export interface FidelityMetadata {
  fidelity_passed: boolean;
  missing_tokens: string[];
  changed_prices: string[];
  description_match_ratio: number;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9.\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesPhrase(haystack: string, phrase: string): boolean {
  const normalizedPhrase = normalizeText(phrase);
  if (!normalizedPhrase) return true;
  return haystack.includes(normalizedPhrase);
}

function expectedPriceVariants(price: number): string[] {
  const integer = String(Math.trunc(price));
  const fixed = price.toFixed(2);
  const trimmed = fixed.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
  return Array.from(new Set([integer, fixed, trimmed]));
}

export async function extractVisibleTextFromImage(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download generated image: ${response.status}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  const contentType = response.headers.get("content-type") || "image/png";
  const base64 = bufferToBase64(bytes);

  return sendAnthropicMessage({
    model: "claude-haiku-4-5-20250929",
    temperature: 0,
    maxTokens: 4096,
    system:
      "You are an OCR assistant. Extract all visible text exactly as it appears. Return plain text only, preserving line breaks where possible.",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Transcribe all visible text in this menu image exactly. Do not summarize. Output only the transcribed text.",
          },
          {
            type: "image",
            source: {
              type: "base64",
              media_type: contentType,
              data: base64,
            },
          },
        ],
      },
    ],
  });
}

export function evaluateFidelity(ocrText: string, menuData: MenuData): FidelityMetadata {
  const normalized = normalizeText(ocrText);

  const missingTokens: string[] = [];
  const changedPrices: string[] = [];

  let descriptionTotal = 0;
  let descriptionMatched = 0;

  for (const section of menuData.sections) {
    if (!includesPhrase(normalized, section.name)) {
      missingTokens.push(`Section: ${section.name}`);
    }

    for (const item of section.items) {
      if (!includesPhrase(normalized, item.name)) {
        missingTokens.push(`Item: ${item.name}`);
      }

      if (item.description && item.description.trim().length > 0) {
        descriptionTotal += 1;
        if (includesPhrase(normalized, item.description)) {
          descriptionMatched += 1;
        }
      }

      const priceVariants = expectedPriceVariants(item.price);
      const hasExpectedPrice = priceVariants.some((candidate) =>
        includesPhrase(normalized, candidate),
      );

      if (!hasExpectedPrice) {
        changedPrices.push(`${item.name}: expected ${item.price.toFixed(2)} ${item.currency}`);
      }
    }
  }

  const descriptionMatchRatio =
    descriptionTotal === 0 ? 1 : Number((descriptionMatched / descriptionTotal).toFixed(3));

  const fidelityPassed =
    missingTokens.length === 0 &&
    changedPrices.length === 0 &&
    descriptionMatchRatio >= 0.85;

  return {
    fidelity_passed: fidelityPassed,
    missing_tokens: missingTokens,
    changed_prices: changedPrices,
    description_match_ratio: descriptionMatchRatio,
  };
}

export async function runFidelityCheck(
  imageUrl: string,
  menuData: MenuData,
): Promise<FidelityMetadata> {
  const ocrText = await extractVisibleTextFromImage(imageUrl);
  return evaluateFidelity(ocrText, menuData);
}
