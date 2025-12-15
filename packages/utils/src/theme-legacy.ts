/**
 * Legacy Theme System
 *
 * This file contains the old 5-color theme system for backward compatibility.
 *
 * @deprecated Most functions in this file are deprecated
 * New code should use the OKLCH-based theme system from ./theme/ instead
 *
 * Functions:
 * - applyTheme: OLD 5-color theme system (background, text, primary, sidebarBg, sidebarText)
 * - unsetCustomCssVariables: Clears both old AND new theme variables (updated for OKLCH)
 * - resolveGeneralTheme: Utility to resolve theme mode (still useful)
 * - migrateLegacyTheme: Converts old 5-color theme to new 2-color system
 *
 * For new implementations:
 * - Use: import { applyCustomTheme, clearCustomTheme } from '@plane/utils/theme'
 * - See: packages/utils/src/theme/theme-application.ts
 */

// local imports
import type { TRgb } from "./color";
import { hexToRgb } from "./color";

type TShades = {
  10: TRgb;
  20: TRgb;
  30: TRgb;
  40: TRgb;
  50: TRgb;
  60: TRgb;
  70: TRgb;
  80: TRgb;
  90: TRgb;
  100: TRgb;
  200: TRgb;
  300: TRgb;
  400: TRgb;
  500: TRgb;
  600: TRgb;
  700: TRgb;
  800: TRgb;
  900: TRgb;
};

const calculateShades = (hexValue: string): TShades => {
  const shades: Partial<TShades> = {};
  const { r, g, b } = hexToRgb(hexValue);

  const convertHexToSpecificShade = (shade: number): TRgb => {
    if (shade <= 100) {
      const decimalValue = (100 - shade) / 100;

      const newR = Math.floor(r + (255 - r) * decimalValue);
      const newG = Math.floor(g + (255 - g) * decimalValue);
      const newB = Math.floor(b + (255 - b) * decimalValue);

      return {
        r: newR,
        g: newG,
        b: newB,
      };
    } else {
      const decimalValue = 1 - Math.ceil((shade - 100) / 100) / 10;

      const newR = Math.ceil(r * decimalValue);
      const newG = Math.ceil(g * decimalValue);
      const newB = Math.ceil(b * decimalValue);

      return {
        r: newR,
        g: newG,
        b: newB,
      };
    }
  };

  for (let i = 10; i <= 900; i >= 100 ? (i += 100) : (i += 10))
    shades[i as keyof TShades] = convertHexToSpecificShade(i);

  return shades as TShades;
};

export const applyTheme = (palette: string, isDarkPalette: boolean) => {
  if (!palette) return;
  const themeElement = document?.querySelector("html");
  // palette: [bg, text, primary, sidebarBg, sidebarText]
  const values: string[] = palette.split(",");
  values.push(isDarkPalette ? "dark" : "light");

  const bgShades = calculateShades(values[0]);
  const textShades = calculateShades(values[1]);
  const primaryShades = calculateShades(values[2]);
  const sidebarBackgroundShades = calculateShades(values[3]);
  const sidebarTextShades = calculateShades(values[4]);

  for (let i = 10; i <= 900; i >= 100 ? (i += 100) : (i += 10)) {
    const shade = i as keyof TShades;

    const bgRgbValues = `${bgShades[shade].r}, ${bgShades[shade].g}, ${bgShades[shade].b}`;
    const textRgbValues = `${textShades[shade].r}, ${textShades[shade].g}, ${textShades[shade].b}`;
    const primaryRgbValues = `${primaryShades[shade].r}, ${primaryShades[shade].g}, ${primaryShades[shade].b}`;
    const sidebarBackgroundRgbValues = `${sidebarBackgroundShades[shade].r}, ${sidebarBackgroundShades[shade].g}, ${sidebarBackgroundShades[shade].b}`;
    const sidebarTextRgbValues = `${sidebarTextShades[shade].r}, ${sidebarTextShades[shade].g}, ${sidebarTextShades[shade].b}`;

    themeElement?.style.setProperty(`--color-background-${shade}`, bgRgbValues);
    themeElement?.style.setProperty(`--color-text-${shade}`, textRgbValues);
    themeElement?.style.setProperty(`--color-primary-${shade}`, primaryRgbValues);
    themeElement?.style.setProperty(`--color-sidebar-background-${shade}`, sidebarBackgroundRgbValues);
    themeElement?.style.setProperty(`--color-sidebar-text-${shade}`, sidebarTextRgbValues);

    if (i >= 100 && i <= 400) {
      const borderShade = i === 100 ? 70 : i === 200 ? 80 : i === 300 ? 90 : 100;

      themeElement?.style.setProperty(
        `--color-border-${shade}`,
        `${bgShades[borderShade].r}, ${bgShades[borderShade].g}, ${bgShades[borderShade].b}`
      );
      themeElement?.style.setProperty(
        `--color-sidebar-border-${shade}`,
        `${sidebarBackgroundShades[borderShade].r}, ${sidebarBackgroundShades[borderShade].g}, ${sidebarBackgroundShades[borderShade].b}`
      );
    }
  }

  themeElement?.style.setProperty("--color-scheme", values[5]);
};

/**
 * Clear custom theme CSS variables set by the new OKLCH theme system
 * Removes all custom palette and derived color variables
 */
export const unsetCustomCssVariables = () => {
  const themeElement = document?.querySelector("html");
  if (!themeElement) return;

  // Clear neutral base palette colors
  const neutralKeys = [
    "white",
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900",
    "1000",
    "1100",
    "1200",
    "black",
  ];
  neutralKeys.forEach((key) => {
    themeElement.style.removeProperty(`--color-neutral-${key}`);
  });

  // Clear brand base palette colors
  const brandKeys = ["100", "200", "300", "400", "500", "600", "700", "800", "900", "1000", "1100", "1200", "default"];
  brandKeys.forEach((key) => {
    themeElement.style.removeProperty(`--color-brand-${key}`);
  });

  // Clear alpha colors
  const alphaShades = ["0", "100", "200", "300", "400", "500", "600", "700", "800", "900", "1000", "1100", "1200"];
  alphaShades.forEach((shade) => {
    themeElement.style.removeProperty(`--color-alpha-white-${shade}`);
    themeElement.style.removeProperty(`--color-alpha-black-${shade}`);
  });

  // Clear derived semantic colors
  const derivedColors = [
    "--background-color-canvas",
    "--background-color-surface-1",
    "--background-color-surface-2",
    "--background-color-layer-1",
    "--background-color-layer-2",
    "--background-color-layer-3",
    "--text-color-primary",
    "--text-color-secondary",
    "--text-color-tertiary",
    "--text-color-placeholder",
    "--border-color-subtle",
    "--border-color-subtle-1",
    "--border-color-strong",
    "--background-color-accent-primary",
    "--text-color-accent-primary",
    "--border-color-accent-strong",
  ];
  derivedColors.forEach((color) => {
    themeElement.style.removeProperty(color);
  });

  // Clear legacy variables (for backward compatibility)
  for (let i = 10; i <= 900; i >= 100 ? (i += 100) : (i += 10)) {
    themeElement.style.removeProperty(`--color-background-${i}`);
    themeElement.style.removeProperty(`--color-text-${i}`);
    themeElement.style.removeProperty(`--color-border-${i}`);
    themeElement.style.removeProperty(`--color-primary-${i}`);
    themeElement.style.removeProperty(`--color-sidebar-background-${i}`);
    themeElement.style.removeProperty(`--color-sidebar-text-${i}`);
    themeElement.style.removeProperty(`--color-sidebar-border-${i}`);
  }
  themeElement.style.removeProperty("--color-scheme");
};

export const resolveGeneralTheme = (resolvedTheme: string | undefined) =>
  resolvedTheme?.includes("light") ? "light" : resolvedTheme?.includes("dark") ? "dark" : "system";

/**
 * Migrate legacy 5-color theme to new 2-color system
 * Best effort conversion: primary -> brand, background -> neutral
 *
 * @deprecated This function is for backward compatibility only
 * Use the new applyCustomTheme from @plane/utils/theme instead
 */
export const migrateLegacyTheme = (legacyTheme: {
  primary?: string;
  background?: string;
  darkPalette?: boolean;
}): { brandColor: string; neutralColor: string; themeMode: "light" | "dark" } => {
  return {
    brandColor: legacyTheme.primary || "#3f76ff",
    neutralColor: legacyTheme.background || "#1a1a1a",
    themeMode: legacyTheme.darkPalette ? "dark" : "light",
  };
};
