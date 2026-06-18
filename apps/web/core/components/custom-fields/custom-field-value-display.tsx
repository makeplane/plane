/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Check } from "lucide-react";
// plane imports
import { ECustomFieldType } from "@plane/types";
import type { TCustomField, TCustomFieldRawValue, TCustomFieldUrlValue } from "@plane/types";
import { renderFormattedDate } from "@plane/utils";
// local imports
import { getUrlValue } from "./custom-field-input";

/** Whether a custom field value is meaningfully set (used to decide visibility). */
export const customFieldHasValue = (value: TCustomFieldRawValue): boolean => {
  if (value === null || value === undefined || value === "" || value === false) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    const v = value as TCustomFieldUrlValue;
    return Boolean(v.url || v.text);
  }
  return true;
};

type Props = {
  field: Pick<TCustomField, "field_type" | "settings">;
  value: TCustomFieldRawValue;
};

/** Read-only rendering of a custom field value, styled to match native sidebar properties. */
export function CustomFieldValueDisplay({ field, value }: Props) {
  const { field_type, settings } = field;
  const options = settings?.options ?? [];

  switch (field_type) {
    case ECustomFieldType.SINGLE_SELECT:
    case ECustomFieldType.RADIO: {
      const option = options.find((o) => o.id === value);
      if (!option) return null;
      return (
        <span className="flex items-center gap-1.5 truncate">
          {option.color && (
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: option.color }} />
          )}
          {option.label}
        </span>
      );
    }

    case ECustomFieldType.MULTI_SELECT: {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      const labels = selected.map((id) => options.find((o) => o.id === id)).filter(Boolean);
      if (labels.length === 0) return null;
      return (
        <span className="flex flex-wrap items-center gap-1">
          {labels.map((option) => (
            <span key={option!.id} className="flex items-center gap-1 rounded bg-surface-2 px-1.5 py-0.5 text-11">
              {option!.color && (
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: option!.color }} />
              )}
              {option!.label}
            </span>
          ))}
        </span>
      );
    }

    case ECustomFieldType.BOOLEAN:
      return (
        <span className="flex items-center gap-1.5">
          <Check className="size-3.5 text-success-primary" />
          {settings?.label || "Yes"}
        </span>
      );

    case ECustomFieldType.DATE:
      return <span className="truncate">{renderFormattedDate(value as string)}</span>;

    case ECustomFieldType.DATETIME: {
      const date = value ? new Date(value as string) : null;
      return <span className="truncate">{date ? date.toLocaleString() : ""}</span>;
    }

    case ECustomFieldType.COLOR:
      return (
        <span
          className="size-4 shrink-0 rounded-full border border-subtle"
          style={{ backgroundColor: value as string }}
        />
      );

    case ECustomFieldType.URL: {
      const { url, text } = getUrlValue(value);
      if (!url) return null;
      return <span className="truncate text-accent-primary">{text || url}</span>;
    }

    default:
      return <span className="truncate">{String(value)}</span>;
  }
}
