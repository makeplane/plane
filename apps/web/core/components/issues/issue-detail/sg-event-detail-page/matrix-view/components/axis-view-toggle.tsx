"use client";

import { ArrowRightLeft } from "lucide-react";
import { ToggleSwitch } from "@plane/ui";
import { cn } from "@plane/utils";

type AxisViewToggleProps = {
  className?: string;
  disabled?: boolean;
  isSwitched: boolean;
  onChange: (isSwitched: boolean) => void;
};

export const AxisViewToggle = ({ className, disabled = false, isSwitched, onChange }: AxisViewToggleProps) => (
  <label
    className={cn("flex min-h-8 items-center gap-2", disabled ? "cursor-not-allowed" : "cursor-pointer", className)}
  >
    <ToggleSwitch
      value={isSwitched}
      onChange={onChange}
      label="Switch axis view"
      size="sm"
      disabled={disabled}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sg-matrix-active-border)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--sg-matrix-panel-secondary)]"
    />
    <div className="flex min-w-0 items-center gap-1.5 text-[11px] text-[var(--sg-matrix-text-secondary)]">
      <ArrowRightLeft aria-hidden="true" className="hidden h-3.5 w-3.5 flex-shrink-0" />
      <span className="whitespace-nowrap">Switch Axis View</span>
      <span className="sr-only">{isSwitched ? "Actions are rows" : "Event entities are rows"}</span>
    </div>
  </label>
);
