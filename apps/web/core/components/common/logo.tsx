"use client";

import type { FC } from "react";
// Due to some weird issue with the import order, the import of useFontFaceObserver
// should be after the imported here rather than some below helper functions as it is in the original file
// eslint-disable-next-line import/order
import useFontFaceObserver from "use-font-face-observer";
// plane imports
import { getEmojiSize, LUCIDE_ICONS_LIST, stringToEmoji } from "@plane/propel/emoji-icon-picker";
import type { TLogoProps } from "@plane/types";

type Props = {
  logo: TLogoProps;
  size?: number;
  type?: "lucide" | "material";
};

export const Logo: FC<Props> = (props) => {
  const { logo, size = 16, type = "material" } = props;

  // destructuring the logo object
  const { in_use, emoji, icon } = logo;

  // derived values
  const value = in_use === "emoji" ? emoji?.value : icon?.name;
  const color = icon?.color;
  const lucideIcon = LUCIDE_ICONS_LIST.find((item) => item.name === value);

  const isMaterialSymbolsFontLoaded = useFontFaceObserver([
    {
      family: `Material Symbols Rounded`,
      style: `normal`,
      weight: `normal`,
      stretch: `condensed`,
    },
  ]);
  // if no value, return empty fragment
  if (!value) return <></>;

  if (!isMaterialSymbolsFontLoaded) {
    return (
      <span
        style={{
          height: size,
          width: size,
        }}
        className="rounded animate-pulse bg-custom-background-80"
      />
    );
  }

  // emoji
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

  // icon
  if (in_use === "icon") {
    return (
      <>
        {type === "lucide" ? (
          <>
            {lucideIcon && (
              <lucideIcon.element
                style={{
                  color: color,
                  height: size,
                  width: size,
                }}
              />
            )}
          </>
        ) : (
          <span
            className="material-symbols-rounded"
            style={{
              fontSize: size,
              color: color,
              scale: "115%",
            }}
          >
            {value}
          </span>
        )}
      </>
    );
  }

  // if no value, return empty fragment
  return <></>;
};
