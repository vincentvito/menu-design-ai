import type { MenuData, MenuFormat, PageLayout } from "@/types/menu";
import { mapPaletteToRoles } from "@/lib/palette-roles";

// ============================================================
// Types
// ============================================================

export interface PromptConfig {
  identity: string;
  artDirection: string;
  colorAndMaterial: string;
  contentGuidance: string;
  variantPersonality: string;
  technicalQuality: string;
}

export interface VariantPrompt {
  prompt: string;
  mood: string;
  description: string;
}

interface EnrichedMenuContext {
  restaurantName: string;
  sectionCount: number;
  itemCount: number;
  priceTier: "casual" | "mid-range" | "upscale";
  hasVeganFocus: boolean;
  hasHalalFocus: boolean;
  hasSpicyFocus: boolean;
  featuredItems: string[];
  sectionNames: string[];
  topItemNames: string[];
  priceRange: { min: number; max: number; currency: string } | null;
}

// ============================================================
// Color Utilities
// ============================================================

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    default:
      h = ((r - g) / d + 4) / 6;
  }

  return { h: h * 360, s, l };
}

export function hexToColorName(hex: string): string {
  const { h, s, l } = hexToHSL(hex);

  // Near-black
  if (l < 0.12) return "near black";
  // Very dark
  if (l < 0.2) {
    if (s < 0.15) return "charcoal";
    if (h >= 200 && h < 260) return "deep navy";
    if (h >= 260 && h < 310) return "deep plum";
    if (h >= 0 && h < 30) return "deep maroon";
    if (h >= 100 && h < 170) return "deep forest green";
    if (h >= 170 && h < 200) return "deep teal";
    return "very dark " + getHueName(h);
  }
  // Dark
  if (l < 0.35) {
    if (s < 0.15) return "dark gray";
    if (h >= 20 && h < 45) return "chocolate brown";
    if (h >= 0 && h < 20) return "dark crimson";
    if (h >= 100 && h < 160) return "forest green";
    if (h >= 200 && h < 250) return "navy blue";
    if (h >= 250 && h < 300) return "royal purple";
    return "dark " + getHueName(h);
  }
  // Medium
  if (l < 0.55) {
    if (s < 0.15) return "medium gray";
    if (h >= 15 && h < 45 && s > 0.4) return "warm amber";
    if (h >= 0 && h < 15) return "rich red";
    if (h >= 45 && h < 70) return "olive";
    if (h >= 100 && h < 160) return "emerald green";
    if (h >= 160 && h < 200) return "teal";
    if (h >= 200 && h < 250) return "steel blue";
    if (h >= 250 && h < 290) return "violet";
    if (h >= 290 && h < 340) return "magenta";
    return getHueName(h);
  }
  // Light-medium
  if (l < 0.75) {
    if (s < 0.15) return "silver gray";
    if (h >= 30 && h < 55) return "warm gold";
    if (h >= 15 && h < 30) return "copper";
    if (h >= 0 && h < 15) return "coral";
    if (h >= 55 && h < 80) return "sage";
    if (h >= 100 && h < 160) return "soft green";
    if (h >= 160 && h < 200) return "aqua";
    if (h >= 200 && h < 250) return "sky blue";
    if (h >= 290 && h < 340) return "rose";
    return "soft " + getHueName(h);
  }
  // Light
  if (l < 0.9) {
    if (s < 0.15) return "light gray";
    if (h >= 30 && h < 60) return "warm cream";
    if (h >= 0 && h < 30) return "blush pink";
    if (h >= 60 && h < 80) return "pale gold";
    if (h >= 100 && h < 170) return "mint";
    if (h >= 200 && h < 260) return "pale blue";
    if (h >= 280 && h < 340) return "lavender";
    return "pale " + getHueName(h);
  }
  // Near-white
  if (s < 0.1) return "off-white";
  if (h >= 30 && h < 70) return "ivory";
  if (h >= 0 && h < 30) return "warm white";
  return "near white";
}

function getHueName(h: number): string {
  if (h < 15) return "red";
  if (h < 40) return "orange";
  if (h < 70) return "yellow";
  if (h < 160) return "green";
  if (h < 200) return "teal";
  if (h < 260) return "blue";
  if (h < 300) return "purple";
  if (h < 340) return "pink";
  return "red";
}

// ============================================================
// Cuisine-Specific Food Styling
// ============================================================

const CUISINE_FOOD_STYLING: Record<string, { photo: string; balanced: string }> = {
  italian: {
    photo: "Rustic Italian food styling with handmade ceramic plates on a reclaimed wood surface. Olive oil drizzles, fresh basil sprigs, cracked black pepper, and dusted flour visible as props. Pasta dishes show al dente texture, pizzas show charred crust bubbles.",
    balanced: "Clean Italian plating on white ceramic with a tomato-red cloth napkin and olive wood serving board in the background.",
  },
  arabic: {
    photo: "Abundant Middle Eastern mezze spread on ornate brass trays and hand-painted ceramic bowls. Warm pita bread, scattered pomegranate seeds, fresh mint, and sumac dusting create a feast atmosphere.",
    balanced: "Elegant Arabic plating on decorative ceramics with gold-trimmed edges against a dark textured background.",
  },
  japanese: {
    photo: "Precise Japanese plating on minimalist ceramic pieces — asymmetric plates, small dipping bowls, and lacquerware. Negative space is intentional. Garnished with shiso leaves, microgreens, and precise sauce dots.",
    balanced: "Clean zen-inspired food presentation on earth-toned stoneware with natural bamboo props and a neutral background.",
  },
  indian: {
    photo: "Vibrant Indian food styling with colorful curries in copper serving bowls (handi), naan bread draped naturally, bright turmeric yellows, rich reds, and scattered fresh coriander and whole spices as props.",
    balanced: "Warm Indian plating on brass thali plates with small katori bowls, colorful chutneys visible alongside.",
  },
  french: {
    photo: "Refined French plating with precise sauce work on wide-rimmed white porcelain. Micro herb garnishes, edible flowers, and delicate jus drizzles. Each plate is a composed artwork with generous negative space.",
    balanced: "Elegant Parisian presentation on fine white china with a linen napkin and silver cutlery partially visible.",
  },
  mexican: {
    photo: "Vibrant Mexican food styling on colorful Talavera pottery and hand-woven textiles. Lime wedges, fresh cilantro, sliced jalapeños, and crumbled queso fresco as garnish. Salsas in molcajete stone bowls.",
    balanced: "Festive Mexican plating on terracotta dishes with colorful hand-painted patterns and a lime wedge accent.",
  },
  chinese: {
    photo: "Family-style Chinese food presentation in large ceramic bowls and bamboo steamers. Chopsticks resting on ceramic rests, tea pot partially visible, glistening sauce on stir-fry dishes, delicate dim sum in bamboo baskets.",
    balanced: "Clean Chinese plating on celadon glazed dishes with red chopsticks and a small tea cup accent.",
  },
  american: {
    photo: "Bold American comfort food styling on rustic stoneware and cast iron skillets. Thick-cut portions, melted cheese pulls, crispy textures, and butcher paper or parchment liners. Craft beer glass or mason jar partially visible.",
    balanced: "Contemporary American plating on matte ceramic with a clean industrial-rustic aesthetic and natural props.",
  },
  seafood: {
    photo: "Fresh coastal seafood display on crushed ice, slate boards, and weathered wooden planks. Lemon wedges, fresh dill, and coarse sea salt as garnish. Lobster and shellfish show vibrant pink-red color.",
    balanced: "Clean seafood presentation on white plates with ocean-blue napkin accents and a lemon wedge.",
  },
  cafe: {
    photo: "Cozy café styling with artisanal pastries on vintage cake stands and wooden boards. Latte art in ceramic cups, dusted powdered sugar, fresh berries, and natural morning light. Parchment paper and twine as props.",
    balanced: "Warm café plating on mismatched vintage china with a freshly brewed coffee cup and a pastry fork.",
  },
  mediterranean: {
    photo: "Sun-drenched Mediterranean spread on a rustic olive wood table. Fresh hummus drizzled with olive oil, colorful mezze plates, grilled halloumi with char marks, scattered capers and sun-dried tomatoes.",
    balanced: "Clean coastal Mediterranean presentation on white ceramic with blue accents and a sprig of rosemary.",
  },
  greek: {
    photo: "Taverna-style Greek food styling on blue-and-white ceramic plates. Thick yogurt with honey drizzle, glistening kalamata olives, crumbled feta, grilled lamb with visible char, fresh oregano sprigs.",
    balanced: "Simple Greek plating on white dishes with aegean blue napkin and olive branch garnish.",
  },
  levantine: {
    photo: "Generous Levantine mezze display on hand-painted ceramic plates. Creamy hummus with whole chickpeas, tabouleh bright with parsley, warm flatbread torn to show fluffy interior, pickled turnips and fresh radishes.",
    balanced: "Warm Levantine plating on earthy ceramic with pomegranate seed garnish and a small olive oil drizzle.",
  },
  turkish: {
    photo: "Lavish Turkish food styling on ornate copper trays and Iznik-patterned bowls. Kebabs with visible grill marks, pide bread showing golden crust, stuffed vine leaves glistening with oil, Turkish tea in tulip glasses.",
    balanced: "Rich Turkish presentation on copper-trimmed plates with a small glass of çay and fresh herb garnish.",
  },
  korean: {
    photo: "Colorful Korean banchan spread with 8+ small dishes surrounding a central entrée. Bibimbap in hot stone bowl showing sizzling edges, bright kimchi red, gleaming galbi, steaming rice, with metal chopsticks.",
    balanced: "Modern Korean plating on slate stone with a few banchan side dishes and stainless steel chopsticks.",
  },
  thai: {
    photo: "Tropical Thai food styling in banana leaf-lined bowls and woven baskets. Vibrant green and red curries, pad thai with bean sprouts and crushed peanuts, carved fruit garnishes, fresh lemongrass and kaffir lime leaves.",
    balanced: "Bright Thai presentation on dark ceramic with a lime wedge, fresh chili, and basil sprig garnish.",
  },
  vietnamese: {
    photo: "Fresh Vietnamese food styling with steaming pho in a large ceramic bowl, fresh herb plate (basil, mint, cilantro), translucent spring rolls, baguette banh mi showing colorful cross-section, and lime wedges.",
    balanced: "Light Vietnamese plating on white ceramic with fresh herbs and a small dipping sauce bowl.",
  },
  persian: {
    photo: "Regal Persian food styling on hand-painted minakari plates. Saffron-stained rice with crispy tahdig shown, jeweled rice with barberries and pistachios, herb-crusted kebabs, fresh herbs and radishes as accompaniment.",
    balanced: "Elegant Persian presentation on decorative ceramic with saffron threads and pistachio garnish.",
  },
  spanish: {
    photo: "Lively Spanish tapas styling on small terracotta plates and wooden boards. Glistening patatas bravas, jamón ibérico draped elegantly, olives in ceramic dishes, sherry glass partially visible, with a warm convivial atmosphere.",
    balanced: "Warm Spanish plating on terracotta with a small glass of sherry and olive branch accent.",
  },
  brazilian: {
    photo: "Vibrant Brazilian food styling with churrasco meats sliced tableside on a wooden board, feijoada in a clay pot, farofa in a coconut shell, açaí bowls with tropical fruit, and caipirinha glass partially visible.",
    balanced: "Tropical Brazilian presentation on warm wood with bright tropical fruit garnish and lush green accents.",
  },
  caribbean: {
    photo: "Colorful Caribbean food styling on bright painted plates and banana leaves. Jerk chicken showing smoky char, rice and peas in coconut shell, tropical fruit salsa, scotch bonnet peppers, and a rum punch glass.",
    balanced: "Island-style presentation on vibrant ceramic with tropical fruit garnish and palm frond accent.",
  },
  ethiopian: {
    photo: "Communal Ethiopian food styling on a large injera flatbread platter. Colorful wot stews in vibrant reds and yellows arranged in a circle, torn injera for scooping, berbere spice visible, served on a mesob basket.",
    balanced: "Warm Ethiopian presentation on a woven basket with injera and a small dish of berbere spice.",
  },
  steakhouse: {
    photo: "Premium steakhouse styling on a dark wooden board with a cast iron skillet. Perfectly seared steak showing a pink center cross-section, compound butter melting on top, charred asparagus, rock salt crystals, and a red wine glass partially visible.",
    balanced: "Bold steakhouse plating on dark slate with a steak knife and sprig of fresh rosemary.",
  },
  "sushi-bar": {
    photo: "Pristine sushi bar styling on a slate board with fresh sashimi showing jewel-like translucency, nigiri with glistening fish, detailed maki rolls in a perfect line, pickled ginger fan, wasabi quenelle, and soy sauce in a ceramic dish.",
    balanced: "Minimal sushi presentation on natural wood with a few premium nigiri pieces and delicate bamboo garnish.",
  },
  pizzeria: {
    photo: "Rustic pizzeria styling with a pizza on a wooden peel showing leopard-spotted crust, melted mozzarella stretching, fresh basil leaves, and a checkered tablecloth beneath. Flour dust, olive oil, and a pizza cutter as props.",
    balanced: "Casual pizzeria plating on a wooden board with fresh basil, red pepper flakes, and a parmesan wedge.",
  },
  brunch: {
    photo: "Sunny brunch styling on light ceramic with a marble or light wood surface. Avocado toast with a perfect poached egg, stacked pancakes with berry cascade, golden croissants, fresh-squeezed juice in a mason jar, and soft natural morning light.",
    balanced: "Airy brunch presentation on pastel ceramic with a coffee cup and small flower vase accent.",
  },
  vegan: {
    photo: "Fresh plant-based food styling on handcrafted ceramic with raw wood surfaces. Buddha bowls showing vibrant vegetable rainbows, grain and seed textures, spiralized vegetables, edible flower garnishes, and natural linen napkins.",
    balanced: "Clean vegan plating on earthy ceramic with a microgreen garnish and a small seed sprinkle.",
  },
  fusion: {
    photo: "Art-forward fusion food styling with creative plating on mixed ceramic styles. Unexpected ingredient pairings with vivid color contrasts, deconstructed presentations, sauce dots and swooshes, with modern minimalist props.",
    balanced: "Contemporary fusion plating on asymmetric ceramic with artistic sauce work and a single edible flower.",
  },
};

function getCuisineFoodStyling(cuisineSlug: string | null, format: "photo" | "balanced"): string {
  if (!cuisineSlug) return "";
  const styling = CUISINE_FOOD_STYLING[cuisineSlug];
  if (!styling) return "";
  return format === "photo" ? styling.photo : styling.balanced;
}

// ============================================================
// Menu Data Extraction
// ============================================================

export function extractEnrichedContext(menuData: MenuData | null, restaurantName: string): EnrichedMenuContext {
  if (!menuData) {
    return {
      restaurantName: restaurantName || "Restaurant",
      sectionCount: 0,
      itemCount: 0,
      priceTier: "mid-range",
      hasVeganFocus: false,
      hasHalalFocus: false,
      hasSpicyFocus: false,
      featuredItems: [],
      sectionNames: [],
      topItemNames: [],
      priceRange: null,
    };
  }

  const allItems = menuData.sections.flatMap((s) => s.items);
  const prices = allItems.map((i) => i.price).filter(Boolean);
  const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const currency = allItems[0]?.currency || "USD";

  const priceTier: EnrichedMenuContext["priceTier"] =
    avgPrice > 100 ? "upscale" : avgPrice > 40 ? "mid-range" : "casual";

  const veganCount = allItems.filter((i) => i.is_vegan).length;
  const halalCount = allItems.filter((i) => i.is_halal).length;
  const spicyCount = allItems.filter((i) => i.is_spicy).length;

  return {
    restaurantName: menuData.restaurant_name || restaurantName || "Restaurant",
    sectionCount: menuData.sections.length,
    itemCount: allItems.length,
    priceTier,
    hasVeganFocus: allItems.length > 0 && veganCount > allItems.length * 0.3,
    hasHalalFocus: allItems.length > 0 && halalCount > allItems.length * 0.5,
    hasSpicyFocus: allItems.length > 0 && spicyCount > allItems.length * 0.3,
    featuredItems: allItems.slice(0, 3).map((i) => i.name),
    sectionNames: menuData.sections.map((s) => s.name),
    topItemNames: allItems.slice(0, 5).map((i) => i.name),
    priceRange: prices.length
      ? { min: Math.min(...prices), max: Math.max(...prices), currency }
      : null,
  };
}

// Keep legacy extractVariables for backward compatibility with DB prompt_templates that use {{variable}} syntax
export function extractVariables(menuData: MenuData | null, restaurantName: string) {
  const ctx = extractEnrichedContext(menuData, restaurantName);
  return {
    restaurant_name: ctx.restaurantName,
    section_names: ctx.sectionNames.join(", ") || "Menu",
    top_items: ctx.topItemNames.join(", ") || "various dishes",
    price_range: ctx.priceRange ? `${ctx.priceRange.min}-${ctx.priceRange.max}` : "",
    currency: ctx.priceRange?.currency || "",
    item_count: String(ctx.itemCount),
  };
}

// Resolve {{variable}} placeholders in DB-loaded prompt templates
export function resolveTemplate(
  template: string,
  variables: ReturnType<typeof extractVariables>,
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}

// ============================================================
// TIER 1 — Identity
// ============================================================

export function buildIdentity(restaurantName: string, cuisineSlug: string | null, priceTier: EnrichedMenuContext["priceTier"]): string {
  const tierDescriptions: Record<string, string> = {
    upscale: "an upscale, fine-dining establishment known for refined cuisine and impeccable presentation",
    "mid-range": "a polished, quality dining destination with thoughtfully crafted dishes and inviting atmosphere",
    casual: "a welcoming, neighborhood favorite celebrated for authentic flavors and approachable charm",
  };
  const tierDescription = tierDescriptions[priceTier];
  const cuisineLabel = cuisineSlug ? cuisineSlug.replace(/-/g, " ") + " " : "";
  return `A professional graphic design of a printed restaurant menu for '${restaurantName}', ${tierDescription}. This is a ${cuisineLabel}restaurant. The design should feel like it was created by a top-tier graphic design agency specializing in hospitality branding.`;
}

// ============================================================
// TIER 2 — Art Direction Components
// ============================================================

export function buildFormatModifier(format: MenuFormat | null, cuisineSlug: string | null): string | null {
  switch (format) {
    case "photo":
      return [
        "This is a FLAT 2D graphic design layout — a professional menu page, not a photograph of a physical menu on a table or surface.",
        "Photo-dominant menu design where food photography occupies at least 60% of the visual area, seamlessly integrated into the graphic layout.",
        "Each food image should look like professional editorial food photography: shot from a 45-degree overhead angle or dramatic low angle, with shallow depth of field, natural directional lighting from one side, and styled on appropriate serving vessels with intentional garnish placement and a few natural props.",
        "The food should appear freshly prepared with visible steam on hot dishes, glistening sauces, vibrant natural colors, and appealing textures — never plasticky, overly glossy, or artificial-looking.",
        "Text elements are minimal and highly legible — item names in small, elegant type positioned near their respective photographs, with sufficient contrast against the background.",
        "White space around photos creates breathing room and a sense of editorial sophistication.",
        getCuisineFoodStyling(cuisineSlug, "photo"),
      ].filter(Boolean).join(" ");

    case "balanced":
      return [
        "This is a FLAT 2D graphic design layout — a professional menu page, not a photograph of a physical menu on a table or surface.",
        "Balanced menu design with a harmonious mix of food photography and readable text content, approximately 40-50% imagery.",
        "Food images are medium-sized, framed within clean rectangular panels or soft-edged vignettes, each showing one signature dish styled with editorial-quality lighting and natural colors.",
        "Text sections use clear typographic hierarchy: section headers are bold and decorative, item names are medium weight, descriptions are light and subdued, and prices are right-aligned in a matching but smaller weight. Maximum three typefaces used throughout.",
        "The layout reads naturally top-to-bottom with clear section dividers — thin rules, subtle ornaments, or generous whitespace separating each section.",
        "Every piece of text must be sharp and legible with high contrast against its background.",
        getCuisineFoodStyling(cuisineSlug, "balanced"),
      ].filter(Boolean).join(" ");

    case "text_only":
      return [
        "This is a FLAT 2D graphic design layout — a professional menu page, not a photograph of a physical menu.",
        "Typography-focused menu design with absolutely no food photographs or photographic imagery.",
        "Visual richness comes entirely from: decorative borders and corner ornaments, ornamental section dividers using hairline rules, flourishes, or geometric patterns, and sophisticated type pairing.",
        "Use a maximum of three typefaces: a decorative display face for the restaurant name, a complementary serif for section headers, and a highly readable serif or sans-serif for body text.",
        "Generous margins (at least 10% on each side) and abundant white space between sections create an airy, luxurious reading experience.",
        "Subtle background textures like linen weave, laid paper, handmade parchment, or watercolor washes add tactile depth without competing with the text.",
        "The overall feel should be that of a fine stationery piece, a bespoke wedding invitation, or a letterpress-printed broadside.",
      ].join(" ");

    default:
      return null;
  }
}

export function buildLayoutModifier(layout: PageLayout | null, itemCount: number): string | null {
  const marginNote = "Include visible margins of at least 5% on all sides to ensure print safety.";

  switch (layout) {
    case "single": {
      const columnAdvice = itemCount > 20
        ? "Use a two-column or three-column layout to fit the larger number of items efficiently without reducing text size below comfortable readability. Columns should have equal or intentionally asymmetric widths with a clear gutter between them."
        : "Use a single-column or relaxed two-column layout with generous spacing since the item count is manageable. The layout should feel spacious, never cramped.";
      return `Single-page menu design in portrait orientation (3:4 aspect ratio). All content must fit on one face. ${columnAdvice} Compose the layout using the rule of thirds: the restaurant name and primary branding occupy the top third, the main menu sections fill the middle third, and the final sections or a decorative footer anchor the bottom third. Visual weight should be evenly distributed — avoid top-heavy designs where all imagery clusters at the top and all text crowds at the bottom. ${marginNote}`;
    }

    case "front_back":
      return `This is the FRONT PAGE of a two-sided printed menu. Design it as the primary face that customers see first. It should establish the visual identity, mood, and color palette of the restaurant. Include a prominent header area with the restaurant name, and arrange the most important menu sections on this page. The design should feel complete on its own while clearly being part of a cohesive two-page system. ${marginNote}`;

    case "booklet":
      return `This is the COVER PAGE of a multi-page menu booklet. Design it as a striking, mostly visual opening page — more like a book cover than a content-heavy menu page. Prioritize atmosphere and brand identity over listing menu items. Show at most one or two featured dishes alongside the restaurant name and a brief tagline. The design should make the reader want to open the booklet and explore further. ${marginNote}`;

    default:
      return null;
  }
}

export function buildHeaderDirective(restaurantName: string, menuFormat: MenuFormat | null): string {
  if (menuFormat === "text_only") {
    return `The restaurant name '${restaurantName}' must appear prominently at the top of the menu, rendered in crisp, perfectly legible characters in an elegant decorative typeface. Spell the name exactly as shown: '${restaurantName}'. Use typographic hierarchy — the restaurant name is the largest, most prominent text element on the entire page. Include a subtle decorative flourish or ornamental rule beneath the name.`;
  }
  return `The restaurant name '${restaurantName}' must appear prominently at the top of the menu, rendered in crisp, perfectly legible characters in a clean professional typeface with generous letter-spacing. Spell the name exactly as shown: '${restaurantName}'. Keep the header area simple and elegant — a well-set name with a subtle tagline area below, not a complex illustrated logo. The name should be the unmistakable focal point upon first glance.`;
}

export function buildArtDirection(
  styleContext: string | null,
  cuisineContext: string | null,
  formatModifier: string | null,
  layoutModifier: string | null,
): string {
  return [styleContext, cuisineContext, formatModifier, layoutModifier]
    .filter(Boolean)
    .join(" ");
}

// ============================================================
// TIER 3 — Color & Material
// ============================================================

export function buildColorDirective(palette: string[] | null, menuFormat: MenuFormat | null): string | null {
  if (!palette || palette.length === 0) return null;

  const roles = mapPaletteToRoles(palette);
  const roleLine = [
    `Background: ${roles.background} (${hexToColorName(roles.background)})`,
    `Primary text: ${roles.textPrimary} (${hexToColorName(roles.textPrimary)})`,
    `Secondary text: ${roles.textSecondary} (${hexToColorName(roles.textSecondary)})`,
    `Primary accent: ${roles.accent} (${hexToColorName(roles.accent)})`,
    `Secondary accent: ${roles.accentAlt} (${hexToColorName(roles.accentAlt)})`,
    `Borders/dividers: ${roles.border} (${hexToColorName(roles.border)})`,
  ].join("; ");

  if (menuFormat === "text_only") {
    return `Apply this exact color-role map for the menu design: ${roleLine}. Body text must use primary or secondary text colors only. Background areas should stay in the background color family. Use accent colors only for headers, ornaments, and emphasis. Natural tonal variations within each role are encouraged — the palette should feel organic and sophisticated, not flat or digitally uniform.`;
  }

  return `Apply this exact color-role map for the menu layout: ${roleLine}. Keep body text in the text colors and keep backgrounds in the background color family. Use accent colors for callouts, section headers, borders, and decorative elements. Food photography should retain natural colors — do not tint food to match the palette. Palette colors should frame and complement the food rather than dominating it.`;
}

export function buildColorAndMaterial(
  palette: string[] | null,
  menuFormat: MenuFormat | null,
): string {
  const colorDir = buildColorDirective(palette, menuFormat);
  return colorDir || "";
}

// ============================================================
// TIER 4 — Content Guidance
// ============================================================

export function buildMenuContentDescription(menuData: MenuData | null, restaurantName: string): string {
  const ctx = extractEnrichedContext(menuData, restaurantName);

  if (!menuData || ctx.itemCount === 0) {
    return `This is a menu for '${ctx.restaurantName}'.`;
  }

  const sections = menuData.sections;

  // Build section descriptions with visual hierarchy guidance
  const sectionDescriptions = sections
    .map((s, idx) => {
      const itemNames = s.items.slice(0, 3).map((i) => i.name).join(", ");
      const visualWeight =
        idx === 0 ? "most prominent" : idx === sections.length - 1 ? "closing" : "secondary";
      return `'${s.name}' (${s.items.length} items including ${itemNames}) as a ${visualWeight} section`;
    })
    .join("; ");

  // Price-tier personality guidance
  const personality =
    ctx.priceTier === "upscale"
      ? "The pricing suggests an upscale dining experience — the design should reflect premium quality and exclusivity."
      : ctx.priceTier === "mid-range"
        ? "The pricing suggests a quality dining experience — the design should feel polished and professional."
        : "The pricing suggests accessible casual dining — the design should feel welcoming and approachable.";

  // Dietary focus notes
  let dietaryNote = "";
  if (ctx.hasVeganFocus) dietaryNote += " The menu has a strong plant-based focus — green and organic visual elements complement this.";
  if (ctx.hasHalalFocus) dietaryNote += " The menu is predominantly halal.";
  if (ctx.hasSpicyFocus) dietaryNote += " Many items are spicy — warm, bold visual elements would complement this.";

  // Featured items emphasis
  const featured = ctx.featuredItems.join(", ");

  return `This menu is for '${ctx.restaurantName}' with ${ctx.itemCount} items across ${ctx.sectionCount} sections: ${sectionDescriptions}. ${personality}${dietaryNote} The menu should display section headers that are visually distinct from item listings. Featured items (${featured}) should be given visual emphasis through larger type, a callout box, or an accompanying food image.`;
}

export function buildStrictMenuContentBlock(
  menuData: MenuData | null,
  restaurantName: string,
): string {
  if (!menuData || menuData.sections.length === 0) {
    const fallbackName = restaurantName || "Restaurant";
    return `STRICT MENU CONTENT SOURCE:
Restaurant Name: ${fallbackName}
No structured sections/items were provided.`;
  }

  const lines: string[] = [];
  lines.push("STRICT MENU CONTENT SOURCE (AUTHORITATIVE):");
  lines.push(`Restaurant Name: ${menuData.restaurant_name || restaurantName || "Restaurant"}`);
  lines.push("Use this exact content with no additions, no removals, and no paraphrasing:");

  menuData.sections.forEach((section, sectionIndex) => {
    lines.push(`SECTION ${sectionIndex + 1}: ${section.name}`);
    section.items.forEach((item, itemIndex) => {
      const description = item.description?.trim() ? item.description.trim() : "N/A";
      lines.push(
        `- ITEM ${sectionIndex + 1}.${itemIndex + 1} | NAME: ${item.name} | DESCRIPTION: ${description} | PRICE: ${item.price.toFixed(2)} ${item.currency}`,
      );
    });
  });

  return lines.join("\n");
}

// ============================================================
// TIER 5 — Variant Personalities
// ============================================================

export const FALLBACK_VARIANT_PROMPTS: VariantPrompt[] = [
  {
    prompt: `FOR THIS DESIGN VARIANT, use the following specific creative direction:
DESIGN MOVEMENT: Inspired by Art Deco, French neoclassical menu design, and timeless fine-dining aesthetics. Think of the menu you would find at a grand Parisian brasserie or a 1920s luxury hotel dining room.
LAYOUT: Centered and symmetrical composition with a single column. Content is aligned along a strong central axis with mathematical precision. Generous whitespace between sections creates an airy, unhurried reading experience — at least 24px equivalent spacing between sections.
TYPOGRAPHY: Classic serif typeface (think Didot, Bodoni, or Garamond) for both headers and body text. Headers use generous letter-spacing (tracked out) and are set in elegant capitals. Body text is set at a comfortable reading size with generous leading. All text is centered.
HEADER: The restaurant name is centered at the top in an elegant serif with wide letter-spacing and a thin ornamental rule or Art Deco geometric border beneath it. The name feels engraved rather than merely printed.
BACKGROUND: Light, clean background — ivory, warm cream, or soft white, possibly with a subtle laid paper or linen texture. No dark backgrounds.
DECORATIVE: Thin hairline rules as section dividers. Small ornamental flourishes — fleurons, delicate filigree corners, or subtle geometric Art Deco motifs. Minimal decorative elements — let whitespace and perfect typography do the work. No more than 2-3 decorative elements on the entire page.
MOOD: The overall feeling is of a refined, timeless fine-dining establishment — understated luxury, restraint, and classical elegance. Effortlessly sophisticated.`,
    mood: "classic-elegance",
    description: "Centered, symmetrical, light background, serif typography, timeless refinement",
  },
  {
    prompt: `FOR THIS DESIGN VARIANT, use the following specific creative direction:
DESIGN MOVEMENT: Inspired by contemporary food magazine layouts — think Bon Appetit, Kinfolk, or Cereal magazine. Clean, confident, and intentionally designed with a graphic designer's eye.
LAYOUT: Asymmetric editorial layout with two or three columns of varying width. The grid is intentionally and artfully broken — some elements span multiple columns, headers are oversized for dramatic scale contrast, and there is tension between large and small elements. Content blocks are arranged with magazine-spread sophistication.
TYPOGRAPHY: Bold geometric sans-serif for headers (think Futura, Helvetica Neue, or Montserrat) with tight letter-spacing. Light-weight sans-serif for body text in a contrasting weight. Section headers are oversized — at least 3x the body text size — creating dramatic typographic hierarchy. Some text may be rotated 90 degrees or placed vertically as a design accent.
HEADER: The restaurant name is left-aligned or spans the full width in a bold sans-serif at an arresting scale, possibly with a solid color block or band behind it. The name feels like a magazine masthead.
BACKGROUND: Clean white or very light warm gray background with bold color accent blocks, bands, or geometric color fields that create visual rhythm and section separation.
DECORATIVE: No traditional ornaments whatsoever. Instead, use bold geometric shapes, solid color blocks, strong horizontal or vertical lines, numbered section markers, and negative space as the primary design elements. The design system itself is the decoration.
MOOD: Energetic, confident, contemporary — like a feature spread in a design-forward food magazine. Urban, visually striking, and unapologetically modern.`,
    mood: "modern-editorial",
    description: "Asymmetric multi-column, bold sans-serif, color blocks, magazine editorial feel",
  },
  {
    prompt: `FOR THIS DESIGN VARIANT, use the following specific creative direction:
DESIGN MOVEMENT: Inspired by artisanal craft, hand-printed ephemera, vintage market signage, and the retro-authentic revival trend. Think of a beloved neighborhood restaurant that has been printing its own menus for 30 years.
LAYOUT: Organic, slightly irregular layout that feels hand-arranged rather than rigid. Content flows naturally with gentle curves or tilted text blocks. Sections feel like they were placed by hand on a workbench, not snapped to a digital grid.
TYPOGRAPHY: A decorative hand-lettered or brush script typeface for the restaurant name and section headers. A warm, rounded sans-serif or friendly serif for body text. Type sizes vary organically — some headers larger, some smaller, as if hand-set.
HEADER: The restaurant name is in a hand-lettered or brush script style, imperfect and characterful, possibly with a hand-drawn underline, banner, or ribbon. The name looks like it was painted by a sign maker, not generated by software.
BACKGROUND: Warm textured background — kraft paper, aged parchment, chalkboard, or weathered wood. The texture should be clearly visible and add tactile warmth, as if you could feel the paper grain.
DECORATIVE: Hand-drawn illustrations, sketched borders, botanical line drawings, stamp-style badges, chalk-style lettering, small food doodles or ingredient illustrations. Everything should look artisanal and handmade with slight imperfections that add charm.
MOOD: Warm, inviting, nostalgic — a beloved neighborhood spot with decades of history. Cozy, approachable, and full of personality and soul.`,
    mood: "warm-artisan",
    description: "Textured warm background, hand-lettered, hand-drawn illustrations, cozy and nostalgic",
  },
  {
    prompt: `FOR THIS DESIGN VARIANT, use the following specific creative direction:
DESIGN MOVEMENT: Inspired by theatrical fine dining, speakeasy aesthetics, and moody editorial photography. Think of the menu at a Michelin-starred restaurant in a converted warehouse, or a rooftop bar with city views at night.
LAYOUT: Dark full-bleed background with content organized in floating panels, cards, or framed areas that appear to hover over the dark canvas with subtle shadow or glow effects. The layout creates a sense of layered depth and dimension. Generous spacing between elements allows the dark background to breathe.
TYPOGRAPHY: Thin, elegant light-colored typeface (warm white, champagne cream, or soft gold) for all text. Headers may have a subtle metallic sheen, foil-stamp quality, or luminous warmth. Strong contrast between thin elegant type and the deep dark background. The text feels like it is glowing softly against the darkness.
HEADER: The restaurant name is centered in thin, widely-tracked elegant capitals with a gold, champagne, or copper metallic tone, possibly with a subtle letterpress embossed effect or hot-foil stamp quality. A thin decorative rule or simple geometric border frames it.
BACKGROUND: Deep, rich, atmospheric dark color — matte black, deep navy, dark emerald, oxblood, or warm charcoal. The background has subtle texture: dark marble veining, brushed metal, velvet fabric, or fine leather grain. The darkness should feel luxurious and warm, not cold or flat.
DECORATIVE: Subtle gold, copper, or champagne accent lines and thin geometric borders around content areas. Minimal but luxurious decorative touches — a single ornamental divider, a delicate corner motif. Any food photography uses dramatic chiaroscuro or Rembrandt lighting with deep shadows and single-source illumination.
MOOD: Dramatic, theatrical, exclusive — a destination restaurant with a strong visual identity and sense of occasion. Dark luxury that feels intimate and atmospheric, not gloomy or oppressive.`,
    mood: "dark-dramatic",
    description: "Dark background, light/metallic type, floating panels, theatrical luxury",
  },
];

// ============================================================
// TIER 6 — Technical Quality & Constraints
// ============================================================

export function buildQualitySuffix(menuFormat: MenuFormat | null): string {
  const base = [
    "CRITICAL RENDERING INSTRUCTIONS:",
    "The entire image IS the menu design itself — edge to edge, filling the full canvas with no surrounding surface, table, countertop, or background environment visible.",
    "This is a FLAT 2D GRAPHIC DESIGN — a professional print layout rendered digitally. It is NOT a photograph of a printed menu, NOT a 3D rendering of a menu sitting on a table, and NOT a mockup showing a menu in a real-world setting.",
    "Think of this as a direct export from Adobe InDesign or Illustrator — a perfectly flat, camera-facing, rectangular graphic design with no perspective distortion, no curling edges, no shadows cast by a physical object.",
  ];

  if (menuFormat === "text_only") {
    return [
      ...base,
      "Crisp typography with perfect kerning, tracking, and leading throughout.",
      "Decorative elements have fine detail — thin hairline rules, delicate flourishes, and precise geometric ornaments, all rendered at maximum sharpness.",
      "The final result is indistinguishable from a high-resolution export from a professional graphic design application.",
    ].join(" ");
  }

  return [
    ...base,
    "Crisp typography with perfect kerning throughout — every letter clearly formed and legible.",
    "Food photography elements are seamlessly composited into the layout as part of the flat graphic design, not as separate photos placed on top.",
    "Every detail — borders, textures, type, images — is rendered at print resolution quality (300 DPI equivalent sharpness).",
    "The final result is indistinguishable from a high-resolution export from a professional graphic design application.",
  ].join(" ");
}

export function buildConstraintDirectives(
  menuFormat: MenuFormat | null,
  strictTextFidelity = false,
): string {
  const universal = [
    "Do not include any watermarks, signatures, artist credits, or stock photo indicators on the design",
    "ALL visible text on the menu MUST be sharp, fully legible, and correctly formed — no blurred, smeared, melted, or gibberish text. Every letter must be a recognizable character. If text cannot be rendered clearly, use fewer words rather than illegible ones",
    "Do not generate any distorted, melted, uncanny, or anatomically incorrect food imagery",
    "Avoid generic clip-art style illustrations — all visual elements should look professionally designed and intentional",
    "Do not place text over busy photographic backgrounds without sufficient contrast — always use a solid panel, gradient overlay, or dark scrim behind text that overlays images",
    "Do not render this as a 3D scene, a photograph of a physical menu, or a mockup on a table — it must be a flat 2D graphic design only",
  ];

  if (strictTextFidelity) {
    universal.push(
      "Text fidelity is absolute: every section header, item name, description, and price must match the provided source content exactly",
      "Do not invent, paraphrase, summarize, reorder, or omit any provided menu text",
      "Do not change numeric prices, decimal formatting, or currency codes",
      "If layout space is tight, reduce decorative elements before changing any menu text",
    );
  } else {
    universal.push(
      "Text should read as plausible English menu content — real food names, real section headers, real descriptions. No random letter combinations or nonsense words",
    );
  }

  const photoSpecific = [
    "Food photography must look appetizing with natural, non-artificial coloring — no oversaturated or plasticky-looking food",
    "No floating or gravity-defying food elements — all food should appear naturally plated and grounded",
    "Food should have realistic textures: visible grain on bread, natural sauce glossiness, crisp edges on fried items",
  ];

  const textOnlySpecific = [
    "Do not include any photographs or photographic imagery whatsoever — zero photos",
    "Decorative elements should be vector-style ornamental graphics: borders, flourishes, geometric patterns, or line illustrations — not photographs",
  ];

  let constraints = [...universal];
  if (menuFormat === "text_only") {
    constraints = [...constraints, ...textOnlySpecific];
  } else if (menuFormat === "photo" || menuFormat === "balanced") {
    constraints = [...constraints, ...photoSpecific];
  }

  return "IMPORTANT CONSTRAINTS: " + constraints.join(". ") + ".";
}

export function buildStrictFidelityConstraints(menuFormat: MenuFormat | null): string {
  return buildConstraintDirectives(menuFormat, true);
}

// ============================================================
// Full Prompt Assembly
// ============================================================

export function buildFullPrompt(config: PromptConfig): string {
  return [
    config.identity,
    config.artDirection,
    config.colorAndMaterial,
    config.contentGuidance,
    config.variantPersonality,
    config.technicalQuality,
  ]
    .filter(Boolean)
    .join("\n\n");
}

// ============================================================
// Variation Refinement
// ============================================================

export const VARIATION_TAGS = {
  background: [
    { label: "Darker background", instruction: "Make the background significantly darker and more dramatic" },
    { label: "Lighter background", instruction: "Make the background lighter, brighter, and more airy" },
    { label: "Add texture", instruction: "Add subtle paper, linen, or material texture to the background" },
    { label: "Solid background", instruction: "Simplify the background to a clean solid color" },
  ],
  typography: [
    { label: "Larger headers", instruction: "Make the restaurant name and section headers larger and more prominent" },
    { label: "More elegant fonts", instruction: "Use more refined, elegant serif typography throughout" },
    { label: "Modern sans-serif", instruction: "Switch to clean modern sans-serif typography" },
    { label: "Better readability", instruction: "Increase text contrast and spacing for better readability" },
  ],
  colors: [
    { label: "Warmer tones", instruction: "Shift the color palette toward warmer tones (golds, ambers, terracottas)" },
    { label: "Cooler tones", instruction: "Shift the color palette toward cooler tones (blues, silvers, greens)" },
    { label: "More contrast", instruction: "Increase the contrast between light and dark elements" },
    { label: "Muted / softer", instruction: "Soften and mute the colors for a more understated, sophisticated feel" },
  ],
  layout: [
    { label: "More whitespace", instruction: "Add more whitespace and breathing room between sections" },
    { label: "More compact", instruction: "Make the layout more compact and space-efficient" },
    { label: "Centered layout", instruction: "Center-align the overall layout with symmetrical composition" },
    { label: "Add borders/frames", instruction: "Add decorative borders or frames around sections" },
  ],
  imagery: [
    { label: "More food photos", instruction: "Include more prominent food photography in the design" },
    { label: "Less food photos", instruction: "Reduce food photography, focus more on typography and decorative elements" },
    { label: "Add decorative elements", instruction: "Add more ornamental or decorative design elements" },
    { label: "More minimal", instruction: "Remove decorative clutter for a cleaner, more minimal look" },
  ],
} as const;

export type VariationTagCategory = keyof typeof VARIATION_TAGS;

const VARIATION_DIFFERENTIATORS = [
  "Apply these changes with a subtle, restrained approach — preserve as much of the original as possible while clearly addressing the requested modifications.",
  "Apply these changes with a bold, confident approach — make the modifications clearly visible and impactful.",
  "Apply these changes with a balanced approach — find the harmonious middle ground between the original design and the requested modifications.",
  "Apply these changes with a creative reinterpretation — use the modifications as inspiration to explore an unexpected but cohesive direction.",
];

export function buildVariationPrompt(
  originalPrompt: string,
  freeTextInstruction: string,
  selectedTagInstructions: string[],
  differentiatorIndex: number,
): string {
  const allInstructions = [
    ...(freeTextInstruction.trim() ? [freeTextInstruction.trim()] : []),
    ...selectedTagInstructions,
  ];

  const instructionBlock = allInstructions.map((inst) => `- ${inst}`).join("\n");

  const differentiator = VARIATION_DIFFERENTIATORS[differentiatorIndex % 4];

  return `${originalPrompt}

VARIATION INSTRUCTIONS: Starting from the provided reference image, apply these specific modifications while preserving the overall design structure, layout, and restaurant identity:
${instructionBlock}

${differentiator}

The result must still look like a complete, professional, print-ready restaurant menu design.`;
}
