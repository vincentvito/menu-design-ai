export interface PaletteRoles {
  background: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentAlt: string;
  border: string;
}

function normalizeHex(hex: string): string {
  const raw = hex.trim().replace(/^#/, "");
  if (raw.length === 3) {
    return `#${raw
      .split("")
      .map((ch) => ch + ch)
      .join("")
      .toUpperCase()}`;
  }
  if (raw.length === 6) {
    return `#${raw.toUpperCase()}`;
  }
  return "#000000";
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = normalizeHex(hex).replace("#", "");
  return {
    r: Number.parseInt(cleaned.slice(0, 2), 16),
    g: Number.parseInt(cleaned.slice(2, 4), 16),
    b: Number.parseInt(cleaned.slice(4, 6), 16),
  };
}

function channelToLinear(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.04045
    ? srgb / 12.92
    : ((srgb + 0.055) / 1.055) ** 2.4;
}

function getLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const lr = channelToLinear(r);
  const lg = channelToLinear(g);
  const lb = channelToLinear(b);
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function getSaturation(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const lightness = (max + min) / 2;
  if (max === min) return 0;
  const delta = max - min;
  return lightness > 0.5
    ? delta / (2 - max - min)
    : delta / (max + min);
}

function uniqueColors(colors: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const color of colors) {
    const normalized = normalizeHex(color);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result.length > 0 ? result : ["#000000", "#FFFFFF"];
}

export function mapPaletteToRoles(colors: string[]): PaletteRoles {
  const palette = uniqueColors(colors);
  const metrics = palette.map((hex) => ({
    hex,
    luminance: getLuminance(hex),
    saturation: getSaturation(hex),
  }));

  const byLuminance = [...metrics].sort((a, b) => a.luminance - b.luminance);
  const textPrimary = byLuminance[0]?.hex ?? palette[0];
  const textSecondary = byLuminance[1]?.hex ?? textPrimary;
  const background = byLuminance[byLuminance.length - 1]?.hex ?? palette[0];

  const availableForAccent = metrics.filter(
    (m) => m.hex !== background && m.hex !== textPrimary,
  );
  const bySaturation = [...availableForAccent].sort(
    (a, b) => b.saturation - a.saturation,
  );
  const accent = bySaturation[0]?.hex ?? background;
  const accentAlt =
    bySaturation.find((m) => m.hex !== accent)?.hex ?? textSecondary;

  const targetBorderLuminance =
    (getLuminance(background) + getLuminance(textPrimary)) / 2;
  const border =
    [...metrics].sort(
      (a, b) =>
        Math.abs(a.luminance - targetBorderLuminance) -
        Math.abs(b.luminance - targetBorderLuminance),
    )[0]?.hex ?? textSecondary;

  return {
    background,
    textPrimary,
    textSecondary,
    accent,
    accentAlt,
    border,
  };
}
