/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { ECustomFieldType } from "@plane/types";
import type { TCustomField, TCustomFieldRawValue, TCustomFieldUrlValue } from "@plane/types";
import { CustomSelect, Input, TextArea, ToggleSwitch } from "@plane/ui";
import { cn } from "@plane/utils";
// local imports
import { resolveDateSetting } from "./relative-date";

type Props = {
  field: Pick<TCustomField, "field_type" | "settings">;
  value: TCustomFieldRawValue;
  onChange: (value: TCustomFieldRawValue) => void;
  disabled?: boolean;
  hasError?: boolean;
};

/** Normalise a hyperlink value to { url, text }, tolerating legacy plain-string values. */
export const getUrlValue = (value: TCustomFieldRawValue): TCustomFieldUrlValue => {
  if (typeof value === "string") return { url: value, text: "" };
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const v = value as TCustomFieldUrlValue;
    return { url: v.url ?? "", text: v.text ?? "" };
  }
  return { url: "", text: "" };
};

const NATIVE_INPUT_CLASS =
  "w-full rounded-md border border-strong bg-surface-1 px-2.5 py-1.5 text-body-sm-regular text-primary outline-none focus:border-accent-strong disabled:opacity-60";

export function CustomFieldInput(props: Props) {
  const { field, value, onChange, disabled, hasError } = props;
  const { field_type, settings } = field;
  const placeholder = settings?.placeholder ?? "";
  const options = settings?.options ?? [];

  switch (field_type) {
    case ECustomFieldType.PARAGRAPH:
      return (
        <TextArea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          hasError={hasError}
          disabled={disabled}
          className="min-h-20 w-full resize-none text-body-sm-regular"
        />
      );

    case ECustomFieldType.NUMBER:
      return (
        <Input
          type="number"
          value={value === null || value === undefined ? "" : (value as number)}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          min={settings?.min as number | undefined}
          max={settings?.max as number | undefined}
          step={settings?.step}
          placeholder={placeholder}
          hasError={hasError}
          disabled={disabled}
          className="w-full text-body-sm-regular"
        />
      );

    case ECustomFieldType.BOOLEAN:
      return (
        <div className="flex items-center gap-2">
          <ToggleSwitch value={Boolean(value)} onChange={(val) => onChange(val)} disabled={disabled} size="sm" />
          {settings?.label && <span className="text-body-sm-regular text-secondary">{settings.label}</span>}
        </div>
      );

    case ECustomFieldType.SINGLE_SELECT:
      return (
        <CustomSelect
          value={value ?? null}
          onChange={(val: string) => onChange(val)}
          disabled={disabled}
          label={
            <span className={cn("truncate", { "text-placeholder": !value })}>
              {options.find((o) => o.id === value)?.label ?? placeholder ?? "Select"}
            </span>
          }
          className="w-full"
          buttonClassName={cn("w-full justify-between", { "border-danger-strong": hasError })}
          input
        >
          {options.map((option) => (
            <CustomSelect.Option key={option.id} value={option.id}>
              <span className="flex items-center gap-2">
                {option.color && <span className="size-2.5 rounded-full" style={{ backgroundColor: option.color }} />}
                {option.label}
              </span>
            </CustomSelect.Option>
          ))}
        </CustomSelect>
      );

    case ECustomFieldType.RADIO:
      return (
        <div className="flex flex-col gap-1.5">
          {options.map((option) => (
            <label key={option.id} className="flex cursor-pointer items-center gap-2 text-body-sm-regular text-primary">
              <input
                type="radio"
                checked={value === option.id}
                onChange={() => onChange(option.id)}
                disabled={disabled}
                className="accent-accent-strong"
              />
              {option.label}
            </label>
          ))}
        </div>
      );

    case ECustomFieldType.MULTI_SELECT: {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      const toggle = (id: string) =>
        onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
      return (
        <div className="flex flex-col gap-1.5">
          {options.map((option) => (
            <label key={option.id} className="flex cursor-pointer items-center gap-2 text-body-sm-regular text-primary">
              <input
                type="checkbox"
                checked={selected.includes(option.id)}
                onChange={() => toggle(option.id)}
                disabled={disabled}
                className="accent-accent-strong"
              />
              {option.label}
            </label>
          ))}
        </div>
      );
    }

    // min/max may be a fixed date or a relative token ("today+30d"), resolved on every render
    case ECustomFieldType.DATE:
      return (
        <input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          min={resolveDateSetting(settings?.min, "date")}
          max={resolveDateSetting(settings?.max, "date")}
          disabled={disabled}
          className={cn(NATIVE_INPUT_CLASS, { "border-danger-strong": hasError })}
        />
      );

    case ECustomFieldType.DATETIME:
      return (
        <input
          type="datetime-local"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          min={resolveDateSetting(settings?.min, "datetime")}
          max={resolveDateSetting(settings?.max, "datetime")}
          disabled={disabled}
          className={cn(NATIVE_INPUT_CLASS, { "border-danger-strong": hasError })}
        />
      );

    case ECustomFieldType.COLOR:
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={(value as string) || "#3f76ff"}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="size-8 shrink-0 cursor-pointer rounded-md border border-strong bg-surface-1"
          />
          <Input
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#3f76ff"
            hasError={hasError}
            disabled={disabled}
            className="w-32 text-body-sm-regular"
          />
        </div>
      );

    case ECustomFieldType.URL: {
      const { url, text } = getUrlValue(value);
      return (
        <div className="w-full space-y-1.5">
          <Input
            type="url"
            value={url}
            onChange={(e) => onChange({ url: e.target.value, text })}
            placeholder={placeholder || "https://example.com"}
            hasError={hasError}
            disabled={disabled}
            className="w-full text-body-sm-regular"
          />
          <Input
            type="text"
            value={text}
            onChange={(e) => onChange({ url, text: e.target.value })}
            placeholder="Display text (optional)"
            disabled={disabled}
            className="w-full text-body-sm-regular"
          />
        </div>
      );
    }

    case ECustomFieldType.EMAIL:
    case ECustomFieldType.TEXT:
    default:
      return (
        <Input
          type={field_type === ECustomFieldType.EMAIL ? "email" : "text"}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          hasError={hasError}
          disabled={disabled}
          className="w-full text-body-sm-regular"
        />
      );
  }
}
