import { z } from "zod";
import type { MenuData } from "@/types/menu";

const priceSchema = z.preprocess((value) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}, z.number().nonnegative());

const menuItemSchema = z.object({
  name: z.string().trim().min(1),
  name_ar: z.string().trim().optional(),
  description: z.string().trim().optional(),
  description_ar: z.string().trim().optional(),
  price: priceSchema,
  currency: z
    .string()
    .trim()
    .min(1)
    .max(10)
    .transform((value) => value.toUpperCase())
    .default("USD"),
  is_vegetarian: z.boolean().optional(),
  is_vegan: z.boolean().optional(),
  is_gluten_free: z.boolean().optional(),
  is_spicy: z.boolean().optional(),
  is_halal: z.boolean().optional(),
});

const menuSectionSchema = z.object({
  name: z.string().trim().min(1),
  name_ar: z.string().trim().optional(),
  items: z.array(menuItemSchema).default([]),
});

const menuDataSchema = z.object({
  restaurant_name: z.string().trim().default("My Restaurant"),
  sections: z.array(menuSectionSchema).default([]),
});

const extractionResponseSchema = z.object({
  confidence: z
    .preprocess((value) => {
      if (typeof value === "number") return value;
      if (typeof value === "string") {
        const parsed = Number.parseFloat(value);
        return Number.isFinite(parsed) ? parsed : undefined;
      }
      return undefined;
    }, z.number().min(0).max(1).optional())
    .optional(),
  menu_data: menuDataSchema,
});

const CURRENCY_CODE_REGEX =
  /\b(AED|USD|EUR|GBP|SAR|QAR|OMR|KWD|BHD|PKR|INR|JPY|CNY|CAD|AUD|CHF)\b/i;
const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  $: "USD",
  "€": "EUR",
  "£": "GBP",
};
const PRICE_WITH_CURRENCY_REGEX =
  /(?:\b(?:AED|USD|EUR|GBP|SAR|QAR|OMR|KWD|BHD|PKR|INR|JPY|CNY|CAD|AUD|CHF)\b\s*\d{1,5}(?:[.,]\d{1,2})?|\d{1,5}(?:[.,]\d{1,2})?\s*\b(?:AED|USD|EUR|GBP|SAR|QAR|OMR|KWD|BHD|PKR|INR|JPY|CNY|CAD|AUD|CHF)\b|[$€£]\s*\d{1,5}(?:[.,]\d{1,2})?|\d{1,5}(?:[.,]\d{1,2})?\s*[$€£])/gi;
const MENU_SECTION_KEYWORDS_REGEX =
  /^(appetizers?|starters?|main(?:s| course| courses)?|entrees?|desserts?|drinks?|beverages?|sides?|salads?|pasta(?: dishes?)?|pizzas?|seafood(?: specialties?)?|specials?)$/i;
const SECTION_PREFIX_IN_LINE_REGEX =
  /^(appetizers?|starters?|main(?:s| course| courses)?|entrees?|desserts?|drinks?|beverages?|sides?|salads?|soups?|specials?)\b[:\-–—]?\s+(.+)$/i;
const SECTION_KEYWORD_INLINE_REGEX =
  /\b(appetizers?|starters?|main(?:s| course| courses)?|entrees?|desserts?|drinks?|beverages?|sides?|soups?)\b/gi;
const TABULAR_HEADER_KEYWORD_REGEX =
  /^(section|category|item|name|description|desc|price|cost|amount|currency|notes?)$/i;
const UNICODE_LETTER_REGEX = /\p{L}/u;
const DIETARY_KEYWORD_MAP: Array<{
  key: keyof Pick<
    MenuData["sections"][number]["items"][number],
    "is_vegetarian" | "is_vegan" | "is_gluten_free" | "is_spicy" | "is_halal"
  >;
  regex: RegExp;
}> = [
  { key: "is_vegan", regex: /\bvegan\b/i },
  { key: "is_vegetarian", regex: /\bvegetarian\b/i },
  { key: "is_gluten_free", regex: /\bgluten[-\s]?free\b|\bgf\b/i },
  { key: "is_spicy", regex: /\bspicy\b|\bchili\b|\bchilli\b|\bhot\b/i },
  { key: "is_halal", regex: /\bhalal\b/i },
];

type PriceMatch = {
  index: number;
  end: number;
  price: number;
  currency: string;
};

function roundPrice(value: number): number {
  return Math.round(value * 100) / 100;
}

function hasLetter(value: string): boolean {
  return UNICODE_LETTER_REGEX.test(value);
}

function normalizeMenuData(menuData: MenuData, restaurantFallback: string): MenuData {
  const restaurantName =
    menuData.restaurant_name?.trim() || restaurantFallback || "My Restaurant";

  const sections = menuData.sections
    .map((section) => ({
      ...section,
      name: section.name.trim(),
      items: section.items
        .map((item) => ({
          ...item,
          name: item.name.trim(),
          description: item.description?.trim() || "",
          price: roundPrice(item.price),
          currency: (item.currency || "USD").toUpperCase(),
        }))
        .filter((item) => item.name.length > 0),
    }))
    .filter((section) => section.name.length > 0)
    .filter((section) => section.items.length > 0);

  return {
    restaurant_name: restaurantName,
    sections,
  };
}

export interface ParsedMenuDataResult {
  menuData: MenuData;
  confidence: number | null;
}

export function parseExtractedMenuData(
  raw: unknown,
  restaurantFallback: string,
): ParsedMenuDataResult {
  const extraction = extractionResponseSchema.safeParse(raw);
  if (extraction.success) {
    return {
      menuData: normalizeMenuData(extraction.data.menu_data, restaurantFallback),
      confidence: extraction.data.confidence ?? null,
    };
  }

  const direct = menuDataSchema.parse(raw);
  return {
    menuData: normalizeMenuData(direct, restaurantFallback),
    confidence: null,
  };
}

function detectDefaultCurrency(text: string): string {
  const codeMatch = text.match(CURRENCY_CODE_REGEX);
  if (codeMatch) return codeMatch[1].toUpperCase();

  for (const [symbol, code] of Object.entries(CURRENCY_SYMBOL_MAP)) {
    if (text.includes(symbol)) return code;
  }

  return "USD";
}

function normalizeCurrencyToken(token: string | undefined, fallback: string): string {
  if (!token) return fallback;
  const normalized = token.toUpperCase();
  if (normalized in CURRENCY_SYMBOL_MAP) {
    return CURRENCY_SYMBOL_MAP[normalized];
  }
  if (normalized === "$") return "USD";
  if (normalized === "€") return "EUR";
  if (normalized === "£") return "GBP";
  return normalized;
}

function stripListPrefix(line: string): string {
  return line
    .replace(/^[\-*•\u2022]+/, "")
    .replace(/^\d+[\).:-]\s*/, "")
    .trim();
}

function countExplicitPriceAnchors(text: string): number {
  const matcher = new RegExp(
    PRICE_WITH_CURRENCY_REGEX.source,
    PRICE_WITH_CURRENCY_REGEX.flags,
  );
  return [...text.matchAll(matcher)].length;
}

function inferDietaryTags(text: string) {
  const tagState: Partial<
    Pick<
      MenuData["sections"][number]["items"][number],
      "is_vegetarian" | "is_vegan" | "is_gluten_free" | "is_spicy" | "is_halal"
    >
  > = {};
  const source = text.trim();
  if (!source) return tagState;

  for (const { key, regex } of DIETARY_KEYWORD_MAP) {
    if (regex.test(source)) {
      tagState[key] = true;
    }
  }

  return tagState;
}

export function isSuspiciousCompositeItemName(name: string): boolean {
  const cleaned = name.replace(/\s+/g, " ").trim();
  if (!cleaned) return true;
  if (countExplicitPriceAnchors(cleaned) >= 1) return true;

  const sectionMatches = cleaned.match(SECTION_KEYWORD_INLINE_REGEX) || [];
  if (sectionMatches.length >= 2) return true;
  if (sectionMatches.length === 1) {
    const startsWithSectionKeyword = new RegExp(
      `^${sectionMatches[0]}\\b`,
      "i",
    ).test(cleaned);
    if (startsWithSectionKeyword && cleaned.split(/\s+/).length >= 6) return true;
  }

  return false;
}

function isSectionHeader(line: string): boolean {
  const cleaned = line
    .replace(/^[\-*•\u2022\d.)\s]+/, "")
    .replace(/[:\-–—]+$/, "")
    .trim();
  if (!cleaned) return false;

  const hasPrice = /\d{1,5}(?:[.,]\d{1,2})?/.test(cleaned);
  if (hasPrice) return false;

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 6) return false;

  const allCaps = cleaned === cleaned.toUpperCase() && /[A-Z]/.test(cleaned);
  const endsWithColon = /[:：]$/.test(line.trim());
  const hasListKeyword = MENU_SECTION_KEYWORDS_REGEX.test(cleaned);

  return allCaps || endsWithColon || hasListKeyword;
}

function parseNumericAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.,]/g, "");
  if (!cleaned) return null;
  const normalized = cleaned.includes(",") && !cleaned.includes(".")
    ? cleaned.replace(",", ".")
    : cleaned.replace(/,/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? roundPrice(parsed) : null;
}

function findPriceMatches(line: string, defaultCurrency: string): PriceMatch[] {
  const matches: PriceMatch[] = [];

  const beforeCurrency =
    /(?:^|[\s\-–—:|])(?:(AED|USD|EUR|GBP|SAR|QAR|OMR|KWD|BHD|PKR|INR|JPY|CNY|CAD|AUD|CHF|\$|€|£)\s*)(\d{1,5}(?:[.,]\d{1,2})?)/gi;
  let match = beforeCurrency.exec(line);
  while (match) {
    const price = parseNumericAmount(match[2]);
    if (price !== null) {
      matches.push({
        index: match.index,
        end: beforeCurrency.lastIndex,
        price,
        currency: normalizeCurrencyToken(match[1], defaultCurrency),
      });
    }
    match = beforeCurrency.exec(line);
  }

  const afterCurrency =
    /(?:^|[\s\-–—:|])(\d{1,5}(?:[.,]\d{1,2})?)\s*(AED|USD|EUR|GBP|SAR|QAR|OMR|KWD|BHD|PKR|INR|JPY|CNY|CAD|AUD|CHF|\$|€|£)/gi;
  match = afterCurrency.exec(line);
  while (match) {
    const price = parseNumericAmount(match[1]);
    if (price !== null) {
      matches.push({
        index: match.index,
        end: afterCurrency.lastIndex,
        price,
        currency: normalizeCurrencyToken(match[2], defaultCurrency),
      });
    }
    match = afterCurrency.exec(line);
  }

  const trailingNumber = /(?:^|[\s\-–—:|])(\d{1,5}(?:[.,]\d{1,2})?)\s*$/g;
  match = trailingNumber.exec(line);
  while (match) {
    const price = parseNumericAmount(match[1]);
    if (price !== null) {
      matches.push({
        index: match.index,
        end: trailingNumber.lastIndex,
        price,
        currency: defaultCurrency,
      });
    }
    match = trailingNumber.exec(line);
  }

  const deduped = new Map<string, PriceMatch>();
  for (const candidate of matches) {
    const key = [
      candidate.index,
      candidate.end,
      candidate.price,
      candidate.currency,
    ].join(":");
    deduped.set(key, candidate);
  }

  return [...deduped.values()].sort((a, b) => a.index - b.index);
}

function splitLineByMultiplePrices(line: string, defaultCurrency: string): string[] {
  const trimmed = line.trim();
  if (!trimmed) return [];

  const matches = findPriceMatches(trimmed, defaultCurrency);
  if (matches.length < 2) return [trimmed];

  const segments: string[] = [];
  let start = 0;
  for (const match of matches) {
    const segment = trimmed.slice(start, match.end).trim();
    if (segment) segments.push(segment);
    start = match.end;
  }
  const tail = trimmed.slice(start).trim();
  if (tail && segments.length > 0) {
    segments[segments.length - 1] = `${segments[segments.length - 1]} ${tail}`.trim();
  }

  if (segments.length < 2) return [trimmed];
  const validSegments = segments.filter(
    (segment) =>
      hasLetter(segment) && findPriceMatches(segment, defaultCurrency).length >= 1,
  );
  if (validSegments.length < 2) return [trimmed];

  return validSegments;
}

function splitSectionPrefixFromPricedLine(
  line: string,
  defaultCurrency: string,
): string[] {
  const trimmed = line.trim();
  if (!trimmed) return [];

  const match = trimmed.match(SECTION_PREFIX_IN_LINE_REGEX);
  if (!match) return [trimmed];

  const section = match[1].trim();
  const rest = match[2].trim();
  if (!rest) return [trimmed];
  if (findPriceMatches(rest, defaultCurrency).length === 0) return [trimmed];
  return [`${section}:`, rest];
}

function isTabularHeader(columns: string[]): boolean {
  if (columns.length < 2) return false;
  const normalized = columns.map((column) =>
    column.replace(/[:\-–—\s]+$/g, "").trim().toLowerCase(),
  );
  const headerLikeColumns = normalized.filter((column) =>
    TABULAR_HEADER_KEYWORD_REGEX.test(column),
  );
  return headerLikeColumns.length >= 2;
}

function normalizeTabularSectionName(value: string): string | null {
  const cleaned = value.replace(/[:\-–—\s]+$/g, "").trim();
  if (!cleaned) return null;
  if (!hasLetter(cleaned)) return null;
  if (TABULAR_HEADER_KEYWORD_REGEX.test(cleaned.toLowerCase())) return null;
  return cleaned;
}

function findTabularPriceColumn(columns: string[]): number {
  for (let i = columns.length - 1; i >= 0; i--) {
    const candidate = columns[i];
    if (parseStandalonePrice(candidate, "USD")) return i;
    if (/^\d{1,5}(?:[.,]\d{1,2})?$/.test(candidate.trim())) return i;
  }
  return -1;
}

function expandTabularLine(
  line: string,
  previousSection: string | null,
): { handled: boolean; lines: string[]; sectionName: string | null } {
  if (!line.includes("\t")) {
    return { handled: false, lines: [line], sectionName: previousSection };
  }

  const columns = line
    .split(/\t+/)
    .map((column) => column.trim())
    .filter(Boolean);
  if (columns.length < 2) {
    return { handled: false, lines: [line], sectionName: previousSection };
  }

  if (isTabularHeader(columns)) {
    return { handled: true, lines: [], sectionName: previousSection };
  }

  let section = "";
  let item = "";
  let description = "";
  let price = "";
  const priceColumnIndex = findTabularPriceColumn(columns);

  if (columns.length >= 4) {
    section = columns[0] || "";
    item = columns[1] || "";
    if (priceColumnIndex >= 2) {
      description = columns.slice(2, priceColumnIndex).join(" ");
      price = columns[priceColumnIndex] || "";
    } else {
      description = columns.slice(2).join(" ");
    }
  } else if (columns.length === 3) {
    if (priceColumnIndex === 2) {
      section = columns[0] || "";
      item = columns[1] || "";
      price = columns[2] || "";
    } else {
      item = columns[0] || "";
      description = columns[1] || "";
      price = columns[2] || "";
    }
  } else {
    item = columns[0] || "";
    price = columns[1] || "";
  }

  if (!hasLetter(item)) {
    const fallbackItem = columns.find(
      (column) =>
        hasLetter(column) &&
        !TABULAR_HEADER_KEYWORD_REGEX.test(column.toLowerCase()) &&
        !parseStandalonePrice(column, "USD"),
    );
    item = fallbackItem || item;
  }

  const lines: string[] = [];
  const normalizedSection = normalizeTabularSectionName(section);
  let activeSection = previousSection;
  if (normalizedSection && normalizedSection !== previousSection) {
    lines.push(`${normalizedSection}:`);
    activeSection = normalizedSection;
  }

  let itemLine = item.trim();
  if (description.trim()) itemLine = `${itemLine} - ${description.trim()}`;
  if (price.trim()) itemLine = `${itemLine} ${price.trim()}`;
  itemLine = itemLine.trim();
  if (itemLine && hasLetter(itemLine)) {
    lines.push(itemLine);
  }

  if (lines.length === 0) {
    const collapsed = columns.join(" ").trim();
    return {
      handled: true,
      lines: collapsed ? [collapsed] : [],
      sectionName: previousSection,
    };
  }

  return { handled: true, lines, sectionName: activeSection };
}

function normalizeRawTextLines(rawText: string, defaultCurrency: string): string[] {
  const sourceLines = rawText.replace(/\u00a0/g, " ").split(/\r?\n/);
  const normalizedLines: string[] = [];
  let previousTabularSection: string | null = null;

  for (const sourceLine of sourceLines) {
    const trimmed = sourceLine.trim();
    if (!trimmed) {
      normalizedLines.push("");
      previousTabularSection = null;
      continue;
    }

    const baseChunks = trimmed.includes(";")
      ? trimmed
          .split(";")
          .map((chunk) => chunk.trim())
          .filter(Boolean)
      : [trimmed];

    for (const baseChunk of baseChunks) {
      const tabular = expandTabularLine(baseChunk, previousTabularSection);
      if (tabular.handled) {
        previousTabularSection = tabular.sectionName;
        for (const tabLine of tabular.lines) {
          const splitByPrice = splitLineByMultiplePrices(tabLine, defaultCurrency);
          for (const splitLine of splitByPrice) {
            const withSectionPrefixSplit = splitSectionPrefixFromPricedLine(
              splitLine,
              defaultCurrency,
            );
            normalizedLines.push(
              ...withSectionPrefixSplit.map((line) => line.trim()).filter(Boolean),
            );
          }
        }
        continue;
      }

      previousTabularSection = null;
      const splitByPrice = splitLineByMultiplePrices(baseChunk, defaultCurrency);
      for (const splitLine of splitByPrice) {
        const withSectionPrefixSplit = splitSectionPrefixFromPricedLine(
          splitLine,
          defaultCurrency,
        );
        normalizedLines.push(
          ...withSectionPrefixSplit.map((line) => line.trim()).filter(Boolean),
        );
      }
    }
  }

  return normalizedLines;
}

function parseStandalonePrice(
  line: string,
  defaultCurrency: string,
): { price: number; currency: string } | null {
  const cleaned = line.replace(/[•*·\s]+/g, " ").trim();
  if (!cleaned || cleaned.length > 42) return null;

  const match = cleaned.match(
    /^(?:price[:\s-]*)?(?:(AED|USD|EUR|GBP|SAR|QAR|OMR|KWD|BHD|PKR|INR|JPY|CNY|CAD|AUD|CHF|\$|€|£)\s*)?(\d{1,5}(?:[.,]\d{1,2})?)\s*(AED|USD|EUR|GBP|SAR|QAR|OMR|KWD|BHD|PKR|INR|JPY|CNY|CAD|AUD|CHF)?$/i,
  );

  if (!match) return null;
  const price = parseNumericAmount(match[2]);
  if (price === null) return null;
  const currency = normalizeCurrencyToken(
    match[1] || match[3] || undefined,
    defaultCurrency,
  );
  return { price, currency };
}

function parseItemLine(line: string, defaultCurrency: string) {
  const cleaned = stripListPrefix(line);
  if (!cleaned) return null;

  const normalized = cleaned.replace(/[.·•]{3,}/g, " ");
  const matches = findPriceMatches(normalized, defaultCurrency);
  if (matches.length === 0) return null;
  const selected = matches[matches.length - 1];

  const beforePrice = normalized
    .slice(0, selected.index)
    .replace(/[\-–—:|.\s]+$/, "")
    .trim();
  const afterPrice = normalized
    .slice(selected.end)
    .replace(/^[\s\-–—:|.]+/, "")
    .trim();

  let name = beforePrice || afterPrice;
  let description = "";

  if (!name) return null;

  const splitByDash = name.split(/\s[–—-]\s/);
  if (splitByDash.length > 1) {
    name = splitByDash[0].trim();
    description = splitByDash.slice(1).join(" - ").trim();
  }

  if (!description && name.includes("|")) {
    const splitByPipe = name.split("|").map((part) => part.trim()).filter(Boolean);
    if (splitByPipe.length > 1) {
      name = splitByPipe[0];
      description = splitByPipe.slice(1).join(" ");
    }
  }

  if (!description && /:\s+/.test(name)) {
    const splitByColon = name.split(/:\s+/).map((part) => part.trim()).filter(Boolean);
    if (splitByColon.length > 1 && splitByColon[0].split(/\s+/).length <= 6) {
      name = splitByColon[0];
      description = splitByColon.slice(1).join(" ");
    }
  }

  if (!description && /\t+/.test(name)) {
    const splitByTab = name.split(/\t+/).map((part) => part.trim()).filter(Boolean);
    if (splitByTab.length > 1) {
      name = splitByTab[0];
      description = splitByTab.slice(1).join(" ");
    }
  }

  if (!description && /\s{2,}/.test(name)) {
    const splitBySpacing = name.split(/\s{2,}/).map((part) => part.trim()).filter(Boolean);
    if (splitBySpacing.length > 1) {
      name = splitBySpacing[0];
      description = splitBySpacing.slice(1).join(" ");
    }
  }

  if (!description && afterPrice && afterPrice !== name) {
    description = afterPrice;
  }

  const clearTrailingCurrency = (value: string) =>
    value
      .replace(/\b(AED|USD|EUR|GBP|SAR|QAR|OMR|KWD|BHD|PKR|INR|JPY|CNY|CAD|AUD|CHF)\b$/i, "")
      .replace(/[\-–—:|.\s]+$/, "")
      .trim();

  name = clearTrailingCurrency(name);
  description = clearTrailingCurrency(description);

  if (!name || !hasLetter(name)) return null;
  if (isSuspiciousCompositeItemName(name)) return null;

  const dietaryTags = inferDietaryTags([name, description].filter(Boolean).join(" "));

  return {
    name,
    description,
    price: selected.price,
    currency: selected.currency,
    ...dietaryTags,
  };
}

function getNextNonEmptyLine(lines: string[], startIndex: number): string | null {
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (line) return line;
  }
  return null;
}

function isLikelyDescriptionLine(line: string): boolean {
  if (!line) return false;
  const cleaned = stripListPrefix(line);
  if (!cleaned) return false;
  if (cleaned.length > 90) return true;
  if (/[,.]\s+[a-z]/.test(cleaned)) return true;
  if (/[.!?]$/.test(cleaned) && cleaned.split(/\s+/).length >= 5) return true;

  return /^(served|with|contains|includes|topped|drizzled|choice of|our|fresh|crispy|slow|house|chef|marinated)\b/i.test(
    cleaned,
  );
}

function isLikelyItemNameLine(line: string): boolean {
  const cleaned = stripListPrefix(line).replace(/[:\-–—]+$/, "").trim();
  if (!cleaned) return false;
  if (!hasLetter(cleaned)) return false;
  if (isLikelyDescriptionLine(cleaned)) return false;
  if (cleaned.length > 80) return false;
  if (/\d{1,5}(?:[.,]\d{1,2})/.test(cleaned)) return false;
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 10) return false;
  if (MENU_SECTION_KEYWORDS_REGEX.test(cleaned)) return false;

  const latinWords = words.filter((word) => /[A-Za-z]/.test(word));
  if (latinWords.length === 0) {
    return words.length <= 6;
  }

  const capitalizedWords = words.filter((word) => /^[A-Z]/.test(word)).length;
  return words.length <= 3 || capitalizedWords >= Math.ceil(words.length / 2);
}

export interface MenuStructureSignals {
  items: number;
  itemsWithPrice: number;
  compositeNames: number;
  compositeNameRatio: number;
  invalidSections: number;
}

export function getMenuStructureSignals(menuData: MenuData): MenuStructureSignals {
  let items = 0;
  let itemsWithPrice = 0;
  let compositeNames = 0;
  let invalidSections = 0;

  for (const section of menuData.sections) {
    if (!section.name?.trim()) {
      invalidSections += 1;
    }
    if (!Array.isArray(section.items) || section.items.length === 0) {
      invalidSections += 1;
      continue;
    }

    for (const item of section.items) {
      items += 1;
      if (typeof item.price === "number" && item.price > 0) itemsWithPrice += 1;
      if (isSuspiciousCompositeItemName(item.name)) compositeNames += 1;
    }
  }

  return {
    items,
    itemsWithPrice,
    compositeNames,
    compositeNameRatio: items > 0 ? compositeNames / items : 1,
    invalidSections,
  };
}

export function parseMenuFromRawTextHeuristic(
  rawText: string,
  restaurantFallback: string,
): ParsedMenuDataResult {
  const defaultCurrency = detectDefaultCurrency(rawText);
  const rawLines = normalizeRawTextLines(rawText, defaultCurrency);

  const sections: MenuData["sections"] = [];
  let currentSection: MenuData["sections"][number] = { name: "Main", items: [] };
  const fallbackCandidateLines: string[] = [];
  let pendingItem:
    | {
        name: string;
        descriptionParts: string[];
        price: number;
        currency: string;
      }
    | null = null;

  const flushPendingItem = () => {
    if (!pendingItem) return;
    const name = stripListPrefix(pendingItem.name).replace(/[.\s]+$/, "").trim();
    if (!name || !hasLetter(name) || isSuspiciousCompositeItemName(name)) {
      pendingItem = null;
      return;
    }
    const description = pendingItem.descriptionParts.join(" ").trim();
    const dietaryTags = inferDietaryTags([name, description].filter(Boolean).join(" "));
    currentSection.items.push({
      name,
      description,
      price: pendingItem.price,
      currency: pendingItem.currency,
      ...dietaryTags,
    });
    pendingItem = null;
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    if (!line) {
      if (pendingItem && pendingItem.descriptionParts.length > 0) {
        flushPendingItem();
      }
      continue;
    }

    if (isSectionHeader(line)) {
      flushPendingItem();
      if (currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      currentSection = {
        name: line.replace(/[:：\s]+$/, "").trim(),
        items: [],
      };
      continue;
    }

    const item = parseItemLine(line, defaultCurrency);
    if (item) {
      flushPendingItem();
      currentSection.items.push(item);
      continue;
    }

    const standalonePrice = parseStandalonePrice(line, defaultCurrency);
    if (standalonePrice) {
      if (pendingItem) {
        pendingItem.price = standalonePrice.price;
        pendingItem.currency = standalonePrice.currency;
        flushPendingItem();
        continue;
      }
      if (currentSection.items.length > 0) {
        const lastItem = currentSection.items[currentSection.items.length - 1];
        if (!lastItem.price || lastItem.price === 0) {
          lastItem.price = standalonePrice.price;
          lastItem.currency = standalonePrice.currency;
          continue;
        }
      }
      fallbackCandidateLines.push(line);
      continue;
    }

    const cleanedLine = stripListPrefix(line).replace(/[.\s]+$/, "").trim();
    if (!cleanedLine) continue;

    const nextLine = getNextNonEmptyLine(rawLines, i + 1);
    const nextLinePrice = nextLine ? parseStandalonePrice(nextLine, defaultCurrency) : null;
    const lineLooksDescription = isLikelyDescriptionLine(cleanedLine);
    const lineLooksName = isLikelyItemNameLine(cleanedLine);

    if (pendingItem) {
      if (lineLooksName && !lineLooksDescription && pendingItem.descriptionParts.length > 0) {
        flushPendingItem();
        pendingItem = {
          name: cleanedLine,
          descriptionParts: [],
          price: 0,
          currency: defaultCurrency,
        };
        continue;
      }

      pendingItem.descriptionParts.push(cleanedLine);
      continue;
    }

    if (lineLooksName || nextLinePrice) {
      pendingItem = {
        name: cleanedLine,
        descriptionParts: [],
        price: 0,
        currency: defaultCurrency,
      };
      continue;
    }

    if (currentSection.items.length > 0 && cleanedLine.length <= 180) {
      const last = currentSection.items[currentSection.items.length - 1];
      last.description = [last.description, cleanedLine].filter(Boolean).join(" ").trim();
      continue;
    }

    fallbackCandidateLines.push(cleanedLine);
  }

  flushPendingItem();

  if (currentSection.items.length > 0) {
    sections.push(currentSection);
  }

  if (sections.length === 0) {
    const delimiterSplit = rawText
      .replace(/\u00a0/g, " ")
      .split(/\r?\n|[;•\u2022]/)
      .map((line) => stripListPrefix(line).trim())
      .filter(Boolean);
    const fallbackLines = [...fallbackCandidateLines, ...delimiterSplit];
    const seen = new Set<string>();
    const items = fallbackLines
      .slice(0, 100)
      .map((line) => parseItemLine(line, defaultCurrency) ?? line)
      .map((candidate) => {
        if (typeof candidate !== "string") return candidate;
        const dietaryTags = inferDietaryTags(candidate);
        return {
          name: candidate,
          description: "",
          price: 0,
          currency: defaultCurrency,
          ...dietaryTags,
        };
      })
      .filter((item) => item.name.length > 0)
      .filter((item) => {
        const key = item.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 40);

    if (items.length > 0) {
      sections.push({ name: "Main", items });
    }
  }

  return {
    menuData: normalizeMenuData(
      {
        restaurant_name: restaurantFallback || "My Restaurant",
        sections,
      },
      restaurantFallback,
    ),
    confidence: 0.35,
  };
}

export function buildMenuDataStarter(restaurantName: string): MenuData {
  return {
    restaurant_name: restaurantName || "My Restaurant",
    sections: [
      {
        name: "Main",
        items: [
          {
            name: "",
            description: "",
            price: 0,
            currency: "USD",
          },
        ],
      },
    ],
  };
}

export function countMenuItems(menuData: MenuData | null): number {
  if (!menuData) return 0;
  return menuData.sections.reduce((sum, section) => sum + section.items.length, 0);
}

export function countMenuItemsWithPrice(menuData: MenuData | null): number {
  if (!menuData) return 0;
  return menuData.sections.reduce(
    (sum, section) =>
      sum + section.items.filter((item) => typeof item.price === "number" && item.price > 0).length,
    0,
  );
}

export function countMenuItemsWithDescription(menuData: MenuData | null): number {
  if (!menuData) return 0;
  return menuData.sections.reduce(
    (sum, section) =>
      sum + section.items.filter((item) => typeof item.description === "string" && item.description.trim().length > 0).length,
    0,
  );
}
