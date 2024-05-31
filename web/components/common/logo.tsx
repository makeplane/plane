import { FC } from "react";
// emoji-picker-react
import { Emoji } from "emoji-picker-react";
// import { icons } from "lucide-react";
import { TLogoProps } from "@plane/types";
// helpers
import { LUCIDE_ICONS_LIST } from "@plane/ui";
import { emojiCodeToUnicode } from "@/helpers/emoji.helper";

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

  // if no value, return empty fragment
  if (!value) return <></>;

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
