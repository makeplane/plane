export const hexToRgb = (hex: string) => {
  hex = hex.toLowerCase();
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)].join(",")
    : null;
};

export const applyTheme = (palette: string, isDarkPalette: boolean) => {
  const values: string[] = [];
  palette.split(",").map((color: string) => {
    const cssVarColor = hexToRgb(color);
    if (cssVarColor) values.push(cssVarColor);
  });

  const cssVars = [
    "--color-bg-base",
    "--color-bg-surface-1",
    "--color-bg-surface-2",
    "--color-border",
    "--color-bg-sidebar",
    "--color-accent-50",
    "--color-accent-100",
    "--color-accent-200",
    "--color-accent-300",
    "--color-accent-400",
    "--color-accent-500",
    "--color-accent-600",
    "--color-accent-700",
    "--color-accent-800",
    "--color-accent-900",
    "--color-text-base",
    "--color-text-secondary",
    "color-scheme",
  ];

  values.push(isDarkPalette ? "dark" : "light");

  cssVars.forEach((cssVar, i) =>
    document
      .querySelector<HTMLElement>("[data-theme='custom']")
      ?.style.setProperty(cssVar, values[i])
  );
};
