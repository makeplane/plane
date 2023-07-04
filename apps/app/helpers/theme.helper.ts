import { TRgb, hexToRgb } from "helpers/color.helper";

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
  950: TRgb;
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

  for (let i = 10; i <= 90; i += 10) shades[i as keyof TShades] = convertHexToSpecificShade(i);
  for (let i = 100; i <= 900; i += 100) shades[i as keyof TShades] = convertHexToSpecificShade(i);

  shades[950 as keyof TShades] = convertHexToSpecificShade(950);

  return shades as TShades;
};

export const applyTheme = (palette: string, isDarkPalette: boolean) => {
  // palette: [bg, text, accent, sidebarBg]
  const values: string[] = palette.split(",");
  values.push(isDarkPalette ? "dark" : "light");

  const bgShades = calculateShades(values[0]);
  const textShades = calculateShades(values[1]);
  const accentShades = calculateShades(values[2]);
  const sidebarShades = calculateShades(values[3]);

  for (let i = 10; i <= 90; i += 10) {
    const shade = i as keyof TShades;

    const bgRgbValues = `${bgShades[shade].r}, ${bgShades[shade].g}, ${bgShades[shade].b}`;
    const textRgbValues = `${textShades[shade].r}, ${textShades[shade].g}, ${textShades[shade].b}`;
    const accentRgbValues = `${accentShades[shade].r}, ${accentShades[shade].g}, ${accentShades[shade].b}`;
    const sidebarRgbValues = `${sidebarShades[shade].r}, ${sidebarShades[shade].g}, ${sidebarShades[shade].b}`;

    document
      .querySelector<HTMLElement>("[data-theme='custom']")
      ?.style.setProperty(`--color-bg-${shade}`, bgRgbValues);
    document
      .querySelector<HTMLElement>("[data-theme='custom']")
      ?.style.setProperty(`--color-text-${shade}`, textRgbValues);
    document
      .querySelector<HTMLElement>("[data-theme='custom']")
      ?.style.setProperty(`--color-accent-${shade}`, accentRgbValues);
    document
      .querySelector<HTMLElement>("[data-theme='custom']")
      ?.style.setProperty(`--color-sidebar-${shade}`, sidebarRgbValues);
  }
  for (let i = 100; i <= 900; i += 100) {
    const shade = i as keyof TShades;

    const bgRgbValues = `${bgShades[shade].r}, ${bgShades[shade].g}, ${bgShades[shade].b}`;
    const textRgbValues = `${textShades[shade].r}, ${textShades[shade].g}, ${textShades[shade].b}`;
    const accentRgbValues = `${accentShades[shade].r}, ${accentShades[shade].g}, ${accentShades[shade].b}`;
    const sidebarRgbValues = `${sidebarShades[shade].r}, ${sidebarShades[shade].g}, ${sidebarShades[shade].b}`;

    document
      .querySelector<HTMLElement>("[data-theme='custom']")
      ?.style.setProperty(`--color-bg-${shade}`, bgRgbValues);
    document
      .querySelector<HTMLElement>("[data-theme='custom']")
      ?.style.setProperty(`--color-text-${shade}`, textRgbValues);
    document
      .querySelector<HTMLElement>("[data-theme='custom']")
      ?.style.setProperty(`--color-accent-${shade}`, accentRgbValues);
    document
      .querySelector<HTMLElement>("[data-theme='custom']")
      ?.style.setProperty(`--color-sidebar-${shade}`, sidebarRgbValues);
  }

  const bgRgbValues = `${bgShades[950].r}, ${bgShades[950].g}, ${bgShades[950].b}`;
  const textRgbValues = `${textShades[950].r}, ${textShades[950].g}, ${textShades[950].b}`;
  const accentRgbValues = `${accentShades[950].r}, ${accentShades[950].g}, ${accentShades[950].b}`;
  const sidebarRgbValues = `${sidebarShades[950].r}, ${sidebarShades[950].g}, ${sidebarShades[950].b}`;

  document
    .querySelector<HTMLElement>("[data-theme='custom']")
    ?.style.setProperty(`--color-bg-${950}`, bgRgbValues);
  document
    .querySelector<HTMLElement>("[data-theme='custom']")
    ?.style.setProperty(`--color-text-${950}`, textRgbValues);
  document
    .querySelector<HTMLElement>("[data-theme='custom']")
    ?.style.setProperty(`--color-accent-${950}`, accentRgbValues);
  document
    .querySelector<HTMLElement>("[data-theme='custom']")
    ?.style.setProperty(`--color-sidebar-${950}`, sidebarRgbValues);

  document
    .querySelector<HTMLElement>("[data-theme='custom']")
    ?.style.setProperty("--color-scheme", values[4]);
};
