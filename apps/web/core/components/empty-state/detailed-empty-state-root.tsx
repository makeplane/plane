import React from "react";
import { observer } from "mobx-react";
// ui
import { Button } from "@plane/propel/button";
// utils
import { cn } from "@plane/utils";

type EmptyStateSize = "sm" | "base" | "lg";

type ButtonConfig = {
  text: string;
  prependIcon?: React.ReactElement;
  appendIcon?: React.ReactElement;
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
  base: "md:min-w-[28rem] max-w-[50rem]",
  lg: "md:min-w-[30rem] max-w-[60rem]",
} as const;

function CustomButton({
  config,
  variant,
  size,
}: {
  config: ButtonConfig;
  variant: "primary" | "secondary";
  size: EmptyStateSize;
}) {
  return (
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
}

export const DetailedEmptyState = observer(function DetailedEmptyState(props: Props) {
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
        <div className="flex flex-col gap-1.5 shrink-0">
          <h3 className={cn("text-18 font-semibold", { "font-medium": !description })}>{title}</h3>
          {description && <p className="text-13">{description}</p>}
        </div>

        {assetPath && <img src={assetPath} alt={title} className="w-full h-auto" loading="lazy" />}

        {hasButtons && (
          <div className="relative flex items-center justify-center gap-2 flex-shrink-0 w-full">
            {/* primary button */}
            {customPrimaryButton ??
              (primaryButton?.text && <CustomButton config={primaryButton} variant="primary" size={size} />)}
            {/* secondary button */}
            {customSecondaryButton ??
              (secondaryButton?.text && <CustomButton config={secondaryButton} variant="secondary" size={size} />)}
          </div>
        )}
      </div>
    </div>
  );
});
