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

import type { MouseEventHandler, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@plane/utils";

export type EntityDetailWidgetToolbarProps = {
  children: ReactNode;
};

type ToolbarSectionProps = {
  children: ReactNode;
};

type ToolbarTextButtonProps = {
  icon: ReactNode;
  label: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
  className?: string;
};

type ToolbarDropdownButtonProps = {
  icon: ReactNode;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
  className?: string;
  ariaLabel: string;
};

type ToolbarIconButtonProps = {
  icon: ReactNode;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
  className?: string;
  ariaLabel: string;
};

// --- Container ---

export function EntityDetailWidgetToolbar({ children }: EntityDetailWidgetToolbarProps) {
  return (
    <div className="inline-flex w-fit items-center bg-layer-1 border border-subtle rounded-lg overflow-clip divide-x divide-subtle">
      {children}
    </div>
  );
}

// --- Section ---

function ToolbarSection({ children }: ToolbarSectionProps) {
  return <div className="flex items-center gap-1.5 p-1">{children}</div>;
}

// --- Text button (icon + label) ---

function ToolbarTextButton({ icon, label, disabled, onClick, className }: ToolbarTextButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex gap-1 h-7 min-w-12 items-center justify-center px-2 rounded-md text-secondary",
        disabled ? "opacity-50 pointer-events-none" : "hover:bg-layer-transparent-hover",
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      <span className="text-body-xs-medium whitespace-nowrap">{label}</span>
    </button>
  );
}

// --- Dropdown button (icon + chevron) ---

function ToolbarDropdownButton({ icon, disabled, onClick, className, ariaLabel }: ToolbarDropdownButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex gap-1 h-7 items-center justify-center px-1.5 rounded-md text-secondary",
        disabled ? "opacity-50 pointer-events-none" : "hover:bg-layer-transparent-hover",
        className
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {icon}
      <ChevronDown className="size-3.5 shrink-0" />
    </button>
  );
}

// --- Icon button (icon only) ---

function ToolbarIconButton({ icon, disabled, onClick, className, ariaLabel }: ToolbarIconButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex items-center justify-center size-7 rounded-md text-secondary",
        disabled ? "opacity-50 pointer-events-none" : "hover:bg-layer-transparent-hover",
        className
      )}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {icon}
    </button>
  );
}

EntityDetailWidgetToolbar.Section = ToolbarSection;
EntityDetailWidgetToolbar.TextButton = ToolbarTextButton;
EntityDetailWidgetToolbar.DropdownButton = ToolbarDropdownButton;
EntityDetailWidgetToolbar.IconButton = ToolbarIconButton;
