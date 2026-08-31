/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type {
  IProjectCustomField,
  IProjectCustomFieldOption,
  IProjectCustomFieldValue,
  TProjectCustomFieldValuePayload,
} from "@plane/types";
import { CustomSelect } from "@plane/ui";
import { renderFormattedPayloadDate } from "@plane/utils";
// components
import { DateDropdown } from "@/components/dropdowns/date";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";

type Props = {
  field: IProjectCustomField;
  value: IProjectCustomFieldValue | undefined;
  options: IProjectCustomFieldOption[] | undefined;
  disabled: boolean;
  projectId: string;
  onSave: (data: TProjectCustomFieldValuePayload) => Promise<unknown>;
};

// Numeric text kept as a plain string while editing so the input never fights the
// user over decimal points or a trailing minus sign mid-type.
const isValidDecimalInput = (raw: string) => raw === "" || /^-?\d*\.?\d*$/.test(raw);

export const ProjectCustomFieldValueInput = observer(function ProjectCustomFieldValueInput(props: Props) {
  const { field, value, options, disabled, projectId, onSave } = props;
  const { t } = useTranslation();

  const handleSaveError = (error?: unknown) => {
    // VALUE_MUST_BE_UNIQUE (see ProjectCustomFieldValueSerializer.validate()) is
    // common enough to deserve its own message: it fires on every normal attempt
    // to reuse another project's identifying value, not just an edge case.
    const nonFieldErrors = (error as { non_field_errors?: string[] } | undefined)?.non_field_errors;
    const isDuplicateValue = nonFieldErrors?.includes("VALUE_MUST_BE_UNIQUE") ?? false;
    setToast({
      type: TOAST_TYPE.ERROR,
      title: t("project_custom_field.settings.toasts.value_update.error.title"),
      message: isDuplicateValue
        ? t("project_custom_field.settings.toasts.value_update.duplicate_value")
        : t("project_custom_field.settings.toasts.value_update.error.message"),
    });
  };

  if (field.field_type === "date") {
    return (
      <DateDropdown
        value={value?.value_date ?? null}
        onChange={async (date) => {
          try {
            await onSave({ value_date: date ? renderFormattedPayloadDate(date) : null });
          } catch (error) {
            handleSaveError(error);
          }
        }}
        disabled={disabled}
        placeholder={t("project_custom_field.settings.value_placeholder")}
        buttonVariant="border-with-text"
      />
    );
  }

  if (field.field_type === "member") {
    return (
      <MemberDropdown
        value={value?.value_member ?? null}
        onChange={async (memberId) => {
          try {
            await onSave({ value_member: memberId });
          } catch (error) {
            handleSaveError(error);
          }
        }}
        multiple={false}
        projectId={projectId}
        disabled={disabled}
        placeholder={t("project_custom_field.settings.value_placeholder")}
        buttonVariant="border-with-text"
      />
    );
  }

  if (field.field_type === "dropdown") {
    const selectedOption = options?.find((option) => option.id === value?.value_option);
    return (
      <CustomSelect
        value={value?.value_option ?? null}
        label={<span>{selectedOption?.name ?? t("project_custom_field.settings.value_placeholder")}</span>}
        onChange={async (optionId: string) => {
          try {
            await onSave({ value_option: optionId });
          } catch (error) {
            handleSaveError(error);
          }
        }}
        disabled={disabled || !options || options.length === 0}
        buttonClassName="border border-subtle rounded-sm"
      >
        {options?.map((option) => (
          <CustomSelect.Option key={option.id} value={option.id}>
            {option.name}
          </CustomSelect.Option>
        ))}
      </CustomSelect>
    );
  }

  // number / text share the same "type, blur to save" text input. Switched (not a
  // ternary) so adding a 6th field type without a branch here fails to compile
  // instead of silently falling through to the number input at runtime.
  let valueKey: "value_decimal" | "value_text";
  switch (field.field_type) {
    case "number":
      valueKey = "value_decimal";
      break;
    case "text":
      valueKey = "value_text";
      break;
    default: {
      const unhandledFieldType: never = field.field_type;
      throw new Error(`Unhandled project custom field type: ${unhandledFieldType}`);
    }
  }
  return (
    <TextValueInput
      disabled={disabled}
      currentValue={value?.[valueKey] ?? ""}
      numeric={field.field_type === "number"}
      placeholder={t("project_custom_field.settings.value_placeholder")}
      onSave={async (nextValue) => {
        try {
          const payload: TProjectCustomFieldValuePayload =
            valueKey === "value_decimal" ? { value_decimal: nextValue } : { value_text: nextValue };
          await onSave(payload);
        } catch (error) {
          handleSaveError(error);
          throw error;
        }
      }}
    />
  );
});

type TextValueInputProps = {
  disabled: boolean;
  currentValue: string;
  numeric: boolean;
  placeholder: string;
  onSave: (nextValue: string | null) => Promise<void>;
};

const TextValueInput = observer(function TextValueInput(props: TextValueInputProps) {
  const { disabled, currentValue, numeric, placeholder, onSave } = props;
  const [draft, setDraft] = useState(currentValue);

  useEffect(() => {
    setDraft(currentValue);
  }, [currentValue]);

  const handleBlur = async () => {
    if (draft === currentValue) return;
    try {
      await onSave(draft === "" ? null : draft);
    } catch (error) {
      setDraft(currentValue);
    }
  };

  return (
    <InputGroup size="lg">
      <Input
        size="lg"
        type="text"
        value={draft}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => {
          if (!numeric || isValidDecimalInput(e.target.value)) setDraft(e.target.value);
        }}
        onBlur={handleBlur}
      />
    </InputGroup>
  );
});
