/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

"use client";

import { Check } from "lucide-react";
import { cn } from "@plane/utils";

// the state groups a timer policy can target (triage is intentionally excluded)
export const TIMER_STATE_GROUPS: { key: string; label: string }[] = [
  { key: "backlog", label: "Backlog" },
  { key: "unstarted", label: "Unstarted" },
  { key: "started", label: "In Progress" },
  { key: "completed", label: "Done" },
  { key: "cancelled", label: "Cancelled" },
];

type TTimerStatesField = {
  value: string[];
  onChange: (groups: string[]) => void;
  disabled?: boolean;
};

export function TimerStatesField(props: TTimerStatesField) {
  const { value, onChange, disabled = false } = props;

  const toggle = (key: string) => {
    if (disabled) return;
    const next = new Set(value);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange([...next]);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {TIMER_STATE_GROUPS.map((group) => {
        const checked = value.includes(group.key);
        return (
          <button
            key={group.key}
            type="button"
            disabled={disabled}
            onClick={() => toggle(group.key)}
            className={cn(
              "text-sm flex items-center gap-2 rounded-md border px-3 py-1.5 transition-colors",
              checked
                ? "border-accent-strong bg-accent-subtle text-accent-primary"
                : "border-subtle text-secondary hover:bg-layer-1",
              disabled && "cursor-not-allowed opacity-60"
            )}
          >
            <span
              className={cn(
                "flex h-3.5 w-3.5 items-center justify-center rounded-sm border transition-colors",
                checked ? "border-accent-primary bg-accent-primary text-on-color" : "border-strong"
              )}
            >
              {checked && <Check className="h-2.5 w-2.5" />}
            </span>
            {group.label}
          </button>
        );
      })}
    </div>
  );
}
