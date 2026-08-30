/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import type { TPomodoroSettings } from "@plane/types";
// lucide
import { ChevronDown, Settings } from "lucide-react";
// hooks
import { useUserProfile } from "@/hooks/store/user";
import { usePomodoroTimer } from "@/hooks/pomodoro/use-pomodoro-timer";

export const PomodoroSettingsInline = observer(function PomodoroSettingsInline() {
  const { t } = useTranslation();
  const { settings } = usePomodoroTimer();
  const { updateUserProfile } = useUserProfile();
  const [isOpen, setIsOpen] = useState(false);

  const updateSetting = <K extends keyof TPomodoroSettings>(key: K, value: TPomodoroSettings[K]) => {
    void updateUserProfile({ pomodoro_settings: { ...settings, [key]: value } });
  };

  return (
    <div className="border-t border-subtle">
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="text-xs flex w-full items-center justify-between px-1 py-2 font-medium text-secondary hover:text-primary"
      >
        <span className="flex items-center gap-1.5">
          <Settings className="size-3" />
          {t("pomodoro.settings")}
        </span>
        <ChevronDown className={cn("size-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className="flex flex-col gap-2.5 pb-2">
          <NumberRow
            label={t("pomodoro.focus_minutes")}
            value={settings.focus_minutes}
            min={1}
            max={120}
            onChange={(v) => updateSetting("focus_minutes", v)}
          />
          <NumberRow
            label={t("pomodoro.short_break_minutes")}
            value={settings.short_break_minutes}
            min={1}
            max={30}
            onChange={(v) => updateSetting("short_break_minutes", v)}
          />
          <NumberRow
            label={t("pomodoro.long_break_minutes")}
            value={settings.long_break_minutes}
            min={1}
            max={60}
            onChange={(v) => updateSetting("long_break_minutes", v)}
          />
          <NumberRow
            label={t("pomodoro.sessions_before_long_break")}
            value={settings.sessions_before_long_break}
            min={1}
            max={10}
            onChange={(v) => updateSetting("sessions_before_long_break", v)}
          />
          <ToggleRow
            label={t("pomodoro.auto_start_break")}
            checked={settings.auto_start_break}
            onChange={(v) => updateSetting("auto_start_break", v)}
          />
          <ToggleRow
            label={t("pomodoro.auto_start_focus")}
            checked={settings.auto_start_focus}
            onChange={(v) => updateSetting("auto_start_focus", v)}
          />
          <ToggleRow
            label={t("pomodoro.auto_create_time_log")}
            checked={settings.auto_create_time_log}
            onChange={(v) => updateSetting("auto_create_time_log", v)}
          />
        </div>
      )}
    </div>
  );
});

const NumberRow = ({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) => (
  <div className="text-xs flex items-center justify-between gap-2">
    <span className="text-secondary">{label}</span>
    <input
      type="number"
      min={min}
      max={max}
      value={value}
      onChange={(e) => {
        const v = parseInt(e.target.value, 10);
        if (!Number.isNaN(v) && v >= min && v <= max) onChange(v);
      }}
      className="text-xs focus:border-accent-primary w-14 rounded border border-subtle bg-transparent px-1.5 py-0.5 text-right text-primary outline-none"
    />
  </div>
);

const ToggleRow = ({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <label className="text-xs flex cursor-pointer items-center justify-between gap-2">
    <span className="text-secondary">{label}</span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-accent-primary" : "bg-(--border-color-subtle)"
      )}
    >
      <span
        className={cn(
          "shadow inline-block size-3 rounded-full bg-white transition-transform",
          checked ? "translate-x-3.5" : "translate-x-0.5"
        )}
      />
    </button>
  </label>
);
