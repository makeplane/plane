/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { CUSTOM_FIELD_GRID_COLUMNS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ECustomFieldType } from "@plane/types";
import type { TCustomFieldRawValue, TCustomFieldWithValue } from "@plane/types";
import { Loader } from "@plane/ui";
// hooks
import { useIssueCustomFields } from "@/hooks/use-issue-custom-fields";
// local imports
import { CustomFieldInput } from "./custom-field-input";
import { resolveDefaultValue } from "./relative-date";

// discrete pickers commit on change; free-text commits on blur
const COMMIT_ON_CHANGE = new Set<ECustomFieldType>([
  ECustomFieldType.SINGLE_SELECT,
  ECustomFieldType.MULTI_SELECT,
  ECustomFieldType.RADIO,
  ECustomFieldType.BOOLEAN,
  ECustomFieldType.DATE,
  ECustomFieldType.DATETIME,
]);

const seedValue = (field: TCustomFieldWithValue): TCustomFieldRawValue =>
  field.value !== undefined && field.value !== null
    ? field.value
    : (resolveDefaultValue(field.field_type, field.default_value) ?? null);

type RowProps = {
  field: TCustomFieldWithValue;
  disabled?: boolean;
  onSave: (fieldId: string, value: TCustomFieldRawValue) => void;
};

function TabRow({ field, disabled, onSave }: RowProps) {
  const initial = seedValue(field);
  const [value, setValue] = useState<TCustomFieldRawValue>(initial);
  const savedRef = useRef<TCustomFieldRawValue>(initial);

  useEffect(() => {
    const next = seedValue(field);
    setValue(next);
    savedRef.current = next;
  }, [field]);

  const persist = () => {
    if (JSON.stringify(value) === JSON.stringify(savedRef.current)) return;
    savedRef.current = value;
    onSave(field.id, value);
  };

  const commitOnChange = COMMIT_ON_CHANGE.has(field.field_type);
  const span = Math.max(1, Math.min(CUSTOM_FIELD_GRID_COLUMNS, field.width || CUSTOM_FIELD_GRID_COLUMNS));

  return (
    <div className="min-w-0" style={{ gridColumn: `span ${span} / span ${span}` }} onBlur={persist}>
      <label className="mb-1 flex items-center gap-1 text-body-sm-medium text-secondary">
        {field.display_name}
        {field.is_required && <span className="text-danger-primary">*</span>}
      </label>
      <CustomFieldInput
        field={field}
        value={value}
        disabled={disabled}
        onChange={(next) => {
          setValue(next);
          if (commitOnChange) {
            savedRef.current = next;
            onSave(field.id, next);
          }
        }}
      />
      {field.description && <p className="mt-1 text-11 text-tertiary">{field.description}</p>}
    </div>
  );
}

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled?: boolean;
};

export const IssueCustomFieldsTab = observer(function IssueCustomFieldsTab(props: Props) {
  const { workspaceSlug, projectId, issueId, disabled } = props;
  const { t } = useTranslation();
  const { fields, isLoading, saveField } = useIssueCustomFields({ workspaceSlug, projectId, issueId });

  if (isLoading && fields.length === 0) {
    return (
      <Loader className="space-y-4">
        <Loader.Item height="60px" />
        <Loader.Item height="60px" />
      </Loader>
    );
  }

  if (fields.length === 0) {
    return (
      <div className="py-10 text-center text-body-sm-regular text-tertiary">
        {t("workspace_settings.settings.custom_fields.work_items.tab_empty")}
      </div>
    );
  }

  return (
    <div
      className="grid gap-x-4 gap-y-5"
      style={{ gridTemplateColumns: `repeat(${CUSTOM_FIELD_GRID_COLUMNS}, minmax(0, 1fr))` }}
    >
      {fields.map((field) => (
        <TabRow key={field.id} field={field} disabled={disabled} onSave={saveField} />
      ))}
    </div>
  );
});
