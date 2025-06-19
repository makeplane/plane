"use client";

import React from "react";
import { observer } from "mobx-react";
import Image from "next/image";
// ui
import { Button } from "@plane/ui/src/button";
// utils
import { cn } from "@plane/utils";

type EmptyStateSize = "sm" | "md" | "lg";

type ButtonConfig = {
  text: string;
  prependIcon?: React.ReactNode;
  appendIcon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
};

type Props = {
  title: string;
  description?: string;
  assetPath?: string;
  size?: EmptyStateSize;
  primaryButton?: ButtonConfig;
  secondaryButton?: ButtonConfig;
  customPrimaryButton?: React.ReactNode;
  customSecondaryButton?: React.ReactNode;
  className?: string;
};

const sizeClasses = {
  sm: "md:min-w-[24rem] max-w-[45rem]",
  md: "md:min-w-[28rem] max-w-[50rem]",
  lg: "md:min-w-[30rem] max-w-[60rem]",
} as const;

const CustomButton = ({
  config,
  variant,
  size,
}: {
  config: ButtonConfig;
  variant: "primary" | "neutral-primary";
  size: EmptyStateSize;
}) => (
  <Button
    variant={variant}
    size={size}
    onClick={config.onClick}
    prependIcon={config.prependIcon}
    appendIcon={config.appendIcon}
    disabled={config.disabled}
  >
    {config.text}
  </Button>
);

export const DetailedEmptyState: React.FC<Props> = observer((props) => {
  const {
    title,
    description,
    size = "lg",
    primaryButton,
    secondaryButton,
    customPrimaryButton,
    customSecondaryButton,
    assetPath,
    className,
  } = props;

  const hasButtons = primaryButton || secondaryButton || customPrimaryButton || customSecondaryButton;

  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-full min-w-full overflow-y-auto py-10 md:px-20 px-5",
        className
      )}
    >
      <div className={cn("flex flex-col gap-5", sizeClasses[size])}>
        <div className="flex flex-col gap-1.5 flex-shrink">
          <h3 className={cn("text-xl font-semibold", { "font-medium": !description })}>{title}</h3>
          {description && <p className="text-sm">{description}</p>}
        </div>

        {assetPath && (
          <Image src={assetPath} alt={title} width={384} height={250} layout="responsive" lazyBoundary="100%" />
        )}

        {hasButtons && (
          <div className="relative flex items-center justify-center gap-2 flex-shrink-0 w-full">
            {/* primary button */}
            {customPrimaryButton ??
              (primaryButton?.text && <CustomButton config={primaryButton} variant="primary" size={size} />)}
            {/* secondary button */}
            {customSecondaryButton ??
              (secondaryButton?.text && (
                <CustomButton config={secondaryButton} variant="neutral-primary" size={size} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
});
