"use client";

// helpers
import { Tooltip } from "@plane/ui";
import { cn } from "@/helpers/common.helper";
// types
import { usePlatformOS } from "@/hooks/use-platform-os";
import { BACKGROUND_BUTTON_VARIANTS, BORDER_BUTTON_VARIANTS } from "./constants";
import { TButtonVariants } from "./types";

export type DropdownButtonProps = {
  children: React.ReactNode;
  className?: string;
  isActive: boolean;
  tooltipContent: string | React.ReactNode;
  tooltipHeading: string;
  showTooltip: boolean;
  variant: TButtonVariants;
};

type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  isActive: boolean;
  tooltipContent: string | React.ReactNode;
  tooltipHeading: string;
  showTooltip: boolean;
};

export const DropdownButton: React.FC<DropdownButtonProps> = (props) => {
  const { children, className, isActive, tooltipContent, tooltipHeading, showTooltip, variant } = props;
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
    >
      {children}
    </ButtonToRender>
  );
};

const BorderButton: React.FC<ButtonProps> = (props) => {
  const { children, className, isActive, tooltipContent, tooltipHeading, showTooltip } = props;
  const { isMobile } = usePlatformOS();

  return (
    <Tooltip
      tooltipHeading={tooltipHeading}
      tooltipContent={tooltipContent}
      disabled={!showTooltip}
      isMobile={isMobile}
    >
      <div
        className={cn(
          "h-full flex items-center gap-1.5 border-[0.5px] border-custom-border-300 hover:bg-custom-background-80 rounded text-xs px-2 py-0.5",
          { "bg-custom-background-80": isActive },
          className
        )}
      >
        {children}
      </div>
    </Tooltip>
  );
};

const BackgroundButton: React.FC<ButtonProps> = (props) => {
  const { children, className, tooltipContent, tooltipHeading, showTooltip } = props;
  const { isMobile } = usePlatformOS();
  return (
    <Tooltip
      tooltipHeading={tooltipHeading}
      tooltipContent={tooltipContent}
      disabled={!showTooltip}
      isMobile={isMobile}
    >
      <div
        className={cn(
          "h-full flex items-center gap-1.5 rounded text-xs px-2 py-0.5 bg-custom-background-80",
          className
        )}
      >
        {children}
      </div>
    </Tooltip>
  );
};

const TransparentButton: React.FC<ButtonProps> = (props) => {
  const { children, className, isActive, tooltipContent, tooltipHeading, showTooltip } = props;
  const { isMobile } = usePlatformOS();
  return (
    <Tooltip
      tooltipHeading={tooltipHeading}
      tooltipContent={tooltipContent}
      disabled={!showTooltip}
      isMobile={isMobile}
    >
      <div
        className={cn(
          "h-full flex items-center gap-1.5 rounded text-xs px-2 py-0.5 hover:bg-custom-background-80",
          { "bg-custom-background-80": isActive },
          className
        )}
      >
        {children}
      </div>
    </Tooltip>
  );
};
