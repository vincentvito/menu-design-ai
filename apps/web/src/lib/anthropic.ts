const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const FALLBACK_MODELS = [
  "claude-sonnet-4-6",
  "claude-sonnet-4-5-20250929",
  "claude-haiku-4-5-20250929",
  "claude-sonnet-4-20250514",
  "claude-3-haiku-20240307",
] as const;

type AnthropicRole = "user" | "assistant";

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: {
        type: "base64";
        media_type: string;
        data: string;
      };
    }
  | {
      type: "document";
      source: {
        type: "base64";
        media_type: string;
        data: string;
      };
    };

interface AnthropicRequest {
  model?: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
  messages: {
    role: AnthropicRole;
    content: AnthropicContentBlock[];
  }[];
}

interface AnthropicResponse {
  id: string;
  content: { type: string; text?: string }[];
  stop_reason: string | null;
  model: string;
}

interface AnthropicErrorResponse {
  error?: {
    type?: string;
    message?: string;
  };
}

function getApiKey() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  return key;
}

function getModelCandidates(requestedModel?: string): string[] {
  const envModel = process.env.ANTHROPIC_MODEL?.trim();
  const ordered = [requestedModel, envModel, ...FALLBACK_MODELS].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  return Array.from(new Set(ordered));
}

export function getAnthropicPreferredModel() {
  return getModelCandidates()[0];
}

export async function sendAnthropicMessage(input: AnthropicRequest): Promise<string> {
  const apiKey = getApiKey();
  let lastErrorText = "Unknown Anthropic error";

  for (const modelCandidate of getModelCandidates(input.model)) {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: modelCandidate,
        max_tokens: input.maxTokens ?? 4096,
        temperature: input.temperature ?? 0,
        system: input.system,
        messages: input.messages,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      lastErrorText = body;
      let parsed: AnthropicErrorResponse | null = null;
      try {
        parsed = JSON.parse(body) as AnthropicErrorResponse;
      } catch {
        parsed = null;
      }

      const errorType = parsed?.error?.type;
      const errorMessage = parsed?.error?.message || "";
      const modelMissing =
        errorType === "not_found_error" ||
        /model[:\s]/i.test(errorMessage) ||
        /model[:\s]/i.test(body);

      if (modelMissing) {
        continue;
      }

      throw new Error(`Anthropic API error ${response.status}: ${body}`);
    }

    const payload = (await response.json()) as AnthropicResponse;
    const text = payload.content
      .filter((block) => block.type === "text" && typeof block.text === "string")
      .map((block) => block.text as string)
      .join("\n")
      .trim();

    if (!text) {
      throw new Error("Anthropic returned no text content");
    }

    return text;
  }

  throw new Error(`Anthropic API model resolution failed: ${lastErrorText}`);
}

function stripCodeFences(text: string): string {
  return text
    .replace(/```json/gi, "```")
    .replace(/```/g, "")
    .trim();
}

function findBalancedJsonCandidates(text: string): string[] {
  const candidates: string[] = [];
  let depth = 0;
  let start = -1;
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
        continue;
      }
      if (char === "\\") {
        isEscaped = true;
        continue;
      }
      if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (depth === 0) start = i;
      depth += 1;
      continue;
    }

    if (char === "}") {
      if (depth === 0) continue;
      depth -= 1;
      if (depth === 0 && start >= 0) {
        const candidate = text.slice(start, i + 1).trim();
        if (candidate.length > 1) candidates.push(candidate);
        start = -1;
      }
    }
  }

  return candidates;
}

function scoreJsonCandidate(value: unknown): number {
  if (!value || typeof value !== "object") return 0;

  const obj = value as Record<string, unknown>;
  let score = 1;
  if ("menu_data" in obj) score += 5;
  if ("confidence" in obj) score += 1;

  const menuData = obj.menu_data;
  if (menuData && typeof menuData === "object") {
    score += 1;
    const menuDataObject = menuData as Record<string, unknown>;
    if (Array.isArray(menuDataObject.sections)) score += 2;
  }

  return score;
}

export function extractJsonObject(text: string): unknown {
  const cleaned = stripCodeFences(text);
  if (!cleaned) {
    throw new Error("Anthropic response was empty");
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // Fall through to candidate extraction.
  }

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const directCandidate = cleaned.slice(first, last + 1);
    try {
      return JSON.parse(directCandidate);
    } catch {
      // Fall through to balanced candidate parsing.
    }
  }

  const candidates = findBalancedJsonCandidates(cleaned);
  let bestScore = -1;
  let bestValue: unknown = null;

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      const score = scoreJsonCandidate(parsed);
      if (score > bestScore) {
        bestScore = score;
        bestValue = parsed;
      }
    } catch {
      // Ignore invalid candidate.
    }
  }

  if (bestValue !== null) {
    return bestValue;
  }

  throw new Error("Could not find JSON object in Anthropic response");
}

export function bufferToBase64(buffer: Uint8Array): string {
  return Buffer.from(buffer).toString("base64");
}
