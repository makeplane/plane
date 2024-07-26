import React, { FC } from "react";
import { Emoji } from "emoji-picker-react";
import useFontFaceObserver from "use-font-face-observer";
// icons
import { LUCIDE_ICONS_LIST } from "./icons";
// helpers
import { emojiCodeToUnicode } from "./helpers";

type TLogoProps = {
  in_use: "emoji" | "icon";
  emoji?: {
    value?: string;
    url?: string;
  };
  icon?: {
    name?: string;
    color?: string;
  };
};

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
    return <Emoji unified={emojiCodeToUnicode(value)} size={size} />;
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
