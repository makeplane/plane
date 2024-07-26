// types
import { TLogoProps } from "@plane/types";
// helpers
import { cn } from "@/helpers/common.helper";

type Props = {
  className?: string;
  logo: TLogoProps;
};

export const ProjectLogo: React.FC<Props> = (props) => {
  const { className, logo } = props;

  if (logo.in_use === "icon" && logo.icon)
    return (
      <span
        style={{
          color: logo.icon.color,
        }}
        className={cn("material-symbols-rounded text-base", className)}
      >
        {logo.icon.name}
      </span>
    );

  if (logo.in_use === "emoji" && logo.emoji)
    return (
      <span className={cn("text-base", className)}>
        {logo.emoji.value?.split("-").map((emoji) => String.fromCodePoint(parseInt(emoji, 10)))}
      </span>
    );

  return <span />;
};
