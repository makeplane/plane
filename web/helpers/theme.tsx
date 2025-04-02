import chroma from "chroma-js";

interface HSLColor {
  h: number; // hue (0-360)
  s: number; // saturation (0-100)
  l: number; // lightness (0-100)
}

interface ColorAdjustmentOptions {
  targetContrast?: number; // Minimum contrast ratio (4.5 for WCAG AAA, 3 for WCAG AA)
  preserveHue?: boolean; // Whether to maintain the original hue
  maxTries?: number; // Maximum attempts to find accessible colors
}

// Helper function to ensure color contrast compliance
const ensureAccessibleColors = (
  foreground: string,
  background: string,
  options: ColorAdjustmentOptions = {}
): { foreground: string; background: string } => {
  const {
    targetContrast = 4.5, // WCAG AAA by default
    preserveHue = true,
    maxTries = 10,
  } = options;

  try {
    const fg = chroma(foreground);
    const bg = chroma(background);
    let contrast = chroma.contrast(fg, bg);

    // If contrast is already good, return original colors
    if (contrast >= targetContrast) {
      return { foreground, background };
    }

    // Adjust colors to meet contrast requirements
    let adjustedFg = fg;
    let adjustedBg = bg;
    let tries = 0;

    while (contrast < targetContrast && tries < maxTries) {
      if (fg.luminance() > bg.luminance()) {
        // Make foreground lighter and background darker
        adjustedFg = preserveHue ? fg.luminance(Math.min(fg.luminance() + 0.1, 0.9)) : fg.brighten(0.5);
        adjustedBg = preserveHue ? bg.luminance(Math.max(bg.luminance() - 0.1, 0.1)) : bg.darken(0.5);
      } else {
        // Make foreground darker and background lighter
        adjustedFg = preserveHue ? fg.luminance(Math.max(fg.luminance() - 0.1, 0.1)) : fg.darken(0.5);
        adjustedBg = preserveHue ? bg.luminance(Math.min(bg.luminance() + 0.1, 0.9)) : bg.brighten(0.5);
      }

      contrast = chroma.contrast(adjustedFg, adjustedBg);
      tries++;
    }

    return {
      foreground: adjustedFg.css(),
      background: adjustedBg.css(),
    };
  } catch (error) {
    console.warn("Color adjustment failed:", error);
    return { foreground, background };
  }
};

// background color
export const createBackgroundColor = (hsl: HSLColor, resolvedTheme: "light" | "dark" = "light"): string => {
  const baseColor = chroma.hsl(hsl.h, hsl.s / 100, hsl.l / 100);

  // Set base opacity according to theme
  const baseOpacity = resolvedTheme === "dark" ? 0.25 : 0.15;

  // Create semi-transparent background
  let backgroundColor = baseColor.alpha(baseOpacity);

  if (hsl.l > 90) {
    backgroundColor = baseColor.darken(1).alpha(resolvedTheme === "dark" ? 0.3 : 0.2);
  } else if (hsl.l > 70) {
    backgroundColor = baseColor.darken(0.5).alpha(resolvedTheme === "dark" ? 0.28 : 0.18);
  } else if (hsl.l < 30) {
    backgroundColor = baseColor.brighten(0.5).alpha(resolvedTheme === "dark" ? 0.22 : 0.12);
  }

  return backgroundColor.css();
};

// foreground color
export const getIconColor = (hsl: HSLColor): string => {
  const baseColor = chroma.hsl(hsl.h, hsl.s / 100, hsl.l / 100);
  const backgroundColor = createBackgroundColor(hsl);

  // Adjust colors for accessibility
  const { foreground } = ensureAccessibleColors(baseColor.css(), backgroundColor, {
    targetContrast: 3, // WCAG AA for UI components
    preserveHue: true,
  });

  return foreground;
};
