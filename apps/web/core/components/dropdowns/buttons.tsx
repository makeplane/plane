import React from "react";
// helpers
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
// types
import { usePlatformOS } from "@/hooks/use-platform-os";
import { BACKGROUND_BUTTON_VARIANTS, BORDER_BUTTON_VARIANTS } from "./constants";
import type { TButtonVariants } from "./types";

export type DropdownButtonProps = {
  children: React.ReactNode;
  className?: string;
  isActive: boolean;
  tooltipContent?: string | React.ReactNode | null;
  tooltipHeading: string;
  showTooltip: boolean;
  variant: TButtonVariants;
  renderToolTipByDefault?: boolean;
};

type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  isActive: boolean;
  tooltipContent?: string | React.ReactNode | null;
  tooltipHeading: string;
  showTooltip: boolean;
  renderToolTipByDefault?: boolean;
};

export function DropdownButton(props: DropdownButtonProps) {
  const {
    children,
    className,
    isActive,
    tooltipContent,
    renderToolTipByDefault = true,
    tooltipHeading,
    showTooltip,
    variant,
  } = props;
  const ButtonToRender: React.FC<ButtonProps> = BORDER_BUTTON_VARIANTS.includes(variant)
    ? BorderButton
    : BACKGROUND_BUTTON_VARIANTS.includes(variant)
      ? BackgroundButton
      : TransparentButton;

  return (
    <ButtonToRender
      className={className}
      isActive={isActive}
      tooltipContent={tooltipContent}
      tooltipHeading={tooltipHeading}
      showTooltip={showTooltip}
      renderToolTipByDefault={renderToolTipByDefault}
    >
      {children}
    </ButtonToRender>
  );
}

function BorderButton(props: ButtonProps) {
  const { children, className, isActive, tooltipContent, renderToolTipByDefault, tooltipHeading, showTooltip } = props;
  const { isMobile } = usePlatformOS();

  return (
    <Tooltip
      tooltipHeading={tooltipHeading}
      tooltipContent={<>{tooltipContent}</>}
      disabled={!showTooltip}
      isMobile={isMobile}
      renderByDefault={renderToolTipByDefault}
    >
      <div
        className={cn(
          "h-full w-full flex items-center gap-1.5 border-[0.5px] border-custom-border-300 hover:bg-custom-background-80 rounded text-xs px-2 py-0.5",
          { "bg-custom-background-80": isActive },
          className
        )}
      >
        {children}
      </div>
    </Tooltip>
  );
}

function BackgroundButton(props: ButtonProps) {
  const { children, className, tooltipContent, tooltipHeading, renderToolTipByDefault, showTooltip } = props;
  const { isMobile } = usePlatformOS();
  return (
    <Tooltip
      tooltipHeading={tooltipHeading}
      tooltipContent={<>{tooltipContent}</>}
      disabled={!showTooltip}
      isMobile={isMobile}
      renderByDefault={renderToolTipByDefault}
    >
      <div
        className={cn(
          "h-full w-full flex items-center gap-1.5 rounded text-xs px-2 py-0.5 bg-custom-background-80",
          className
        )}
      >
        {children}
      </div>
    </Tooltip>
  );
}

function TransparentButton(props: ButtonProps) {
  const { children, className, isActive, tooltipContent, tooltipHeading, renderToolTipByDefault, showTooltip } = props;
  const { isMobile } = usePlatformOS();
  return (
    <Tooltip
      tooltipHeading={tooltipHeading}
      tooltipContent={<>{tooltipContent}</>}
      disabled={!showTooltip}
      isMobile={isMobile}
      renderByDefault={renderToolTipByDefault}
    >
      <div
        className={cn(
          "h-full w-full flex items-center gap-1.5 rounded text-xs px-2 py-0.5 hover:bg-custom-background-80",
          { "bg-custom-background-80": isActive },
          className
        )}
      >
        {children}
      </div>
    </Tooltip>
  );
}
