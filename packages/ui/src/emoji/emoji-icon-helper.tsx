import { Placement } from "@popperjs/core";

export enum EmojiIconPickerTypes {
  EMOJI = "emoji",
  ICON = "icon",
}

export const TABS_LIST = [
  {
    key: EmojiIconPickerTypes.EMOJI,
    title: "Emojis",
  },
  {
    key: EmojiIconPickerTypes.ICON,
    title: "Icons",
  },
];

export type TChangeHandlerProps =
  | {
      type: EmojiIconPickerTypes.EMOJI;
      value: string;
    }
  | {
      type: EmojiIconPickerTypes.ICON;
      value: {
        name: string;
        color: string;
      };
    };

export type TCustomEmojiPicker = {
  isOpen: boolean;
  handleToggle: (value: boolean) => void;
  buttonClassName?: string;
  className?: string;
  closeOnSelect?: boolean;
  defaultIconColor?: string;
  defaultOpen?: EmojiIconPickerTypes;
  disabled?: boolean;
  dropdownClassName?: string;
  label: React.ReactNode;
  onChange: (value: TChangeHandlerProps) => void;
  placement?: Placement;
  searchDisabled?: boolean;
  searchPlaceholder?: string;
  iconType?: "material" | "lucide";
  theme?: "light" | "dark";
};

export const DEFAULT_COLORS = ["#95999f", "#6d7b8a", "#5e6ad2", "#02b5ed", "#02b55c", "#f2be02", "#e57a00", "#f38e82"];

export type TIconsListProps = {
  defaultColor: string;
  onChange: (val: { name: string; color: string }) => void;
  searchDisabled?: boolean;
};

/**
 * Adjusts the given hex color to ensure it has enough contrast.
 * @param {string} hex - The hex color code input by the user.
 * @returns {string} - The adjusted hex color code.
 */
export const adjustColorForContrast = (hex: string): string => {
  // Ensure hex color is valid
  if (!/^#([0-9A-F]{3}){1,2}$/i.test(hex)) {
    throw new Error("Invalid hex color code");
  }

  // Convert hex to RGB
  let r = 0,
    g = 0,
    b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex[1] + hex[2], 16);
    g = parseInt(hex[3] + hex[4], 16);
    b = parseInt(hex[5] + hex[6], 16);
  }

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // If the color is too light, darken it
  if (luminance > 0.5) {
    r = Math.max(0, r - 50);
    g = Math.max(0, g - 50);
    b = Math.max(0, b - 50);
  }

  // Convert RGB back to hex
  const toHex = (value: number): string => {
    const hex = value.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Enhanced emoji to decimal conversion that preserves emoji sequences
 * This function handles complex emoji sequences including skin tone modifiers
 * @param emoji - The emoji string to convert
 * @returns Array of decimal Unicode code points
 */
export function emojiToDecimalEnhanced(emoji: string): number[] {
  const codePoints: number[] = [];

  // Use Array.from to properly handle multi-byte Unicode characters
  const characters = Array.from(emoji);

  for (const char of characters) {
    const codePoint = char.codePointAt(0);
    if (codePoint !== undefined) {
      codePoints.push(codePoint);
    }
  }

  return codePoints;
}

/**
 * Enhanced decimal to emoji conversion that handles emoji sequences
 * @param decimals - Array of decimal Unicode code points
 * @returns The reconstructed emoji string
 */
export function decimalToEmojiEnhanced(decimals: number[]): string {
  return decimals.map((decimal) => String.fromCodePoint(decimal)).join("");
}

/**
 * Converts emoji to a string representation for storage
 * This creates a comma-separated string of decimal values
 * @param emoji - The emoji string to convert
 * @returns String representation of decimal values
 */
export function emojiToString(emoji: string): string {
  const decimals = emojiToDecimalEnhanced(emoji);
  return decimals.join("-");
}

/**
 * Converts string representation back to emoji
 * @param emojiString - Comma-separated string of decimal values
 * @returns The reconstructed emoji string
 */
export function stringToEmoji(emojiString: string): string {
  const decimals = emojiString.split("-").map(Number);
  return decimalToEmojiEnhanced(decimals);
}

export const getEmojiSize = (size: number) => {
  return size * 0.9 * 0.0625;
};
