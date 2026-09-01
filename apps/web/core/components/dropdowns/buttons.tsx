/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// helpers
import { Button } from "@plane/propel/button";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { cn } from "@plane/utils";
// types
import { usePlatformOS } from "@/hooks/use-platform-os";
import { BACKGROUND_BUTTON_VARIANTS, BORDER_BUTTON_VARIANTS } from "./constants";
import type { TButtonVariants } from "./types";

export type DropdownButtonProps = {
  children: React.ReactNode;
  className?: string;
  isActive: boolean;
  tooltipContent?: string;
  tooltipHeading: string;
  showTooltip: boolean;
  variant: TButtonVariants;
  renderToolTipByDefault?: boolean;
};

type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  isActive: boolean;
  tooltipContent?: string;
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
  const { children, className, isActive, tooltipContent, tooltipHeading, showTooltip } = props;
  const { isMobile } = usePlatformOS();

  return (
    <Tooltip
      label={tooltipContent ? `${tooltipHeading}: ${tooltipContent}` : tooltipHeading}
      layout="stacked"
      disabled={!showTooltip || isMobile}
    >
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "flex h-full w-full items-center justify-start gap-1.5 border-[0.5px] border-strong",
          {
            "bg-layer-transparent-active": isActive,
          },
          className
        )}
      >
        {children}
      </Button>
    </Tooltip>
  );
}

function BackgroundButton(props: ButtonProps) {
  const { children, className, tooltipContent, tooltipHeading, showTooltip } = props;
  const { isMobile } = usePlatformOS();
  return (
    <Tooltip
      label={tooltipContent ? `${tooltipHeading}: ${tooltipContent}` : tooltipHeading}
      layout="stacked"
      disabled={!showTooltip || isMobile}
    >
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "flex h-full w-full items-center justify-between gap-1.5 bg-layer-3 hover:bg-layer-1-hover",
          className
        )}
      >
        {children}
      </Button>
    </Tooltip>
  );
}

function TransparentButton(props: ButtonProps) {
  const { children, className, isActive, tooltipContent, tooltipHeading, showTooltip } = props;
  const { isMobile } = usePlatformOS();
  return (
    <Tooltip
      label={tooltipContent ? `${tooltipHeading}: ${tooltipContent}` : tooltipHeading}
      layout="stacked"
      disabled={!showTooltip || isMobile}
    >
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "flex h-full w-full items-center justify-between gap-1.5",
          {
            "bg-layer-transparent-active": isActive,
          },
          className
        )}
      >
        {children}
      </Button>
    </Tooltip>
  );
}
