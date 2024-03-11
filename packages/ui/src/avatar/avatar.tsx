import React from "react";
// ui
import { Tooltip } from "../tooltip";

export type TAvatarSize = "sm" | "md" | "base" | "lg" | number;

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

/**
 * Get the size details based on the size prop
 * @param size The size of the avatar
 * @returns The size details
 */
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

/**
 * Get the border radius based on the shape prop
 * @param shape The shape of the avatar
 * @returns The border radius
 */
export const getBorderRadius = (shape: "circle" | "square") => {
  switch (shape) {
    case "circle":
      return "rounded-full";
    case "square":
      return "rounded";
    default:
      return "rounded-full";
  }
};

/**
 * Check if the value is a valid number
 * @param value The value to check
 * @returns Whether the value is a valid number or not
 */
export const isAValidNumber = (value: any) => typeof value === "number" && !isNaN(value);

export const Avatar: React.FC<Props> = (props) => {
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
        className={`${
          !isAValidNumber(size) ? sizeInfo.avatarSize : ""
        } grid place-items-center overflow-hidden ${getBorderRadius(shape)}`}
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
          <img src={src} className={`h-full w-full ${getBorderRadius(shape)} ${className}`} alt={name} />
        ) : (
          <div
            className={`${sizeInfo.fontSize} grid h-full w-full place-items-center ${getBorderRadius(
              shape
            )} ${className}`}
            style={{
              backgroundColor: fallbackBackgroundColor ?? "rgba(var(--color-primary-500))",
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
