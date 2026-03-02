#!/usr/bin/env node

// Usage: REPLICATE_API_TOKEN=r8_xxx node scripts/generate-showcase-images.mjs
// Optional: REPLICATE_API_TOKEN=r8_xxx node scripts/generate-showcase-images.mjs --only=sakura
// Dry run: node scripts/generate-showcase-images.mjs --dry-run
//
// Generates showcase images for the marketing pages using the Replicate API.
// Downloads them to apps/web/public/showcase/ as permanent static assets.
// Run once, commit the images, done.
//
// Cost: ~$0.63 total (9 images x ~$0.067 via Nano Banana 2 + 1 x $0.03 via Ideogram V3 Turbo)
//
// ============================================================
// SYNC WARNING: The prompt-building functions below are inlined
// copies of the functions in apps/web/src/lib/prompts.ts.
// When you update prompts.ts, you MUST update the corresponding
// functions in this script to keep showcase prompts in sync.
//
// Functions to keep in sync:
//   - buildIdentity()
//   - buildFormatModifier()
//   - buildLayoutModifier()
//   - buildHeaderDirective()
//   - buildQualitySuffix()
//   - buildConstraintDirectives()
//   - FALLBACK_VARIANT_PROMPTS[]
//   - CUISINE_FOOD_STYLING{}
//
// NEW in this version (not in prompts.ts):
//   - buildColorDirective() — showcase-specific color palettes
//   - SHOWCASE_ITEMS[] — showcase-specific restaurant definitions
// ============================================================

import { writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "apps", "web", "public", "showcase");

// Load .env.local from apps/web/ if REPLICATE_API_TOKEN is not already set
if (!process.env.REPLICATE_API_TOKEN) {
  const envPath = join(__dirname, "..", "apps", "web", ".env.local");
  if (existsSync(envPath)) {
    const content = await readFile(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const match = line.match(/^([A-Z_]+)=(.+)$/);
      if (match) process.env[match[1]] = match[2].trim();
    }
  }
}

const REPLICATE_API_URL = "https://api.replicate.com/v1";
const REPLICATE_TOKEN = process.env.REPLICATE_API_TOKEN;

// Parse flags
const onlySlug = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1] || null;
const dryRun = process.argv.includes("--dry-run");

if (!dryRun && !REPLICATE_TOKEN) {
  console.error("Error: REPLICATE_API_TOKEN env var is required (unless using --dry-run)");
  console.error("Usage: REPLICATE_API_TOKEN=r8_xxx node scripts/generate-showcase-images.mjs");
  process.exit(1);
}

// ============================================================
// Showcase Items
// ============================================================

const SHOWCASE_ITEMS = [
  {
    slug: "la-bella-vita",
    restaurantName: "La Bella Vita",
    cuisineSlug: "italian",
    variantIndex: 0, // Classic Elegance
    format: "balanced",
    priceTier: "upscale",
    colorPalette: ["#1B1B1B", "#8B6914", "#C9A96E", "#F5F0E8", "#FFFFFF"],
    contentGuidance:
      "An upscale Italian trattoria in a century-old brick building with vaulted ceilings and candlelight. Menu sections: Antipasti (bruschetta, carpaccio, burrata), Primi Piatti (truffle risotto, cacio e pepe, pappardelle al ragu), Secondi (osso buco alla milanese, branzino al forno, veal saltimbocca), Dolci (tiramisu, panna cotta, affogato). 16 items across 4 sections. Prices suggest fine dining. The menu should feel like a keepsake, not disposable.",
  },
  {
    slug: "sakura",
    restaurantName: "Sakura Omakase",
    cuisineSlug: "japanese",
    variantIndex: 1, // Modern Editorial
    format: "balanced",
    priceTier: "upscale",
    colorPalette: ["#1A1A1A", "#2D3436", "#D4A574", "#F0EDE8", "#FAFAF8"],
    contentGuidance:
      "A refined omakase counter with only 12 seats, located in a minimalist space with hinoki cypress wood and stone. Menu sections: Sashimi Selection (hirame, otoro, uni, shimesaba), Nigiri Course (8 seasonal pieces), Signature Maki (dragon roll, spicy tuna crispy rice), Tempura (seasonal vegetables, ebi), Donburi (wagyu bowl, chirashi). 20 items across 5 sections. The menu should convey zen precision, negative space, and quiet confidence.",
  },
  {
    // KEEP — this is the reference design that works well
    slug: "el-fuego",
    restaurantName: "El Fuego",
    cuisineSlug: "mexican",
    variantIndex: 2, // Warm Artisan
    format: "photo",
    priceTier: "casual",
    colorPalette: null,
    contentGuidance:
      "Menu sections: Antojitos, Tacos, Platos Fuertes, Postres. Featured items: Birria Tacos, Mole Poblano, Elote, Churros con Chocolate. 18 items total across 4 sections.",
  },
  {
    slug: "le-petit-bistro",
    restaurantName: "Le Petit Bistro",
    cuisineSlug: "french",
    variantIndex: 3, // Dark Dramatic
    format: "balanced",
    priceTier: "upscale",
    colorPalette: ["#0F0F0F", "#1C1C2E", "#C5A55A", "#E8DCC8", "#F2EDE4"],
    contentGuidance:
      "An intimate Parisian-style bistro with zinc bar, checkered floors, and chalkboard specials. Menu sections: Entrees (soupe a l'oignon gratinee, tartare de saumon, salade Lyonnaise), Plats Principaux (duck confit with lentils, steak frites, bouillabaisse Marseillaise, sole meuniere), Fromages (curated selection of 5 French cheeses), Desserts (creme brulee, tarte Tatin, profiteroles au chocolat). 14 items across 4 sections. The menu should evoke the romance of a dimly-lit Parisian evening.",
  },
  {
    slug: "spice-route",
    restaurantName: "The Spice Route",
    cuisineSlug: "indian",
    variantIndex: 2, // Warm Artisan
    format: "photo",
    priceTier: "mid-range",
    colorPalette: ["#2C1810", "#8B4513", "#D4952B", "#E8C547", "#FFF8E7"],
    contentGuidance:
      "A vibrant Indian restaurant with hand-painted murals, copper vessels on display, and the aroma of freshly ground spices. Menu sections: Starters (samosa chaat, paneer tikka, tandoori prawns), Tandoori Specialties (chicken tikka, lamb seekh kebab, tandoori fish), House Curries (butter chicken, lamb rogan josh, palak paneer, dal makhani), Biryani (hyderabadi goat biryani, vegetable biryani), Breads & Sides (garlic naan, paratha, raita, mango chutney). 22 items across 5 sections. Colors should feel warm, rich, and inviting — turmeric yellows, paprika reds, cardamom greens.",
  },
  {
    slug: "verdant",
    restaurantName: "Verdant",
    cuisineSlug: "vegan",
    variantIndex: 1, // Modern Editorial
    format: "balanced",
    priceTier: "mid-range",
    colorPalette: ["#1A2E1A", "#3D5C3A", "#8FAE6B", "#D4E4C7", "#F7FAF4"],
    contentGuidance:
      "A modern plant-based restaurant in a light-filled greenhouse-style space with exposed brick and living wall installations. Menu sections: Small Plates (roasted cauliflower steak, mushroom ceviche, beetroot carpaccio), Bowls (buddha bowl, poke-style jackfruit bowl, grain bowl with tahini), Mains (wild mushroom risotto, charred eggplant with miso glaze, stuffed bell peppers with quinoa), Sweets (raw cacao torte, coconut panna cotta, matcha cheesecake). 16 items across 4 sections. The design should feel fresh, clean, and contemporary — communicating that plant-based dining is exciting and sophisticated, not restrictive.",
  },
  {
    slug: "ember-and-oak",
    restaurantName: "Ember & Oak",
    cuisineSlug: "steakhouse",
    variantIndex: 3, // Dark Dramatic
    format: "photo",
    priceTier: "upscale",
    colorPalette: ["#0A0A0A", "#1C1410", "#8B4513", "#C8956C", "#F0E6D8"],
    contentGuidance:
      "A premium steakhouse with dark leather booths, exposed timber beams, an open charcoal grill visible from the dining room, and a curated whiskey wall. Menu sections: Raw Bar (oysters, steak tartare, tuna crudo), Cuts (42-day dry-aged ribeye, wagyu striploin, bone-in filet mignon, tomahawk for two), Sides (truffle mac & cheese, creamed spinach, roasted bone marrow, grilled asparagus), Desserts (dark chocolate lava cake, bourbon pecan pie). 16 items across 4 sections. The menu should feel bold, masculine, and luxurious — heavy paper stock, deep dark tones, and the warm glow of candlelight on aged wood.",
  },
  {
    slug: "noodle-house",
    restaurantName: "Golden Dragon Noodle House",
    cuisineSlug: "chinese",
    variantIndex: 0, // Classic Elegance
    format: "balanced",
    priceTier: "casual",
    colorPalette: ["#1A0A0A", "#8B1A1A", "#D4AF37", "#F5E6C8", "#FFF9F0"],
    contentGuidance:
      "A beloved family-run Chinese noodle house that has been in the same location for three generations, with red lanterns, round tables, and the sound of woks firing in the open kitchen. Menu sections: Dim Sum (xiao long bao, har gow, siu mai, char siu bao), Soups (wonton soup, hot and sour soup, congee), Noodles & Rice (dan dan noodles, beef chow fun, yang chow fried rice, lo mein), Wok Specialties (kung pao chicken, mapo tofu, salt and pepper squid, Mongolian lamb). 24 items across 4 sections. The design should feel like a menu you have loved for years — warm, trustworthy, and generous, with touches of red and gold.",
  },
  {
    slug: "olive-and-thyme",
    restaurantName: "Olive & Thyme",
    cuisineSlug: "mediterranean",
    variantIndex: 2, // Warm Artisan
    format: "balanced",
    priceTier: "mid-range",
    colorPalette: ["#2C3E2C", "#6B7F5E", "#C9B896", "#E8DFC9", "#FAF6EF"],
    contentGuidance:
      "A sun-drenched coastal Mediterranean kitchen with whitewashed walls, blue shutters, terracotta pots of herbs, and olive wood furniture. Menu sections: Mezze (hummus trio, baba ganoush, grilled halloumi, falafel), Salads (fattoush, Greek village salad, roasted beetroot with labneh), From the Grill (lamb kofta, chicken souvlaki, whole grilled sea bream, lamb chops with za'atar), Desserts (baklava, knafeh, orange blossom panna cotta). 18 items across 4 sections. The design should feel like a breeze from the Mediterranean coast — warm, earthy, sun-kissed, and effortlessly inviting.",
  },
  {
    slug: "seoul-kitchen",
    restaurantName: "Seoul Kitchen",
    cuisineSlug: "korean",
    variantIndex: 3, // Dark Dramatic
    format: "photo",
    priceTier: "mid-range",
    colorPalette: ["#0D0D0D", "#1A1A2E", "#E74C3C", "#F4D03F", "#F8F8F0"],
    contentGuidance:
      "A modern Korean BBQ restaurant with sleek dark interiors, built-in table grills, and a neon-lit bar area. Menu sections: Appetizers (Korean fried chicken, japchae, kimchi pancake, tteokbokki), BBQ Selection (bulgogi, galbi, samgyeopsal, marinated chicken), Stews & Soups (kimchi jjigae, sundubu, gamjatang), Rice & Noodles (bibimbap, japchae, cold naengmyeon). 20 items across 4 sections. Bold colors — fiery reds, warm yellows against deep black — should capture the energy and sizzle of Korean BBQ.",
  },
  {
    slug: "daily-bread",
    restaurantName: "Daily Bread",
    cuisineSlug: "cafe",
    variantIndex: 0, // Classic Elegance
    format: "text_only",
    priceTier: "casual",
    colorPalette: ["#2C2C2C", "#6B5B4F", "#A89583", "#E8E0D4", "#FAF7F2"],
    contentGuidance:
      "A sunlit artisan bakery and cafe with exposed brick, flour-dusted wooden counters, and the smell of fresh sourdough. Menu sections: Coffee & Tea (flat white, cortado, pour-over, matcha latte, chai), Fresh Pastries (almond croissant, pain au chocolat, cinnamon roll, banana bread), Breakfast (sourdough toast with seasonal toppings, acai bowl, granola parfait, eggs Benedict), Lunch (roasted vegetable sandwich, soup of the day, grain bowl, quiche Lorraine). 16 items across 4 sections. Since this is text-only, the design must rely entirely on beautiful typography, thoughtful spacing, and subtle ornamental details — like a menu you would frame on the wall.",
  },
];

// ============================================================
// Cuisine Food Styling (synced from prompts.ts)
// ============================================================

const CUISINE_FOOD_STYLING = {
  italian: {
    photo:
      "Rustic Italian food styling with handmade ceramic plates on a reclaimed wood surface. Olive oil drizzles, fresh basil sprigs, cracked black pepper, and dusted flour visible as props. Pasta dishes show al dente texture, pizzas show charred crust bubbles.",
    balanced:
      "Clean Italian plating on white ceramic with a tomato-red cloth napkin and olive wood serving board in the background.",
  },
  japanese: {
    photo:
      "Precise Japanese plating on minimalist ceramic pieces — asymmetric plates, small dipping bowls, and lacquerware. Negative space is intentional. Garnished with shiso leaves, microgreens, and precise sauce dots.",
    balanced:
      "Clean zen-inspired food presentation on earth-toned stoneware with natural bamboo props and a neutral background.",
  },
  mexican: {
    photo:
      "Vibrant Mexican food styling on colorful Talavera pottery and hand-woven textiles. Lime wedges, fresh cilantro, sliced jalapenos, and crumbled queso fresco as garnish. Salsas in molcajete stone bowls.",
    balanced:
      "Festive Mexican plating on terracotta dishes with colorful hand-painted patterns and a lime wedge accent.",
  },
  french: {
    photo:
      "Refined French plating with precise sauce work on wide-rimmed white porcelain. Micro herb garnishes, edible flowers, and delicate jus drizzles. Each plate is a composed artwork with generous negative space.",
    balanced:
      "Elegant Parisian presentation on fine white china with a linen napkin and silver cutlery partially visible.",
  },
  indian: {
    photo:
      "Vibrant Indian food styling with colorful curries in copper serving bowls (handi), naan bread draped naturally, bright turmeric yellows, rich reds, and scattered fresh coriander and whole spices as props.",
    balanced:
      "Warm Indian plating on brass thali plates with small katori bowls, colorful chutneys visible alongside.",
  },
  american: {
    photo:
      "Bold American comfort food styling on rustic stoneware and cast iron skillets. Thick-cut portions, melted cheese pulls, crispy textures, and butcher paper or parchment liners. Craft beer glass or mason jar partially visible.",
    balanced:
      "Contemporary American plating on matte ceramic with a clean industrial-rustic aesthetic and natural props.",
  },
  chinese: {
    photo:
      "Family-style Chinese food presentation in large ceramic bowls and bamboo steamers. Chopsticks resting on ceramic rests, tea pot partially visible, glistening sauce on stir-fry dishes, delicate dim sum in bamboo baskets.",
    balanced:
      "Clean Chinese plating on celadon glazed dishes with red chopsticks and a small tea cup accent.",
  },
  mediterranean: {
    photo:
      "Sun-drenched Mediterranean spread on a rustic olive wood table. Fresh hummus drizzled with olive oil, colorful mezze plates, grilled halloumi with char marks, scattered capers and sun-dried tomatoes.",
    balanced:
      "Clean coastal Mediterranean presentation on white ceramic with blue accents and a sprig of rosemary.",
  },
  korean: {
    photo:
      "Colorful Korean banchan spread with 8+ small dishes surrounding a central entree. Bibimbap in hot stone bowl showing sizzling edges, bright kimchi red, gleaming galbi, steaming rice, with metal chopsticks.",
    balanced:
      "Modern Korean plating on slate stone with a few banchan side dishes and stainless steel chopsticks.",
  },
  cafe: {
    photo:
      "Cozy cafe styling with artisanal pastries on vintage cake stands and wooden boards. Latte art in ceramic cups, dusted powdered sugar, fresh berries, and natural morning light. Parchment paper and twine as props.",
    balanced:
      "Warm cafe plating on mismatched vintage china with a freshly brewed coffee cup and a pastry fork.",
  },
  vegan: {
    photo:
      "Fresh plant-based food styling on handcrafted ceramic with raw wood surfaces. Buddha bowls showing vibrant vegetable rainbows, grain and seed textures, spiralized vegetables, edible flower garnishes, and natural linen napkins.",
    balanced:
      "Clean vegan plating on earthy ceramic with a microgreen garnish and a small seed sprinkle.",
  },
  steakhouse: {
    photo:
      "Premium steakhouse styling on a dark wooden board with a cast iron skillet. Perfectly seared steak showing a pink center cross-section, compound butter melting on top, charred asparagus, rock salt crystals, and a red wine glass partially visible.",
    balanced:
      "Bold steakhouse plating on dark slate with a steak knife and sprig of fresh rosemary.",
  },
};

// ============================================================
// Variant Personalities (synced from prompts.ts)
// ============================================================

const FALLBACK_VARIANT_PROMPTS = [
  // 0: Classic Elegance
  `FOR THIS DESIGN VARIANT, use the following specific creative direction:
DESIGN MOVEMENT: Inspired by Art Deco, French neoclassical menu design, and timeless fine-dining aesthetics. Think of the menu you would find at a grand Parisian brasserie or a 1920s luxury hotel dining room.
LAYOUT: Centered and symmetrical composition with a single column. Content is aligned along a strong central axis with mathematical precision. Generous whitespace between sections creates an airy, unhurried reading experience — at least 24px equivalent spacing between sections.
TYPOGRAPHY: Classic serif typeface (think Didot, Bodoni, or Garamond) for both headers and body text. Headers use generous letter-spacing (tracked out) and are set in elegant capitals. Body text is set at a comfortable reading size with generous leading. All text is centered.
HEADER: The restaurant name is centered at the top in an elegant serif with wide letter-spacing and a thin ornamental rule or Art Deco geometric border beneath it. The name feels engraved rather than merely printed.
BACKGROUND: Light, clean background — ivory, warm cream, or soft white, possibly with a subtle laid paper or linen texture. No dark backgrounds.
DECORATIVE: Thin hairline rules as section dividers. Small ornamental flourishes — fleurons, delicate filigree corners, or subtle geometric Art Deco motifs. Minimal decorative elements — let whitespace and perfect typography do the work. No more than 2-3 decorative elements on the entire page.
MOOD: The overall feeling is of a refined, timeless fine-dining establishment — understated luxury, restraint, and classical elegance. Effortlessly sophisticated.`,

  // 1: Modern Editorial
  `FOR THIS DESIGN VARIANT, use the following specific creative direction:
DESIGN MOVEMENT: Inspired by contemporary food magazine layouts — think Bon Appetit, Kinfolk, or Cereal magazine. Clean, confident, and intentionally designed with a graphic designer's eye.
LAYOUT: Asymmetric editorial layout with two or three columns of varying width. The grid is intentionally and artfully broken — some elements span multiple columns, headers are oversized for dramatic scale contrast, and there is tension between large and small elements. Content blocks are arranged with magazine-spread sophistication.
TYPOGRAPHY: Bold geometric sans-serif for headers (think Futura, Helvetica Neue, or Montserrat) with tight letter-spacing. Light-weight sans-serif for body text in a contrasting weight. Section headers are oversized — at least 3x the body text size — creating dramatic typographic hierarchy. Some text may be rotated 90 degrees or placed vertically as a design accent.
HEADER: The restaurant name is left-aligned or spans the full width in a bold sans-serif at an arresting scale, possibly with a solid color block or band behind it. The name feels like a magazine masthead.
BACKGROUND: Clean white or very light warm gray background with bold color accent blocks, bands, or geometric color fields that create visual rhythm and section separation.
DECORATIVE: No traditional ornaments whatsoever. Instead, use bold geometric shapes, solid color blocks, strong horizontal or vertical lines, numbered section markers, and negative space as the primary design elements. The design system itself is the decoration.
MOOD: Energetic, confident, contemporary — like a feature spread in a design-forward food magazine. Urban, visually striking, and unapologetically modern.`,

  // 2: Warm Artisan
  `FOR THIS DESIGN VARIANT, use the following specific creative direction:
DESIGN MOVEMENT: Inspired by artisanal craft, hand-printed ephemera, vintage market signage, and the retro-authentic revival trend. Think of a beloved neighborhood restaurant that has been printing its own menus for 30 years.
LAYOUT: Organic, slightly irregular layout that feels hand-arranged rather than rigid. Content flows naturally with gentle curves or tilted text blocks. Sections feel like they were placed by hand on a workbench, not snapped to a digital grid.
TYPOGRAPHY: A decorative hand-lettered or brush script typeface for the restaurant name and section headers. A warm, rounded sans-serif or friendly serif for body text. Type sizes vary organically — some headers larger, some smaller, as if hand-set.
HEADER: The restaurant name is in a hand-lettered or brush script style, imperfect and characterful, possibly with a hand-drawn underline, banner, or ribbon. The name looks like it was painted by a sign maker, not generated by software.
BACKGROUND: Warm textured background — kraft paper, aged parchment, chalkboard, or weathered wood. The texture should be clearly visible and add tactile warmth, as if you could feel the paper grain.
DECORATIVE: Hand-drawn illustrations, sketched borders, botanical line drawings, stamp-style badges, chalk-style lettering, small food doodles or ingredient illustrations. Everything should look artisanal and handmade with slight imperfections that add charm.
MOOD: Warm, inviting, nostalgic — a beloved neighborhood spot with decades of history. Cozy, approachable, and full of personality and soul.`,

  // 3: Dark Dramatic
  `FOR THIS DESIGN VARIANT, use the following specific creative direction:
DESIGN MOVEMENT: Inspired by theatrical fine dining, speakeasy aesthetics, and moody editorial photography. Think of the menu at a Michelin-starred restaurant in a converted warehouse, or a rooftop bar with city views at night.
LAYOUT: Dark full-bleed background with content organized in floating panels, cards, or framed areas that appear to hover over the dark canvas with subtle shadow or glow effects. The layout creates a sense of layered depth and dimension. Generous spacing between elements allows the dark background to breathe.
TYPOGRAPHY: Thin, elegant light-colored typeface (warm white, champagne cream, or soft gold) for all text. Headers may have a subtle metallic sheen, foil-stamp quality, or luminous warmth. Strong contrast between thin elegant type and the deep dark background. The text feels like it is glowing softly against the darkness.
HEADER: The restaurant name is centered in thin, widely-tracked elegant capitals with a gold, champagne, or copper metallic tone, possibly with a subtle letterpress embossed effect or hot-foil stamp quality. A thin decorative rule or simple geometric border frames it.
BACKGROUND: Deep, rich, atmospheric dark color — matte black, deep navy, dark emerald, oxblood, or warm charcoal. The background has subtle texture: dark marble veining, brushed metal, velvet fabric, or fine leather grain. The darkness should feel luxurious and warm, not cold or flat.
DECORATIVE: Subtle gold, copper, or champagne accent lines and thin geometric borders around content areas. Minimal but luxurious decorative touches — a single ornamental divider, a delicate corner motif. Any food photography uses dramatic chiaroscuro or Rembrandt lighting with deep shadows and single-source illumination.
MOOD: Dramatic, theatrical, exclusive — a destination restaurant with a strong visual identity and sense of occasion. Dark luxury that feels intimate and atmospheric, not gloomy or oppressive.`,
];

// ============================================================
// Prompt Building (synced from prompts.ts)
// ============================================================

function buildIdentity(restaurantName, cuisineSlug, priceTier) {
  const tierDescriptions = {
    upscale: "an upscale, fine-dining establishment known for refined cuisine and impeccable presentation",
    "mid-range": "a polished, quality dining destination with thoughtfully crafted dishes and inviting atmosphere",
    casual: "a welcoming, neighborhood favorite celebrated for authentic flavors and approachable charm",
  };
  const tierDescription = tierDescriptions[priceTier];
  const cuisineLabel = cuisineSlug ? cuisineSlug.replace(/-/g, " ") + " " : "";
  return `A professional graphic design of a printed restaurant menu for '${restaurantName}', ${tierDescription}. This is a ${cuisineLabel}restaurant. The design should feel like it was created by a top-tier graphic design agency specializing in hospitality branding.`;
}

function buildFormatModifier(format, cuisineSlug) {
  const styling = CUISINE_FOOD_STYLING[cuisineSlug];
  const cuisineStyling = styling
    ? format === "photo"
      ? styling.photo
      : styling.balanced
    : "";

  if (format === "photo") {
    return [
      "This is a FLAT 2D graphic design layout — a professional menu page, not a photograph of a physical menu on a table or surface.",
      "Photo-dominant menu design where food photography occupies at least 60% of the visual area, seamlessly integrated into the graphic layout.",
      "Each food image should look like professional editorial food photography: shot from a 45-degree overhead angle or dramatic low angle, with shallow depth of field, natural directional lighting from one side, and styled on appropriate serving vessels with intentional garnish placement and a few natural props.",
      "The food should appear freshly prepared with visible steam on hot dishes, glistening sauces, vibrant natural colors, and appealing textures — never plasticky, overly glossy, or artificial-looking.",
      "Text elements are minimal and highly legible — item names in small, elegant type positioned near their respective photographs, with sufficient contrast against the background.",
      "White space around photos creates breathing room and a sense of editorial sophistication.",
      cuisineStyling,
    ]
      .filter(Boolean)
      .join(" ");
  }

  if (format === "text_only") {
    return [
      "This is a FLAT 2D graphic design layout — a professional menu page, not a photograph of a physical menu.",
      "Typography-focused menu design with absolutely no food photographs or photographic imagery.",
      "Visual richness comes entirely from: decorative borders and corner ornaments, ornamental section dividers using hairline rules, flourishes, or geometric patterns, and sophisticated type pairing.",
      "Use a maximum of three typefaces: a decorative display face for the restaurant name, a complementary serif for section headers, and a highly readable serif or sans-serif for body text.",
      "Generous margins (at least 10% on each side) and abundant white space between sections create an airy, luxurious reading experience.",
      "Subtle background textures like linen weave, laid paper, handmade parchment, or watercolor washes add tactile depth without competing with the text.",
      "The overall feel should be that of a fine stationery piece, a bespoke wedding invitation, or a letterpress-printed broadside.",
    ].join(" ");
  }

  // balanced (default)
  return [
    "This is a FLAT 2D graphic design layout — a professional menu page, not a photograph of a physical menu on a table or surface.",
    "Balanced menu design with a harmonious mix of food photography and readable text content, approximately 40-50% imagery.",
    "Food images are medium-sized, framed within clean rectangular panels or soft-edged vignettes, each showing one signature dish styled with editorial-quality lighting and natural colors.",
    "Text sections use clear typographic hierarchy: section headers are bold and decorative, item names are medium weight, descriptions are light and subdued, and prices are right-aligned in a matching but smaller weight. Maximum three typefaces used throughout.",
    "The layout reads naturally top-to-bottom with clear section dividers — thin rules, subtle ornaments, or generous whitespace separating each section.",
    "Every piece of text must be sharp and legible with high contrast against its background.",
    cuisineStyling,
  ]
    .filter(Boolean)
    .join(" ");
}

function buildLayoutModifier(itemCount) {
  const columnAdvice =
    itemCount > 20
      ? "Use a two-column or three-column layout to fit the larger number of items efficiently without reducing text size below comfortable readability. Columns should have equal or intentionally asymmetric widths with a clear gutter between them."
      : "Use a single-column or relaxed two-column layout with generous spacing since the item count is manageable. The layout should feel spacious, never cramped.";
  return `Single-page menu design in portrait orientation (3:4 aspect ratio). All content must fit on one face. ${columnAdvice} Compose the layout using the rule of thirds: the restaurant name and primary branding occupy the top third, the main menu sections fill the middle third, and the final sections or a decorative footer anchor the bottom third. Visual weight should be evenly distributed — avoid top-heavy designs where all imagery clusters at the top and all text crowds at the bottom. Include visible margins of at least 5% on all sides to ensure print safety.`;
}

function buildHeaderDirective(restaurantName, format) {
  if (format === "text_only") {
    return `The restaurant name '${restaurantName}' must appear prominently at the top of the menu, rendered in crisp, perfectly legible characters in an elegant decorative typeface. Spell the name exactly as shown: '${restaurantName}'. Use typographic hierarchy — the restaurant name is the largest, most prominent text element on the entire page. Include a subtle decorative flourish or ornamental rule beneath the name.`;
  }
  return `The restaurant name '${restaurantName}' must appear prominently at the top of the menu, rendered in crisp, perfectly legible characters in a clean professional typeface with generous letter-spacing. Spell the name exactly as shown: '${restaurantName}'. Keep the header area simple and elegant — a well-set name with a subtle tagline area below, not a complex illustrated logo. The name should be the unmistakable focal point upon first glance.`;
}

function buildColorDirective(palette, format) {
  if (!palette || palette.length === 0) return null;

  const namedList = palette.map((c) => c.toUpperCase()).join(", ");

  if (format === "text_only") {
    return `The design's color palette is built around these colors: ${namedList}. Use the darkest color for primary text, the lightest for the background, and accent colors for headers, borders, and decorative elements. Natural tonal variations within each color family are encouraged — the palette should feel organic and sophisticated, not flat or digitally uniform.`;
  }

  return `The design's color palette is anchored to these colors: ${namedList}. Use these colors for backgrounds, text, borders, and decorative elements. Food photography should retain its natural colors — do not apply color filters to food images to match the palette. The palette colors frame and complement the food rather than dominating it. Subtle tonal gradients and shadow variations within the palette are encouraged for depth.`;
}

function buildQualitySuffix(format) {
  const base = [
    "CRITICAL RENDERING INSTRUCTIONS:",
    "The entire image IS the menu design itself — edge to edge, filling the full canvas with no surrounding surface, table, countertop, or background environment visible.",
    "This is a FLAT 2D GRAPHIC DESIGN — a professional print layout rendered digitally. It is NOT a photograph of a printed menu, NOT a 3D rendering of a menu sitting on a table, and NOT a mockup showing a menu in a real-world setting.",
    "Think of this as a direct export from Adobe InDesign or Illustrator — a perfectly flat, camera-facing, rectangular graphic design with no perspective distortion, no curling edges, no shadows cast by a physical object.",
  ];

  if (format === "text_only") {
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

function buildConstraintDirectives(format) {
  const universal = [
    "Do not include any watermarks, signatures, artist credits, or stock photo indicators on the design",
    "ALL visible text on the menu MUST be sharp, fully legible, and correctly formed — no blurred, smeared, melted, or gibberish text. Every letter must be a recognizable character. If text cannot be rendered clearly, use fewer words rather than illegible ones",
    "Text should read as plausible English menu content — real food names, real section headers, real descriptions. No random letter combinations or nonsense words",
    "Do not generate any distorted, melted, uncanny, or anatomically incorrect food imagery",
    "Avoid generic clip-art style illustrations — all visual elements should look professionally designed and intentional",
    "Do not place text over busy photographic backgrounds without sufficient contrast — always use a solid panel, gradient overlay, or dark scrim behind text that overlays images",
    "Do not render this as a 3D scene, a photograph of a physical menu, or a mockup on a table — it must be a flat 2D graphic design only",
  ];

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
  if (format === "text_only") {
    constraints = [...constraints, ...textOnlySpecific];
  } else if (format === "photo" || format === "balanced") {
    constraints = [...constraints, ...photoSpecific];
  }

  return "IMPORTANT CONSTRAINTS: " + constraints.join(". ") + ".";
}

function buildShowcasePrompt(item) {
  const itemCount = parseInt(item.contentGuidance.match(/(\d+) items/)?.[1] || "16", 10);

  const identity = buildIdentity(item.restaurantName, item.cuisineSlug, item.priceTier);
  const formatModifier = buildFormatModifier(item.format, item.cuisineSlug);
  const layoutModifier = buildLayoutModifier(itemCount);
  const headerDirective = buildHeaderDirective(item.restaurantName, item.format);
  const artDirection = [formatModifier, layoutModifier, headerDirective].filter(Boolean).join(" ");

  const colorDirective = item.colorPalette
    ? buildColorDirective(item.colorPalette, item.format)
    : null;

  const contentGuidance = `This menu is for '${item.restaurantName}'. ${item.contentGuidance}`;
  const variantPersonality = FALLBACK_VARIANT_PROMPTS[item.variantIndex];
  const qualitySuffix = buildQualitySuffix(item.format);
  const constraints = buildConstraintDirectives(item.format);

  return [identity, artDirection, colorDirective, contentGuidance, variantPersonality, qualitySuffix, constraints]
    .filter(Boolean)
    .join("\n\n");
}

// ============================================================
// Replicate API
// ============================================================

function getModelForFormat(format) {
  if (format === "text_only") return "ideogram-ai/ideogram-v3-turbo";
  return "google/nano-banana-2";
}

async function createPrediction(prompt, format) {
  const model = getModelForFormat(format);

  let input;
  if (model === "ideogram-ai/ideogram-v3-turbo") {
    input = {
      prompt,
      aspect_ratio: "3:4",
      style_type: "Design",
      magic_prompt_option: "Off",
      negative_prompt:
        "blurry text, illegible text, gibberish, misspelled words, distorted letters, low quality, watermark, 3D render, photo of menu on table",
    };
  } else {
    input = {
      prompt,
      aspect_ratio: "3:4",
      output_format: "png",
      resolution: "1K",
    };
  }

  const response = await fetch(
    `${REPLICATE_API_URL}/models/${model}/predictions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REPLICATE_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Replicate create failed (${model}): ${response.status} — ${err}`);
  }

  const data = await response.json();
  return { id: data.id, model };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollPrediction(id) {
  for (let attempt = 0; attempt < 60; attempt++) {
    await sleep(3000);
    const response = await fetch(`${REPLICATE_API_URL}/predictions/${id}`, {
      headers: { Authorization: `Bearer ${REPLICATE_TOKEN}` },
    });

    if (!response.ok) {
      throw new Error(`Replicate poll failed: ${response.status}`);
    }

    const data = await response.json();
    if (data.status === "succeeded") return data;
    if (data.status === "failed" || data.status === "canceled") {
      throw new Error(`Prediction ${id} ${data.status}: ${data.error || "unknown error"}`);
    }
    process.stdout.write(".");
  }
  throw new Error(`Prediction ${id} timed out after 3 minutes`);
}

async function downloadImage(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} for ${url}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, buffer);
  return buffer.length;
}

// ============================================================
// Main
// ============================================================

async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }

  const items = onlySlug
    ? SHOWCASE_ITEMS.filter((item) => item.slug === onlySlug)
    : SHOWCASE_ITEMS.filter((item) => item.slug !== "el-fuego"); // Skip el-fuego by default (already good)

  if (items.length === 0) {
    console.error(`No item found with slug: ${onlySlug}`);
    console.error("Available slugs:", SHOWCASE_ITEMS.map((i) => i.slug).join(", "));
    process.exit(1);
  }

  if (dryRun) {
    console.log(`\n=== DRY RUN: Previewing ${items.length} prompt(s) ===\n`);
    let totalCost = 0;
    for (const item of items) {
      const prompt = buildShowcasePrompt(item);
      const model = getModelForFormat(item.format);
      const cost = model === "ideogram-ai/ideogram-v3-turbo" ? 0.03 : 0.067;
      totalCost += cost;
      console.log(`\n${"=".repeat(60)}`);
      console.log(`[${item.slug}] ${item.restaurantName}`);
      console.log(`  Cuisine: ${item.cuisineSlug} | Format: ${item.format} | Tier: ${item.priceTier}`);
      console.log(`  Variant: ${item.variantIndex} | Colors: ${item.colorPalette ? item.colorPalette.join(", ") : "none"}`);
      console.log(`  Model: ${model} (~$${cost.toFixed(3)})`);
      console.log(`${"=".repeat(60)}`);
      console.log(prompt);
      console.log(`\n  Prompt length: ${prompt.length} characters\n`);
    }
    console.log(`\nTotal items: ${items.length}`);
    console.log(`Estimated cost: ~$${totalCost.toFixed(2)}`);
    return;
  }

  console.log(`\nGenerating ${items.length} showcase image(s)...\n`);

  // Fire all predictions in parallel
  console.log("Creating predictions...");
  const jobs = await Promise.all(
    items.map(async (item) => {
      const prompt = buildShowcasePrompt(item);
      try {
        const prediction = await createPrediction(prompt, item.format);
        console.log(`  [${item.slug}] prediction ${prediction.id} created (${prediction.model})`);
        return { item, predictionId: prediction.id, prompt, error: null };
      } catch (err) {
        console.error(`  [${item.slug}] FAILED to create: ${err.message}`);
        return { item, predictionId: null, prompt, error: err.message };
      }
    })
  );

  const validJobs = jobs.filter((j) => j.predictionId);
  if (validJobs.length === 0) {
    console.error("\nAll predictions failed to create. Exiting.");
    process.exit(1);
  }

  // Poll all predictions concurrently
  console.log(`\nPolling ${validJobs.length} prediction(s)...`);
  const results = await Promise.all(
    validJobs.map(async ({ item, predictionId }) => {
      process.stdout.write(`  [${item.slug}] `);
      try {
        const result = await pollPrediction(predictionId);
        const imageUrl = Array.isArray(result.output)
          ? result.output[0]
          : result.output;
        console.log(` done!`);
        return { item, imageUrl, error: null };
      } catch (err) {
        console.log(` FAILED: ${err.message}`);
        return { item, imageUrl: null, error: err.message };
      }
    })
  );

  // Download images
  const successResults = results.filter((r) => r.imageUrl);
  if (successResults.length === 0) {
    console.error("\nAll predictions failed. Exiting.");
    process.exit(1);
  }

  console.log(`\nDownloading ${successResults.length} image(s)...`);
  for (const { item, imageUrl } of successResults) {
    const outputPath = join(OUTPUT_DIR, `${item.slug}.png`);
    try {
      const bytes = await downloadImage(imageUrl, outputPath);
      const mb = (bytes / 1024 / 1024).toFixed(2);
      console.log(`  [${item.slug}] saved (${mb} MB) → ${outputPath}`);
    } catch (err) {
      console.error(`  [${item.slug}] download FAILED: ${err.message}`);
    }
  }

  // Summary
  const failedJobs = jobs.filter((j) => j.error);
  const failedPolls = results.filter((r) => r.error);

  console.log("\n=== Summary ===");
  console.log(`  Created:    ${validJobs.length}/${items.length}`);
  console.log(`  Succeeded:  ${successResults.length}/${validJobs.length}`);
  if (failedJobs.length > 0 || failedPolls.length > 0) {
    console.log(`  Failed:`);
    for (const j of failedJobs) console.log(`    - ${j.item.slug}: ${j.error}`);
    for (const r of failedPolls) console.log(`    - ${r.item.slug}: ${r.error}`);
    console.log(`\n  Re-run failed items with: --only=<slug>`);
  }

  console.log("\nImage paths for components:");
  for (const { item } of successResults) {
    console.log(`  ${item.restaurantName}: /showcase/${item.slug}.png`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
