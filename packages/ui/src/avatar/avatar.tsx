// ui
import { Tooltip } from "@plane/propel/tooltip";
// helpers
import { cn } from "../utils";
import type { TAvatarSize } from "./helper";
import { getBorderRadius, getSizeInfo, isAValidNumber } from "./helper";

type Props = {
  /**
   * The name of the avatar which will be displayed on the tooltip
   */
  name?: string;
  /**
   * The background color if the avatar image fails to load
   */
  fallbackBackgroundColor?: string;
  /**
   * The text to display if the avatar image fails to load
   */
  fallbackText?: string;
  /**
   * The text color if the avatar image fails to load
   */
  fallbackTextColor?: string;
  /**
   * Whether to show the tooltip or not
   * @default true
   */
  showTooltip?: boolean;
  /**
   * The size of the avatars
   * Possible values: "sm", "md", "base", "lg"
   * @default "md"
   */
  size?: TAvatarSize;
  /**
   * The shape of the avatar
   * Possible values: "circle", "square"
   * @default "circle"
   */
  shape?: "circle" | "square";
  /**
   * The source of the avatar image
   */
  src?: string;
  /**
   * The custom CSS class name to apply to the component
   */
  className?: string;
};

export function Avatar(props: Props) {
  const {
    name,
    fallbackBackgroundColor,
    fallbackText,
    fallbackTextColor,
    showTooltip = true,
    size = "md",
    shape = "circle",
    src,
    className = "",
  } = props;

  // get size details based on the size prop
  const sizeInfo = getSizeInfo(size);

  return (
    <Tooltip tooltipContent={fallbackText ?? name ?? "?"} disabled={!showTooltip}>
      <div
        className={cn("grid place-items-center overflow-hidden", getBorderRadius(shape), {
          [sizeInfo.avatarSize]: !isAValidNumber(size),
        })}
        style={
          isAValidNumber(size)
            ? {
                height: `${size}px`,
                width: `${size}px`,
              }
            : {}
        }
        tabIndex={-1}
      >
        {src ? (
          <img src={src} className={cn("h-full w-full", getBorderRadius(shape), className)} alt={name} />
        ) : (
          <div
            className={cn(
              sizeInfo.fontSize,
              "grid h-full w-full place-items-center",
              getBorderRadius(shape),
              className
            )}
            style={{
              backgroundColor: fallbackBackgroundColor ?? "#028375",
              color: fallbackTextColor ?? "#ffffff",
            }}
          >
            {name?.[0]?.toUpperCase() ?? fallbackText ?? "?"}
          </div>
        )}
      </div>
    </Tooltip>
  );
}
