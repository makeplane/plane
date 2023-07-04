import { TRgb, hexToRgb } from "helpers/color.helper";

export const applyTheme = (palette: string, isDarkPalette: boolean) => {
  // palette: [bg, border, sidebarBg, accent, textBase, textSecondary, scheme]
  const values: string[] = palette.split(",");
  values.push(isDarkPalette ? "dark" : "light");

  for (let i = 0; i < 10; i++) {
    const bgShades = calculateShades(values[0]);
    const accentShades = calculateShades(values[3]);

    const shade = (i === 0 ? 50 : i * 100) as keyof TShades;

    const bgRgbValues = `${bgShades[shade].r}, ${bgShades[shade].g}, ${bgShades[shade].b}`;
    const accentRgbValues = `${accentShades[shade].r}, ${accentShades[shade].g}, ${accentShades[shade].b}`;

    document
      .querySelector<HTMLElement>("[data-theme='custom']")
      ?.style.setProperty(`--color-bg-${shade}`, bgRgbValues);
    document
      .querySelector<HTMLElement>("[data-theme='custom']")
      ?.style.setProperty(`--color-accent-${shade}`, accentRgbValues);
  }

  const border = hexToRgb(values[1]);
  document
    .querySelector<HTMLElement>("[data-theme='custom']")
    ?.style.setProperty("--color-border", `${border.r}, ${border.g}, ${border.b}`);

  const sidebarBg = hexToRgb(values[2]);
  document
    .querySelector<HTMLElement>("[data-theme='custom']")
    ?.style.setProperty("--color-bg-sidebar", `${sidebarBg.r}, ${sidebarBg.g}, ${sidebarBg.b}`);

  const textBase = hexToRgb(values[4]);
  document
    .querySelector<HTMLElement>("[data-theme='custom']")
    ?.style.setProperty("--color-text-base", `${textBase.r}, ${textBase.g}, ${textBase.b}`);

  const textSecondary = hexToRgb(values[5]);
  document
    .querySelector<HTMLElement>("[data-theme='custom']")
    ?.style.setProperty(
      "--color-text-secondary",
      `${textSecondary.r}, ${textSecondary.g}, ${textSecondary.b}`
    );
  document
    .querySelector<HTMLElement>("[data-theme='custom']")
    ?.style.setProperty("--color-scheme", values[6]);
};

type TShades = {
  50: TRgb;
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

  const convertHexToSpecificShade = (shade: number): TRgb => {
    const { r, g, b } = hexToRgb(hexValue);

    if (shade > 500) {
      let decimalValue = 0.1;

      if (shade === 600) decimalValue = 0.9;
      else if (shade === 700) decimalValue = 0.8;
      else if (shade === 800) decimalValue = 0.7;
      else if (shade === 900) decimalValue = 0.6;

      const newR = Math.ceil(r * decimalValue);
      const newG = Math.ceil(g * decimalValue);
      const newB = Math.ceil(b * decimalValue);

      return {
        r: newR,
        g: newG,
        b: newB,
      };
    } else {
      const decimalValue = 1 - (shade * 2) / 1000;

      const newR = Math.floor(r + (255 - r) * decimalValue);
      const newG = Math.floor(g + (255 - g) * decimalValue);
      const newB = Math.floor(b + (255 - b) * decimalValue);

      return {
        r: newR,
        g: newG,
        b: newB,
      };
    }
  };

  shades[50] = convertHexToSpecificShade(50);
  for (let i = 100; i <= 900; i += 100) shades[i as keyof TShades] = convertHexToSpecificShade(i);

  return shades as TShades;
};
