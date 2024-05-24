import { FC } from "react";
// emoji-picker-react
import { Emoji } from "emoji-picker-react";
import { TLogoProps } from "@plane/types";
// helpers
import { emojiCodeToUnicode } from "@/helpers/emoji.helper";

type Props = {
  logo: TLogoProps;
  size?: number;
};

export const Logo: FC<Props> = (props) => {
  const { logo, size = 16 } = props;

  // destructuring the logo object
  const { in_use, emoji, icon } = logo;

  // derived values
  const value = in_use === "emoji" ? emoji?.value : icon?.name;
  const color = icon?.color;

  // if no value, return empty fragment
  if (!value) return <></>;

  // emoji
  if (in_use === "emoji") {
    return <Emoji unified={emojiCodeToUnicode(value)} size={size} />;
  }

  // icon
  if (in_use === "icon") {
    return (
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
    );
  }

  // if no value, return empty fragment
  return <></>;
};
