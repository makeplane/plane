"use client";

import type { LucideIcon } from "lucide-react";
import { Grid3x3, List } from "lucide-react";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";

export type MatrixViewMode = "list" | "matrix";

type MatrixViewToggleProps = {
  className?: string;
  disabled?: boolean;
  isMobile?: boolean;
  onChange: (view: MatrixViewMode) => void;
  value: MatrixViewMode;
};

const VIEW_OPTIONS: Array<{ icon: LucideIcon; label: string; value: MatrixViewMode }> = [
  { icon: List, label: "List", value: "list" },
  { icon: Grid3x3, label: "Matrix", value: "matrix" },
];

export const MatrixViewToggle = ({
  className,
  disabled = false,
  isMobile = false,
  onChange,
  value,
}: MatrixViewToggleProps) => (
  <div
    aria-label="Tag view"
    className={cn("flex items-center gap-1 rounded bg-custom-background-80 p-1", className)}
    role="group"
  >
    {VIEW_OPTIONS.map((option) => {
      const Icon = option.icon;
      const isActive = value === option.value;

      return (
        <Tooltip key={option.value} tooltipContent={`${option.label} view`} isMobile={isMobile}>
          <button
            type="button"
            aria-label={`${option.label} view`}
            aria-pressed={isActive}
            className={cn(
              "group grid h-8 w-8 place-items-center rounded text-custom-text-200 transition-colors",
              "hover:bg-custom-background-100 hover:text-custom-text-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-custom-primary-100",
              isActive && "bg-custom-background-100 text-custom-text-100 shadow-custom-shadow-2xs",
              disabled && "cursor-not-allowed opacity-50"
            )}
            disabled={disabled}
            onClick={() => {
              if (!isActive) onChange(option.value);
            }}
          >
            <Icon aria-hidden="true" className="h-3.5 w-3.5" size={14} strokeWidth={2} />
          </button>
        </Tooltip>
      );
    })}
  </div>
);
