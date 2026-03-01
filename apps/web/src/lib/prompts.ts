import type { MenuData, MenuFormat, PageLayout } from "@/types/menu";

interface PromptVariables {
  restaurant_name: string;
  section_names: string;
  top_items: string;
  price_range: string;
  currency: string;
  item_count: string;
}

export function extractVariables(menuData: MenuData | null, restaurantName: string): PromptVariables {
  if (!menuData) {
    return {
      restaurant_name: restaurantName || "Restaurant",
      section_names: "Menu",
      top_items: "various dishes",
      price_range: "",
      currency: "",
      item_count: "0",
    };
  }

  const allItems = menuData.sections.flatMap((s) => s.items);
  const prices = allItems.map((i) => i.price).filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const currency = allItems[0]?.currency || "USD";

  return {
    restaurant_name: menuData.restaurant_name || restaurantName || "Restaurant",
    section_names: menuData.sections.map((s) => s.name).join(", "),
    top_items: allItems
      .slice(0, 5)
      .map((i) => i.name)
      .join(", "),
    price_range: prices.length ? `${minPrice}-${maxPrice}` : "",
    currency,
    item_count: String(allItems.length),
  };
}

export function resolveTemplate(
  template: string,
  variables: PromptVariables,
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

export function buildFormatModifier(format: MenuFormat | null): string | null {
  switch (format) {
    case "photo":
      return "Photo-dominant menu design with large, high-quality food photography filling most of the space. Minimal text, focus on visual appetite appeal";
    case "balanced":
      return "Balanced menu layout with equal emphasis on food photography and readable text. Clear sections with both images and descriptions";
    case "text_only":
      return "Typography-focused elegant menu design with NO food photographs. Use decorative borders, ornamental dividers, and sophisticated typographic hierarchy instead";
    default:
      return null;
  }
}

export function buildLayoutModifier(layout: PageLayout | null): string | null {
  switch (layout) {
    case "single":
      return "Single page menu design, all content on one side";
    case "front_back":
      return "This is the FRONT PAGE of a two-sided menu. Design as a cover/main page that sets the tone for the full menu";
    case "booklet":
      return "This is the COVER/FIRST PAGE of a multi-page menu booklet. Design as a striking opening page";
    default:
      return null;
  }
}

export function buildColorDirective(palette: string[] | null): string | null {
  if (!palette || palette.length === 0) return null;
  const colorList = palette.map((c) => c.toUpperCase()).join(", ");
  return `Use EXACTLY this color palette for the design: ${colorList}. These are the primary colors — derive any additional shades from these base colors`;
}

const LOGO_PLACEHOLDER =
  "Leave a clearly marked empty rectangular space in the header/top area for the restaurant logo to be placed later";

const QUALITY_SUFFIX_WITH_PHOTOS =
  "Professional print-ready restaurant menu design, high resolution, clean readable typography, cohesive color palette, photorealistic food elements";

const QUALITY_SUFFIX_TEXT_ONLY =
  "Professional print-ready restaurant menu design, high resolution, clean readable typography, cohesive color palette, elegant decorative elements";

export function buildFullPrompt(
  styleContext: string | null,
  cuisineContext: string | null,
  formatModifier: string | null,
  layoutModifier: string | null,
  colorDirective: string | null,
  variantPrompt: string,
  variables: PromptVariables,
  menuFormat: MenuFormat | null,
): string {
  const parts: string[] = [];

  if (styleContext) parts.push(styleContext);
  if (cuisineContext) parts.push(cuisineContext);
  if (formatModifier) parts.push(formatModifier);
  if (layoutModifier) parts.push(layoutModifier);
  if (colorDirective) parts.push(colorDirective);
  parts.push(LOGO_PLACEHOLDER);
  parts.push(resolveTemplate(variantPrompt, variables));

  // Menu data context
  const menuContext = `Restaurant: '${variables.restaurant_name}'. Sections: ${variables.section_names}. Featured items: ${variables.top_items}. ${variables.price_range ? `Price range: ${variables.price_range} ${variables.currency}.` : ""} ${variables.item_count} total items.`;
  parts.push(menuContext);

  const qualitySuffix =
    menuFormat === "text_only"
      ? QUALITY_SUFFIX_TEXT_ONLY
      : QUALITY_SUFFIX_WITH_PHOTOS;
  parts.push(qualitySuffix);

  return parts.join(". ");
}

// Fallback prompts when no prompt_templates exist in DB yet
export const FALLBACK_VARIANT_PROMPTS = [
  "Classic centered layout with decorative border and elegant header, formal dining menu presentation",
  "Modern asymmetric layout with large hero food photography area, contemporary menu card design",
  "Multi-column layout with illustrated section dividers, creative menu with artistic flair",
  "Full-bleed textured background with floating text panels, dramatic and immersive menu design",
];
