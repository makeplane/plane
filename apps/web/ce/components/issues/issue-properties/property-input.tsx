/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
// plane imports
import { Logo } from "@plane/propel/emoji-icon-picker";
import type { ICustomSearchSelectOption, IIssueProperty } from "@plane/types";
import { EIssuePropertyType, EIssuePropertyRelationType } from "@plane/types";
import { CustomSearchSelect, Input, TextArea, ToggleSwitch } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { DateDropdown } from "@/components/dropdowns/date";
import { MemberDropdown } from "@/components/dropdowns/member/dropdown";

export type TIssuePropertyInputProps = {
  property: IIssueProperty;
  projectId: string;
  value: string[];
  onChange: (value: string[]) => void;
  /** Fired when a free-text control loses focus; used to commit text edits. */
  onBlur?: () => void;
  disabled?: boolean;
  hasError?: boolean;
};

const TEXT_MULTI_LINE = "multi_line";

/** Property types edited through a free-text control (committed on blur). */
export const FREE_TEXT_PROPERTY_TYPES: EIssuePropertyType[] = [
  EIssuePropertyType.TEXT,
  EIssuePropertyType.URL,
  EIssuePropertyType.DECIMAL,
];

/**
 * Polymorphic input that renders the right control for a custom property type.
 * The value is always a normalised list of strings (see ``TIssuePropertyValues``).
 */
export const IssuePropertyInput = observer(function IssuePropertyInput(props: TIssuePropertyInputProps) {
  const { property, projectId, value, onChange, onBlur, disabled = false, hasError = false } = props;

  const singleValue = value?.[0] ?? "";

  switch (property.property_type) {
    case EIssuePropertyType.TEXT: {
      const displayFormat = (property.settings as { display_format?: string } | undefined)?.display_format;
      if (displayFormat === TEXT_MULTI_LINE) {
        return (
          <TextArea
            value={singleValue}
            hasError={hasError}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}
            onBlur={onBlur}
            placeholder={property.display_name}
            className="min-h-16 w-full text-13"
          />
        );
      }
      return (
        <Input
          type="text"
          value={singleValue}
          hasError={hasError}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}
          onBlur={onBlur}
          placeholder={property.display_name}
          className="w-full"
        />
      );
    }

    case EIssuePropertyType.URL:
      return (
        <Input
          type="url"
          value={singleValue}
          hasError={hasError}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value ? [e.target.value] : [])}
          onBlur={onBlur}
          placeholder="https://"
          className="w-full"
        />
      );

    case EIssuePropertyType.DECIMAL:
      return (
        <Input
          type="number"
          value={singleValue}
          hasError={hasError}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value !== "" ? [e.target.value] : [])}
          onBlur={onBlur}
          placeholder={property.display_name}
          className="w-full"
        />
      );

    case EIssuePropertyType.BOOLEAN:
      return (
        <ToggleSwitch
          value={singleValue === "true"}
          disabled={disabled}
          onChange={(val) => onChange([val ? "true" : "false"])}
          size="sm"
        />
      );

    case EIssuePropertyType.DATETIME:
      return (
        <DateDropdown
          value={singleValue || null}
          disabled={disabled}
          onChange={(date) => onChange(date ? [date.toISOString()] : [])}
          buttonVariant="border-with-text"
          placeholder={property.display_name}
          buttonContainerClassName={cn("w-full", { "border-danger-strong": hasError })}
        />
      );

    case EIssuePropertyType.OPTION: {
      const options: ICustomSearchSelectOption[] = (property.options ?? [])
        .filter((option) => option.is_active)
        .map((option) => ({
          value: option.id,
          query: option.name,
          content: (
            <div className="flex items-center gap-1.5 truncate">
              {option.logo_props && <Logo logo={option.logo_props} size={14} />}
              <span className="truncate">{option.name}</span>
            </div>
          ),
        }));

      if (property.is_multi) {
        const selectedNames = (property.options ?? [])
          .filter((option) => value?.includes(option.id))
          .map((option) => option.name);
        return (
          <CustomSearchSelect
            multiple
            value={value ?? []}
            options={options}
            disabled={disabled}
            onChange={(vals: string[]) => onChange(vals ?? [])}
            className="w-full"
            buttonClassName={cn("w-full", { "border-danger-strong": hasError })}
            label={selectedNames.length > 0 ? selectedNames.join(", ") : property.display_name}
          />
        );
      }

      const selectedOption = (property.options ?? []).find((option) => option.id === singleValue);
      return (
        <CustomSearchSelect
          value={singleValue || null}
          options={options}
          disabled={disabled}
          onChange={(val: string) => onChange(val ? [val] : [])}
          className="w-full"
          buttonClassName={cn("w-full", { "border-danger-strong": hasError })}
          label={selectedOption?.name ?? property.display_name}
        />
      );
    }

    case EIssuePropertyType.RELATION: {
      // V1 UI only supports the USER relation (member picker). ISSUE relations
      // are persisted by the backend but not yet exposed in the UI.
      if (property.relation_type !== EIssuePropertyRelationType.USER) return null;

      if (property.is_multi) {
        return (
          <MemberDropdown
            projectId={projectId}
            multiple
            value={value ?? []}
            disabled={disabled}
            onChange={(vals) => onChange(vals ?? [])}
            buttonVariant="border-with-text"
            placeholder={property.display_name}
            buttonContainerClassName={cn("w-full", { "border-danger-strong": hasError })}
          />
        );
      }
      return (
        <MemberDropdown
          projectId={projectId}
          multiple={false}
          value={singleValue || null}
          disabled={disabled}
          onChange={(val) => onChange(val ? [val] : [])}
          buttonVariant="border-with-text"
          placeholder={property.display_name}
          buttonContainerClassName={cn("w-full", { "border-danger-strong": hasError })}
        />
      );
    }

    default:
      return null;
  }
});

export type TWorkItemPropertyFieldProps = TIssuePropertyInputProps & {
  error?: string;
};

/**
 * A labelled row wrapping an ``IssuePropertyInput``, used by the modal and the
 * work item detail sidebar.
 */
export const WorkItemPropertyField = observer(function WorkItemPropertyField(props: TWorkItemPropertyFieldProps) {
  const { property, error, hasError, ...inputProps } = props;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 text-13 text-secondary">
        <span className="truncate">{property.display_name}</span>
        {property.is_required && <span className="text-danger-text">*</span>}
      </div>
      <IssuePropertyInput property={property} hasError={hasError || Boolean(error)} {...inputProps} />
      {error && <span className="text-danger-text text-11">{error}</span>}
    </div>
  );
});
