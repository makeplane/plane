/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Due to some weird issue with the import order, the import of useFontFaceObserver
// should be after the imported here rather than some below helper functions as it is in the original file

import useFontFaceObserver from "use-font-face-observer";
import { useState } from "react";
import type { ReactNode } from "react";
// plane imports
import { getFileURL } from "@plane/utils";
// types
import type { Logo as LogoType } from "../types/logo";
// local imports
import { getEmojiSize, sanitizeLogoImageUrl, stringToEmoji } from "./helper";
import { LUCIDE_ICONS_LIST } from "./lucide-icons";

export type LogoProps = {
  logo?: LogoType;
  size?: number;
  type?: "lucide" | "material";
  /**
   * Shown instead of an image logo whose URL is refused or fails to load — typically the entity's
   * generic icon. Defaults to the same sized placeholder as an empty logo.
   */
  fallback?: ReactNode;
};

export function Logo({ logo, size = 16, type = "material", fallback }: LogoProps) {
  // The image URL that failed to load; a different URL gets a fresh attempt.
  const [failedImageUrl, setFailedImageUrl] = useState<string | undefined>(undefined);
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

  const { in_use, emoji, icon, image } = logo;

  // Image rendering — the URL is user-supplied data, so it is checked here, at render time.
  if (in_use === "image") {
    const safeUrl = sanitizeLogoImageUrl(image?.url);
    const src = safeUrl ? getFileURL(safeUrl) : undefined;
    if (!src || src === failedImageUrl) return <>{fallback ?? loadingSkeleton}</>;

    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        draggable={false}
        referrerPolicy="no-referrer"
        className="shrink-0 rounded-sm object-contain"
        style={{ height: size, width: size }}
        onError={() => setFailedImageUrl(src)}
      />
    );
  }

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
