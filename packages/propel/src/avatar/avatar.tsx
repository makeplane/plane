/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import React from "react";
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import { cn } from "../utils/classname";

export type TAvatarSize = "sm" | "md" | "base" | "lg" | number;

type Props = {
  name?: string; //The name of the avatar which will be displayed on the tooltip
  fallbackBackgroundColor?: string; //The background color if the avatar image fails to load
  fallbackText?: string;
  fallbackTextColor?: string; //The text color if the avatar image fails to load
  showTooltip?: boolean;
  size?: TAvatarSize; //The size of the avatars
  shape?: "circle" | "square";
  src?: string; //The source of the avatar image
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
        fontSize: "text-11",
        spacing: "-space-x-1",
      };
    case "md":
      return {
        avatarSize: "h-5 w-5",
        fontSize: "text-11",
        spacing: "-space-x-1",
      };
    case "base":
      return {
        avatarSize: "h-6 w-6",
        fontSize: "text-13",
        spacing: "-space-x-1.5",
      };
    case "lg":
      return {
        avatarSize: "h-7 w-7",
        fontSize: "text-13",
        spacing: "-space-x-1.5",
      };
    default:
      return {
        avatarSize: "h-5 w-5",
        fontSize: "text-11",
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
      return "rounded-sm";
    default:
      return "rounded-full";
  }
};

/**
 * Check if the value is a valid number
 * @param value The value to check
 * @returns Whether the value is a valid number or not
 */
export const isAValidNumber = (value: unknown): value is number => typeof value === "number" && !Number.isNaN(value);

export function Avatar(props: Props) {
  const {
    name,
    fallbackBackgroundColor,
    fallbackText,
    fallbackTextColor,
    size = "md",
    shape = "circle",
    src,
    className = "",
  } = props;

  // get size details based on the size prop
  const sizeInfo = getSizeInfo(size);

  const fallbackLetter = name?.[0]?.toUpperCase() ?? fallbackText ?? "?";
  return (
    <div
      className={cn("grid place-items-center overflow-hidden", getBorderRadius(shape), {
        [sizeInfo.avatarSize]: !isAValidNumber(size),
      })}
      style={
        isAValidNumber(size)
          ? {
              width: `${size}px`,
              height: `${size}px`,
            }
          : {}
      }
      tabIndex={-1}
    >
      <AvatarPrimitive.Root className={cn("h-full w-full", getBorderRadius(shape), className)}>
        <AvatarPrimitive.Image src={src} width="48" height="48" />
        <AvatarPrimitive.Fallback
          className={cn(sizeInfo.fontSize, "grid h-full w-full place-items-center", getBorderRadius(shape), className)}
          style={{
            backgroundColor: fallbackBackgroundColor ?? "var(--background-color-accent-primary)",
            color: fallbackTextColor ?? "var(--text-color-on-color)",
          }}
        >
          {fallbackLetter}
        </AvatarPrimitive.Fallback>
      </AvatarPrimitive.Root>
    </div>
  );
}
