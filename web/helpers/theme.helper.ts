import { TRgb, hexToRgb } from "@/helpers/color.helper";

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

export const applyTheme = (palette: string, isDarkPalette: boolean, dom: HTMLElement | null) => {
  if (!palette) return;
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

    dom?.style.setProperty(`--color-background-${shade}`, bgRgbValues);
    dom?.style.setProperty(`--color-text-${shade}`, textRgbValues);
    dom?.style.setProperty(`--color-primary-${shade}`, primaryRgbValues);
    dom?.style.setProperty(`--color-sidebar-background-${shade}`, sidebarBackgroundRgbValues);
    dom?.style.setProperty(`--color-sidebar-text-${shade}`, sidebarTextRgbValues);

    if (i >= 100 && i <= 400) {
      const borderShade = i === 100 ? 70 : i === 200 ? 80 : i === 300 ? 90 : 100;

      dom?.style.setProperty(
        `--color-border-${shade}`,
        `${bgShades[borderShade].r}, ${bgShades[borderShade].g}, ${bgShades[borderShade].b}`
      );
      dom?.style.setProperty(
        `--color-sidebar-border-${shade}`,
        `${sidebarBackgroundShades[borderShade].r}, ${sidebarBackgroundShades[borderShade].g}, ${sidebarBackgroundShades[borderShade].b}`
      );
    }
  }

  dom?.style.setProperty("--color-scheme", values[5]);
};

export const unsetCustomCssVariables = () => {
  for (let i = 10; i <= 900; i >= 100 ? (i += 100) : (i += 10)) {
    const dom = document.querySelector<HTMLElement>("[data-theme='custom']");

    dom?.style.removeProperty(`--color-background-${i}`);
    dom?.style.removeProperty(`--color-text-${i}`);
    dom?.style.removeProperty(`--color-border-${i}`);
    dom?.style.removeProperty(`--color-primary-${i}`);
    dom?.style.removeProperty(`--color-sidebar-background-${i}`);
    dom?.style.removeProperty(`--color-sidebar-text-${i}`);
    dom?.style.removeProperty(`--color-sidebar-border-${i}`);
    dom?.style.removeProperty("--color-scheme");
  }
};

export const resolveGeneralTheme = (resolvedTheme: string | undefined) =>
  resolvedTheme?.includes("light") ? "light" : resolvedTheme?.includes("dark") ? "dark" : "system";
