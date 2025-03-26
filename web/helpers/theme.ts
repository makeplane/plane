interface HSLColor {
  h: number; // hue (0-360)
  s: number; // saturation (0-100)
  l: number; // lightness (0-100)
}

export const createBackgroundColor = (hsl: HSLColor): string => {
  if (hsl.l > 90) {
    // Very light colors - increase opacity and darken slightly
    return `hsla(${hsl.h}, ${hsl.s}%, ${Math.max(85, hsl.l - 10)}%, 0.25)`;
  } else if (hsl.l > 70) {
    // Light colors
    return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l - 5}%, 0.22)`;
  } else if (hsl.l > 50) {
    // Medium colors
    return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, 0.18)`;
  } else {
    // Dark colors - increase lightness and opacity slightly
    return `hsla(${hsl.h}, ${hsl.s}%, ${Math.min(hsl.l + 5, 50)}%, 0.15)`;
  }
};

export const getIconColor = (hsl: HSLColor): string => {
  if (hsl.l > 85) {
    // Very light colors - darken significantly for better contrast
    return `hsl(${hsl.h}, ${Math.min(hsl.s + 10, 100)}%, ${hsl.l * 0.35}%)`;
  } else if (hsl.l > 70) {
    // Light colors - darken moderately
    return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l * 0.5}%)`;
  } else if (hsl.l < 30) {
    // Very dark colors - lighten for better visibility
    return `hsl(${hsl.h}, ${Math.min(hsl.l * 2, 85)}%, ${hsl.l}%)`;
  }
  // Medium colors - keep original
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
};
