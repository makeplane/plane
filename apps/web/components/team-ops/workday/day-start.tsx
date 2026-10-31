/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TDayMode } from "@plane/types";
import { cn } from "@plane/utils";

const MODES: { value: TDayMode; label: string; text: string }[] = [
  { value: "ONSITE", label: "Onsite", text: "At the office" },
  { value: "REMOTE", label: "Remote", text: "From home or elsewhere" },
];

export const modeLabel = (mode: TDayMode) => MODES.find((item) => item.value === mode)?.label ?? mode;

/** The first question of every day. Nothing else on the page works until it is answered. */
export function DayStart({ onChoose }: { onChoose: (mode: TDayMode) => Promise<unknown> }) {
  return (
    <section
      aria-label="Start your day"
      className="flex flex-col gap-4 rounded-lg border border-accent-strong bg-surface-1 p-6"
    >
      <div>
        <h2 className="text-h4-medium text-primary">Good day. How are you working today?</h2>
        <p className="text-body-sm-regular text-secondary">
          Your team sees it, and your time is counted by it. If you work a task in the other place, the day becomes
          hybrid by itself.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {MODES.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => void onChoose(item.value)}
            className="flex flex-col items-start gap-1 rounded-lg border border-subtle p-4 text-left hover:border-accent-strong hover:bg-accent-subtle"
          >
            <span className="text-body-md-medium text-primary">{item.label}</span>
            <span className="text-body-sm-regular text-secondary">{item.text}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/** Today's answer, shown small, with a way to change it. */
export function DayModeChip({ mode, onChange }: { mode: TDayMode; onChange: (mode: TDayMode) => Promise<unknown> }) {
  return (
    <div
      role="group"
      aria-label="How you work today"
      className="flex items-center gap-1 rounded-lg border border-subtle p-0.5"
    >
      {MODES.map((item) => (
        <button
          key={item.value}
          type="button"
          aria-pressed={mode === item.value}
          onClick={() => mode !== item.value && void onChange(item.value)}
          className={cn(
            "rounded-md px-3 py-1 text-body-xs-medium",
            mode === item.value ? "bg-accent-subtle text-accent-primary" : "text-tertiary hover:text-secondary"
          )}
        >
          {item.label}
        </button>
      ))}
      {mode === "HYBRID" ? (
        <span className="rounded-md bg-accent-subtle px-3 py-1 text-body-xs-medium text-accent-primary">
          Hybrid today
        </span>
      ) : null}
    </div>
  );
}
