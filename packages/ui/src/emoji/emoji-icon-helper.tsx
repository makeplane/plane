import { Placement } from "@popperjs/core";
import { EmojiClickData, Theme } from "emoji-picker-react";

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
      value: EmojiClickData;
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
  theme?: Theme;
  iconType?: "material" | "lucide";
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
