import type { TCustomPlaylistAnnotation } from "../types/annotation.types";
import { DEFAULT_VIDEO_ANNOTATION_COLOR } from "./video-annotation-editor-config";
import { clampTimelineValue } from "./video-annotation-timeline";

const getAnnotationColor = (annotation: TCustomPlaylistAnnotation) => {
  const style = annotation.style ?? {};
  return typeof style.stroke === "string" ? style.stroke : typeof style.color === "string" ? style.color : "#f97316";
};

const normalizeAnnotationHexColor = (value: string) => {
  const trimmedValue = value.trim();
  const prefixedValue = trimmedValue.startsWith("#") ? trimmedValue : `#${trimmedValue}`;

  return /^#[0-9a-fA-F]{6}$/.test(prefixedValue) ? prefixedValue.toLowerCase() : null;
};

const getRgbFromHexColor = (colorValue: string) => {
  const normalizedColor = normalizeAnnotationHexColor(colorValue) ?? DEFAULT_VIDEO_ANNOTATION_COLOR;
  const colorNumber = Number.parseInt(normalizedColor.slice(1), 16);

  return {
    blue: colorNumber & 255,
    green: (colorNumber >> 8) & 255,
    red: (colorNumber >> 16) & 255,
  };
};

const getHexColorFromRgb = (red: number, green: number, blue: number) => {
  const toHexChannel = (channelValue: number) =>
    Math.round(clampTimelineValue(channelValue, 0, 255))
      .toString(16)
      .padStart(2, "0");

  return `#${toHexChannel(red)}${toHexChannel(green)}${toHexChannel(blue)}`;
};

const getHsvFromRgb = (red: number, green: number, blue: number) => {
  const normalizedRed = clampTimelineValue(red, 0, 255) / 255;
  const normalizedGreen = clampTimelineValue(green, 0, 255) / 255;
  const normalizedBlue = clampTimelineValue(blue, 0, 255) / 255;
  const maxChannel = Math.max(normalizedRed, normalizedGreen, normalizedBlue);
  const minChannel = Math.min(normalizedRed, normalizedGreen, normalizedBlue);
  const delta = maxChannel - minChannel;
  let hue = 0;

  if (delta > 0) {
    if (maxChannel === normalizedRed) {
      hue = 60 * (((normalizedGreen - normalizedBlue) / delta) % 6);
    } else if (maxChannel === normalizedGreen) {
      hue = 60 * ((normalizedBlue - normalizedRed) / delta + 2);
    } else {
      hue = 60 * ((normalizedRed - normalizedGreen) / delta + 4);
    }
  }

  return {
    hue: hue < 0 ? hue + 360 : hue,
    saturation: maxChannel === 0 ? 0 : delta / maxChannel,
    value: maxChannel,
  };
};

const getRgbFromHsv = (hue: number, saturation: number, value: number) => {
  const normalizedHue = ((hue % 360) + 360) % 360;
  const normalizedSaturation = clampTimelineValue(saturation, 0, 1);
  const normalizedValue = clampTimelineValue(value, 0, 1);
  const chroma = normalizedValue * normalizedSaturation;
  const huePrime = normalizedHue / 60;
  const x = chroma * (1 - Math.abs((huePrime % 2) - 1));
  const match = normalizedValue - chroma;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (huePrime >= 0 && huePrime < 1) {
    red = chroma;
    green = x;
  } else if (huePrime < 2) {
    red = x;
    green = chroma;
  } else if (huePrime < 3) {
    green = chroma;
    blue = x;
  } else if (huePrime < 4) {
    green = x;
    blue = chroma;
  } else if (huePrime < 5) {
    red = x;
    blue = chroma;
  } else {
    red = chroma;
    blue = x;
  }

  return {
    blue: Math.round((blue + match) * 255),
    green: Math.round((green + match) * 255),
    red: Math.round((red + match) * 255),
  };
};

const getHexColorFromHsv = (hue: number, saturation: number, value: number) => {
  const rgbColor = getRgbFromHsv(hue, saturation, value);
  return getHexColorFromRgb(rgbColor.red, rgbColor.green, rgbColor.blue);
};

const getTimelineColorWithAlpha = (color: string, alpha: number) => {
  const normalizedColor = color.trim();
  const hexMatch = normalizedColor.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hexMatch) {
    const hexValue =
      hexMatch[1].length === 3
        ? hexMatch[1]
            .split("")
            .map((character) => `${character}${character}`)
            .join("")
        : hexMatch[1];
    const red = parseInt(hexValue.slice(0, 2), 16);
    const green = parseInt(hexValue.slice(2, 4), 16);
    const blue = parseInt(hexValue.slice(4, 6), 16);

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  const rgbMatch = normalizedColor.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${alpha})`;
  }

  return normalizedColor;
};

export {
  getAnnotationColor,
  getHexColorFromHsv,
  getHexColorFromRgb,
  getHsvFromRgb,
  getRgbFromHexColor,
  getTimelineColorWithAlpha,
  normalizeAnnotationHexColor,
};
