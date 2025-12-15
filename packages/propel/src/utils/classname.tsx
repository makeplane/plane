import { clsx } from "clsx";
import type { ClassValue } from "clsx";

import { extendTailwindMerge } from "tailwind-merge";

// Support email can be configured by the application
export const getSupportEmail = (defaultEmail: string = ""): string => defaultEmail;

// Matches custom typography classes: text-h1-semibold, text-body-md-regular, text-caption-xs-medium, etc.
const isCustomTypography = (value: string) =>
  !/^(h[1-6]|body-(xs|sm|md)|caption-(xs|sm|md))-(regular|medium|semibold|bold)$/.test(value);

// Matches custom font size classes: text-9, text-10, text-11, text-12, text-13, text-14, text-16, text-18, text-20, text-24, text-28, text-32, text-40
const isCustomFontSize = (value: string) => /^(9|10|11|12|13|14|16|18|20|24|28|32|40)$/.test(value);

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
