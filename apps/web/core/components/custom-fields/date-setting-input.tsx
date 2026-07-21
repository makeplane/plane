/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { CustomSelect, Input } from "@plane/ui";
// local imports
import type { TRelativeDateUnit } from "./relative-date";
import { RELATIVE_DATE_UNITS, buildRelativeDate, isRelativeDate, parseRelativeDate } from "./relative-date";

const I18N = "workspace_settings.settings.custom_fields.form";

const NATIVE_INPUT_CLASS =
  "w-full rounded-md border border-strong bg-surface-1 px-2.5 py-1.5 text-body-sm-regular text-primary outline-none focus:border-accent-strong";

type Props = {
  value: string | number | undefined;
  onChange: (value: string | undefined) => void;
  /** datetime fields need a time component on the fixed-date input */
  variant?: "date" | "datetime";
};

/**
 * Picks either a fixed calendar date or a date relative to today ("today + 30 days"),
 * for a date field's earliest/latest bound. Relative bounds keep their meaning as
 * time passes, which fixed dates cannot.
 */
export function DateSettingInput(props: Props) {
  const { value, onChange, variant = "date" } = props;
  const { t } = useTranslation();

  const relative = parseRelativeDate(value);
  const isRelative = isRelativeDate(value);

  const unitLabel = (unit: TRelativeDateUnit) => t(`${I18N}.relative_unit.${unit}`);

  return (
    <div className="space-y-1.5">
      <CustomSelect
        value={isRelative ? "relative" : "fixed"}
        onChange={(mode: string) => {
          // switching modes clears the old representation rather than trying to convert it
          onChange(mode === "relative" ? "today" : undefined);
        }}
        label={<span className="text-body-sm-regular">{t(`${I18N}.${isRelative ? "relative" : "fixed"}`)}</span>}
        input
      >
        <CustomSelect.Option value="fixed">{t(`${I18N}.fixed`)}</CustomSelect.Option>
        <CustomSelect.Option value="relative">{t(`${I18N}.relative`)}</CustomSelect.Option>
      </CustomSelect>

      {isRelative ? (
        <div className="flex items-center gap-1.5">
          <span className="shrink-0 text-body-sm-regular text-tertiary">{t(`${I18N}.today`)}</span>
          <Input
            type="number"
            value={relative?.offset ?? 0}
            onChange={(e) => {
              const offset = Number(e.target.value);
              onChange(
                buildRelativeDate({ offset: Number.isFinite(offset) ? offset : 0, unit: relative?.unit ?? "d" })
              );
            }}
            className="w-20 text-body-sm-regular"
            aria-label={t(`${I18N}.relative_offset`)}
          />
          <CustomSelect
            value={relative?.unit ?? "d"}
            onChange={(unit: TRelativeDateUnit) => onChange(buildRelativeDate({ offset: relative?.offset ?? 0, unit }))}
            label={<span className="text-body-sm-regular">{unitLabel(relative?.unit ?? "d")}</span>}
            input
          >
            {RELATIVE_DATE_UNITS.map((unit) => (
              <CustomSelect.Option key={unit} value={unit}>
                {unitLabel(unit)}
              </CustomSelect.Option>
            ))}
          </CustomSelect>
        </div>
      ) : (
        <input
          type={variant === "datetime" ? "datetime-local" : "date"}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          className={NATIVE_INPUT_CLASS}
        />
      )}
    </div>
  );
}
