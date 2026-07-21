/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { CUSTOM_FIELD_GRID_COLUMNS } from "@plane/constants";
import { ECustomFieldType } from "@plane/types";
import type { TCustomField, TCustomFieldRawValue, TCustomFieldValuePayload } from "@plane/types";
import { cn } from "@plane/utils";
// local imports
import { CustomFieldInput } from "./custom-field-input";
import { resolveDefaultValue } from "./relative-date";

type Props = {
  fields: TCustomField[];
  values: Record<string, TCustomFieldRawValue>;
  onChange: (fieldId: string, value: TCustomFieldRawValue) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  className?: string;
};

/** Build the seed value map from the field definitions' default values. */
export const seedCustomFieldValues = (
  fields: Array<TCustomField & { value?: TCustomFieldRawValue }>
): Record<string, TCustomFieldRawValue> =>
  fields.reduce<Record<string, TCustomFieldRawValue>>((acc, field) => {
    acc[field.id] =
      field.value !== undefined && field.value !== null
        ? field.value
        : (resolveDefaultValue(field.field_type, field.default_value) ?? null);
    return acc;
  }, {});

/** Convert a controlled value map to the bulk-upsert payload. */
export const buildCustomFieldPayload = (values: Record<string, TCustomFieldRawValue>): TCustomFieldValuePayload[] =>
  Object.entries(values).map(([custom_field, value]) => ({ custom_field, value }));

/** Returns true when a required field has no usable value. */
const isEmptyValue = (value: TCustomFieldRawValue): boolean => {
  if (value === null || value === undefined || value === "") return true;
  if (Array.isArray(value)) return value.length === 0;
  // hyperlink values are { url, text } — only the url makes it non-empty
  if (typeof value === "object") return !(value as { url?: string }).url;
  return false;
};

/** Validate required fields; returns a map of fieldId -> error key. */
export const validateCustomFieldValues = (
  fields: TCustomField[],
  values: Record<string, TCustomFieldRawValue>
): Record<string, string> => {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (field.is_required && isEmptyValue(values[field.id])) {
      errors[field.id] = "required";
    }
  }
  return errors;
};

export function CustomFieldsSection(props: Props) {
  const { fields, values, onChange, errors, disabled, className } = props;

  if (fields.length === 0) return null;

  return (
    <div
      className={cn("grid gap-x-4 gap-y-4", className)}
      style={{ gridTemplateColumns: `repeat(${CUSTOM_FIELD_GRID_COLUMNS}, minmax(0, 1fr))` }}
    >
      {fields.map((field) => {
        const span = Math.max(1, Math.min(CUSTOM_FIELD_GRID_COLUMNS, field.width || CUSTOM_FIELD_GRID_COLUMNS));
        const hasError = Boolean(errors?.[field.id]);
        return (
          <div key={field.id} className="min-w-0" style={{ gridColumn: `span ${span} / span ${span}` }}>
            {field.field_type !== ECustomFieldType.BOOLEAN && (
              <label className="mb-1 flex items-center gap-1 text-body-sm-medium text-secondary">
                {field.display_name}
                {field.is_required && <span className="text-danger-primary">*</span>}
              </label>
            )}
            <CustomFieldInput
              field={field}
              value={values[field.id] ?? null}
              onChange={(value) => onChange(field.id, value)}
              disabled={disabled}
              hasError={hasError}
            />
            {field.field_type === ECustomFieldType.BOOLEAN && field.is_required && (
              <span className="mt-1 inline-block text-10 text-danger-primary">*</span>
            )}
            {field.description && <p className="mt-1 text-11 text-tertiary">{field.description}</p>}
          </div>
        );
      })}
    </div>
  );
}
