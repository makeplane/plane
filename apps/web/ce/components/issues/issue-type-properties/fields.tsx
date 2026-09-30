/**
 * Copyright (c) 2026-present Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { CustomSelect, Input, ToggleSwitch } from "@plane/ui";
import type { TIssueTypePropertyValueEntry } from "@plane/types";
import { DateDropdown } from "@/components/dropdowns/date";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";

type TProps = {
  property: TIssueTypePropertyValueEntry;
  value: unknown;
  error?: string;
  disabled?: boolean;
  workspaceSlug: string;
  projectId: string;
  onChange: (value: unknown) => void;
  compact?: boolean;
};

export const IssueTypePropertyField = observer(function IssueTypePropertyField(props: TProps) {
  const { property, value, error, disabled, projectId, onChange, compact } = props;
  const { t } = useTranslation();
  const type = property.property_type ?? "text";

  const label = (
    <div className={compact ? "min-w-0" : "space-y-0.5"}>
      <p className="text-12 text-tertiary">
        {property.title}
        {property.is_mandatory ? " *" : ""}
      </p>
      {error ? <p className="text-11 text-danger-primary">{error}</p> : null}
    </div>
  );

  const field = (() => {
    if (type === "boolean") {
      return <ToggleSwitch value={Boolean(value)} onChange={(next) => onChange(next)} disabled={disabled} size="sm" />;
    }
    if (type === "number") {
      return (
        <Input
          type="number"
          className="h-8 w-full"
          value={value === null || value === undefined ? "" : String(value)}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          disabled={disabled}
        />
      );
    }
    if (type === "date") {
      const dateValue =
        value instanceof Date ? value.toISOString().slice(0, 10) : typeof value === "string" ? value : null;
      return (
        <DateDropdown
          value={dateValue}
          onChange={(next) => {
            if (next instanceof Date) onChange(next.toISOString().slice(0, 10));
            else onChange(next);
          }}
          placeholder={t("start_date")}
          buttonVariant="border-with-text"
          disabled={disabled}
          hideIcon
        />
      );
    }
    if (type === "dropdown") {
      const options = property.options ?? [];
      if (property.select_mode === "multi") {
        const selected = Array.isArray(value) ? value.map(String) : [];
        return (
          <div className="flex flex-wrap gap-1">
            {options.map((opt) => {
              const active = selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={disabled}
                  className={`rounded border px-2 py-0.5 text-12 ${
                    active ? "border-accent-primary bg-accent-primary/10 text-primary" : "border-subtle text-secondary"
                  }`}
                  onClick={() => {
                    const next = active ? selected.filter((v) => v !== opt) : [...selected, opt];
                    onChange(next);
                  }}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        );
      }
      return (
        <CustomSelect
          value={typeof value === "string" ? value : ""}
          onChange={(next: string) => onChange(next || null)}
          disabled={disabled}
          buttonClassName="h-8 w-full border border-subtle"
          label={typeof value === "string" && value ? value : t("select")}
          className="w-full"
          input
        >
          {options.map((opt) => (
            <CustomSelect.Option key={opt} value={opt}>
              {opt}
            </CustomSelect.Option>
          ))}
        </CustomSelect>
      );
    }
    if (type === "member_picker") {
      const memberValue = Array.isArray(value) ? value[0] : typeof value === "string" ? value : null;
      return (
        <MemberDropdown
          projectId={projectId}
          value={memberValue}
          onChange={(memberId) => onChange(memberId ? [memberId] : [])}
          multiple={false}
          buttonVariant="border-with-text"
          disabled={disabled}
        />
      );
    }
    return (
      <Input
        className="h-8 w-full"
        value={value === null || value === undefined ? "" : String(value)}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    );
  })();

  if (compact) {
    return (
      <div className="space-y-1">
        {label}
        {field}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 py-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:items-center">
      {label}
      <div>{field}</div>
    </div>
  );
});
