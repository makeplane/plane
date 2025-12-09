import { clsx } from "clsx";
import type { ClassValue } from "clsx";

import { extendTailwindMerge } from "tailwind-merge";

// Support email can be configured by the application
export const getSupportEmail = (defaultEmail: string = ""): string => defaultEmail;

// Matches custom typography classes: text-h1-semibold, text-body-md-regular, text-caption-medium, etc.
const isCustomTypography = (value: string) =>
  /^(h[1-6]|body-(sm|md)|caption)-(regular|medium|semibold|bold)$/.test(value);

// Matches custom font size classes: text-9, text-10, text-11, ..., text-40
const isCustomFontSize = (value: string) => /^\d+$/.test(value);

// Matches custom text color classes: text-primary, text-on-color, text-secondary, etc.
const CUSTOM_TEXT_COLORS = [
  "primary",
  "secondary",
  "tertiary",
  "placeholder",
  "disabled",
  "accent-primary",
  "accent-secondary",
  "on-color",
  "on-color-disabled",
  "inverse",
  "success",
  "success-primary",
  "success-secondary",
  "warning",
  "warning-primary",
  "warning-secondary",
  "danger",
  "danger-primary",
  "danger-secondary",
];
const isCustomTextColor = (value: string) => CUSTOM_TEXT_COLORS.includes(value);

const twMerge = extendTailwindMerge<"custom-typography" | "custom-text-color">({
  override: {
    classGroups: {
      // Override font-size to include custom numeric sizes and exclude custom typography/colors
      "font-size": [
        {
          text: [
            (value: string) => isCustomFontSize(value) || (!isCustomTypography(value) && !isCustomTextColor(value)),
          ],
        },
      ],
    },
  },
  extend: {
    classGroups: {
      // Custom typography in its own group
      "custom-typography": [{ text: [isCustomTypography] }],
      // Custom text colors in their own group (won't conflict with font sizes)
      "custom-text-color": [{ text: [isCustomTextColor] }],
    },
  },
});

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
