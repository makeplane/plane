import React from "react";
// ui
import { Tooltip } from "../tooltip";

export type TAvatarSize = "sm" | "md" | "base" | "lg";

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
   * The source of the avatar image
   */
  src?: string;
};

export const getSizeInfo = (size: TAvatarSize) => {
  switch (size) {
    case "sm":
      return {
        avatarSize: "h-4 w-4",
        fontSize: "text-xs",
        spacing: "-space-x-1",
      };
    case "md":
      return {
        avatarSize: "h-5 w-5",
        fontSize: "text-xs",
        spacing: "-space-x-1",
      };
    case "base":
      return {
        avatarSize: "h-6 w-6",
        fontSize: "text-sm",
        spacing: "-space-x-1.5",
      };
    case "lg":
      return {
        avatarSize: "h-7 w-7",
        fontSize: "text-sm",
        spacing: "-space-x-1.5",
      };
    default:
      return {
        avatarSize: "h-5 w-5",
        fontSize: "text-xs",
        spacing: "-space-x-1",
      };
  }
};

export const Avatar: React.FC<Props> = (props) => {
  const {
    name,
    fallbackBackgroundColor,
    fallbackText,
    fallbackTextColor,
    showTooltip = true,
    size = "md",
    src,
  } = props;

  // get size details based on the size prop
  const sizeInfo = getSizeInfo(size);

  return (
    <Tooltip
      tooltipContent={fallbackText ?? name ?? "?"}
      disabled={!showTooltip}
    >
      <div
        className={`${sizeInfo.avatarSize} overflow-hidden rounded-full grid place-items-center`}
      >
        {src ? (
          <img src={src} className="h-full w-full rounded-full" alt={name} />
        ) : (
          <div
            className={`${sizeInfo.fontSize} grid place-items-center h-full w-full rounded-full`}
            style={{
              backgroundColor:
                fallbackBackgroundColor ?? "rgba(var(--color-primary-500))",
              color: fallbackTextColor ?? "#ffffff",
            }}
          >
            {name ? name[0].toUpperCase() : fallbackText ?? "?"}
          </div>
        )}
      </div>
    </Tooltip>
  );
};
