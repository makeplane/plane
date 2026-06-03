/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-static-element-interactions -- stop card navigation when editing custom fields on cards */
import type { SyntheticEvent } from "react";
import { useCallback } from "react";
import { observer } from "mobx-react";
import type { TIssue, TIssueCustomFields, TIssueProperty } from "@plane/types";
import { cn } from "@plane/utils";
import { getEffectiveCustomFieldValue } from "@/plane-web/helpers/custom-fields/format-display-value";
import { CustomFieldCardSelect } from "@/plane-web/components/issues/custom-fields/custom-field-card-select";
import {
  CustomFieldInput,
  type TCustomFieldValue,
} from "@/plane-web/components/issues/custom-fields/custom-field-input";

type Props = {
  property: TIssueProperty;
  issue: TIssue;
  isReadOnly?: boolean;
  onUpdate: (customFields: TIssueCustomFields) => Promise<void>;
};

/** Match layout property controls: block peek navigation without breaking native inputs. */
const stopCardMouseDown = (e: SyntheticEvent) => {
  e.stopPropagation();
};

const stopCardClick = (e: SyntheticEvent) => {
  e.stopPropagation();
  e.preventDefault();
};

export const CustomFieldCardDropdown = observer(function CustomFieldCardDropdown(props: Props) {
  const { property, issue, isReadOnly = false, onUpdate } = props;

  const rawValue = issue.custom_fields?.[property.key];
  const effectiveValue = getEffectiveCustomFieldValue(property, rawValue);

  const persistValue = useCallback(
    async (value: TCustomFieldValue) => {
      const next: TIssueCustomFields = {
        ...issue.custom_fields,
        [property.key]: value as TIssueCustomFields[string],
      };
      await onUpdate(next);
    },
    [issue.custom_fields, property.key, onUpdate]
  );

  const renderInput = () => {
    if (property.property_type === "select" && property.options?.length) {
      const selectValue = rawValue !== null && rawValue !== undefined && rawValue !== "" ? String(rawValue) : null;

      return (
        <CustomFieldCardSelect
          property={property}
          value={selectValue}
          disabled={isReadOnly}
          onChange={(val) => {
            void persistValue(val);
          }}
          className="relative"
        />
      );
    }

    return (
      <CustomFieldInput
        property={property}
        value={effectiveValue as TCustomFieldValue}
        disabled={isReadOnly}
        variant="card"
        onChange={(val) => {
          void persistValue(val);
        }}
        className={cn(
          "h-5 min-h-5 max-w-[9rem] rounded-sm border-[0.5px] border-strong bg-layer-2 px-2 py-0 text-caption-sm-regular",
          "focus:ring-1 focus:ring-accent-strong focus:outline-none",
          property.property_type === "multi_select" && "h-auto min-h-5 py-0.5"
        )}
      />
    );
  };

  return (
    <div
      role="group"
      className="relative h-5 max-w-[9rem] flex-shrink-0"
      onMouseDown={stopCardMouseDown}
      onClick={stopCardClick}
      onFocus={stopCardMouseDown}
    >
      {renderInput()}
    </div>
  );
});
