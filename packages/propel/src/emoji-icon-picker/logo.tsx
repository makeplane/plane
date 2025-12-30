// Due to some weird issue with the import order, the import of useFontFaceObserver
// should be after the imported here rather than some below helper functions as it is in the original file

import useFontFaceObserver from "use-font-face-observer";
// plane imports
import type { TLogoProps } from "@plane/types";
// local imports
import { getEmojiSize, stringToEmoji } from "./helper";
import { LUCIDE_ICONS_LIST } from "./lucide-icons";

type Props = {
  logo?: TLogoProps;
  size?: number;
  type?: "lucide" | "material";
};

export function Logo({ logo, size = 16, type = "material" }: Props) {
  const isMaterialSymbolsFontLoaded = useFontFaceObserver([
    {
      family: "Material Symbols Rounded",
      style: "normal",
      weight: "normal",
      stretch: "condensed",
    },
  ]);

  // Reusable loading skeleton
  const loadingSkeleton = <span style={{ height: size, width: size }} className="rounded-sm bg-layer-1" />;

  // Early returns for loading/empty states
  if (!logo || !logo.in_use) return loadingSkeleton;

  const { in_use, emoji, icon } = logo;
  const value = in_use === "emoji" ? emoji?.value : icon?.name;

  if (!value) return loadingSkeleton;

  // Emoji rendering
  if (in_use === "emoji") {
    return (
      <span
        className="flex items-center justify-center"
        style={{
          fontSize: `${getEmojiSize(size)}rem`,
          lineHeight: `${getEmojiSize(size)}rem`,
          height: size,
          width: size,
        }}
      >
        {stringToEmoji(emoji?.value || "")}
      </span>
    );
  }

  // Icon rendering
  if (in_use === "icon") {
    const color = icon?.color;

    // Lucide icon
    if (type === "lucide") {
      const lucideIcon = LUCIDE_ICONS_LIST.find((item) => item.name === value);
      if (!lucideIcon) return null;

      const LucideIconElement = lucideIcon.element;
      return <LucideIconElement style={{ color, height: size, width: size }} />;
    }

    if (!isMaterialSymbolsFontLoaded) return loadingSkeleton;

    // Material icon
    return (
      <span
        className="material-symbols-rounded"
        style={{
          fontSize: size,
          color,
          scale: "115%",
        }}
      >
        {value}
      </span>
    );
  }

  return null;
}
