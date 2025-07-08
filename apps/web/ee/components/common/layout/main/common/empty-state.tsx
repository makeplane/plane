"use client";

import React, { FC } from "react";
// plane imports
import { cn } from "@plane/utils";

type TSectionEmptyStateProps = {
  heading: string;
  subHeading: string;
  icon: React.ReactNode;
  actionElement?: React.ReactNode;
  variant?: "outline" | "solid";
  iconVariant?: "square" | "round";
  size?: "sm" | "md";
  containerClassName?: string;
  contentClassName?: string;
};

export const SectionEmptyState: FC<TSectionEmptyStateProps> = (props) => {
  const {
    heading,
    subHeading,
    icon,
    actionElement,
    variant = "outline",
    iconVariant = "square",
    size = "sm",
    containerClassName,
    contentClassName,
  } = props;
  return (
    <div
      className={cn(
        "flex flex-col gap-4 items-center justify-center rounded-md px-10",
        {
          "border border-custom-border-200": variant === "outline",
          "bg-custom-background-90/70": variant === "solid",
          "py-10": size === "sm",
          "py-12": size === "md",
        },
        containerClassName
      )}
    >
      <div className={cn("flex flex-col items-center gap-2 text-center", contentClassName)}>
        <div
          className={cn("flex items-center justify-center bg-custom-background-80", {
            "rounded-full": iconVariant === "round",
            rounded: iconVariant === "square",
            "size-8": size === "sm",
            "size-12": size === "md",
          })}
        >
          {icon}
        </div>
        <span
          className={cn("font-medium", {
            "text-sm ": size === "sm",
            "text-base": size === "md",
          })}
        >
          {heading}
        </span>
        <span
          className={cn("text-custom-text-300", {
            "text-xs": size === "sm",
            "text-sm": size === "md",
          })}
        >
          {subHeading}
        </span>
      </div>
      {actionElement && <>{actionElement}</>}
    </div>
  );
};
