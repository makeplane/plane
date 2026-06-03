/* eslint-disable jsx-a11y/no-noninteractive-element-interactions -- stop card navigation when editing custom fields on cards */
import type { SyntheticEvent } from "react";
import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { ChevronDownIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssue, TIssueCustomFields, TIssueProperty } from "@plane/types";
import { cn } from "@plane/utils";
import { usePlatformOS } from "@/hooks/use-platform-os";
import {
  formatCustomFieldDisplayValue,
  getCustomFieldOptionColor,
  getEffectiveCustomFieldValue,
} from "@/plane-web/helpers/custom-fields/format-display-value";
import type { TCustomFieldValue } from "@/plane-web/components/issues/custom-fields/custom-field-input";

type Props = {
  property: TIssueProperty;
  issue: TIssue;
  isReadOnly?: boolean;
  onUpdate: (customFields: TIssueCustomFields) => Promise<void>;
};

function toSelectString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

const stopPropagation = (e: SyntheticEvent) => {
  e.stopPropagation();
  e.preventDefault();
};

export const CustomFieldCardDropdown = observer(function CustomFieldCardDropdown(props: Props) {
  const { property, issue, isReadOnly = false, onUpdate } = props;
  const { isMobile } = usePlatformOS();

  const rawValue = issue.custom_fields?.[property.key];
  const effectiveValue = useMemo(() => getEffectiveCustomFieldValue(property, rawValue), [property, rawValue]);

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

  if (property.property_type === "boolean") {
    const checked = Boolean(effectiveValue);
    const label = checked ? "Yes" : "No";
    return (
      <Tooltip tooltipContent={`${property.name}: ${label}`} isMobile={isMobile}>
        <button
          type="button"
          disabled={isReadOnly}
          className={cn(
            "flex h-5 flex-shrink-0 items-center rounded-sm border-[0.5px] border-strong bg-layer-2 px-2 py-1 text-caption-sm-regular",
            checked ? "text-primary" : "text-secondary"
          )}
          onClick={(e) => {
            stopPropagation(e);
            if (!isReadOnly) void persistValue(!checked);
          }}
        >
          {label}
        </button>
      </Tooltip>
    );
  }

  if (property.property_type === "select" && property.options?.length) {
    const options = property.options;
    const selectValue = toSelectString(effectiveValue) || options[0].value;
    const optionColor = getCustomFieldOptionColor(selectValue, "select", options);

    return (
      <div role="group" className="relative h-5 flex-shrink-0" onMouseDown={stopPropagation} onFocus={stopPropagation}>
        <Tooltip tooltipContent={property.name} isMobile={isMobile}>
          <select
            value={selectValue}
            disabled={isReadOnly}
            onChange={(e) => void persistValue(e.target.value)}
            onClick={stopPropagation}
            className={cn(
              "h-5 max-w-[9rem] cursor-pointer appearance-none rounded-sm border-[0.5px] border-strong bg-layer-2",
              "pr-6 text-caption-sm-regular text-primary",
              optionColor ? "pl-5" : "pl-2",
              "hover:bg-layer-transparent-hover focus:ring-1 focus:ring-accent-strong focus:outline-none",
              isReadOnly && "cursor-not-allowed opacity-60"
            )}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.value}
              </option>
            ))}
          </select>
        </Tooltip>
        {optionColor && (
          <span
            className="pointer-events-none absolute top-1/2 left-1.5 size-2 -translate-y-1/2 rounded-full"
            style={{ backgroundColor: optionColor }}
          />
        )}
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-1 h-2.5 w-2.5 -translate-y-1/2 text-secondary" />
      </div>
    );
  }

  if (property.property_type === "multi_select" && property.options?.length) {
    const options = property.options;
    const selected = Array.isArray(effectiveValue)
      ? effectiveValue.filter((v): v is string => typeof v === "string")
      : [];
    const selectValue = selected[0] ?? options[0].value;

    return (
      <div role="group" className="relative h-5 flex-shrink-0" onMouseDown={stopPropagation} onFocus={stopPropagation}>
        <Tooltip
          tooltipContent={`${property.name}: ${selected.length ? selected.join(", ") : selectValue}`}
          isMobile={isMobile}
        >
          <select
            value={selectValue}
            disabled={isReadOnly}
            onChange={(e) => {
              const val = e.target.value;
              const next = selected.includes(val)
                ? selected.filter((v) => v !== val)
                : [...selected.filter((v) => v !== selectValue), val];
              void persistValue(next.length ? next : [val]);
            }}
            onClick={stopPropagation}
            className={cn(
              "h-5 max-w-[9rem] cursor-pointer appearance-none rounded-sm border-[0.5px] border-strong bg-layer-2",
              "pr-6 pl-2 text-caption-sm-regular text-primary",
              "hover:bg-layer-transparent-hover focus:ring-1 focus:ring-accent-strong focus:outline-none",
              isReadOnly && "cursor-not-allowed opacity-60"
            )}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {selected.includes(opt.value) ? `✓ ${opt.value}` : opt.value}
              </option>
            ))}
          </select>
        </Tooltip>
        <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-1 h-2.5 w-2.5 -translate-y-1/2 text-secondary" />
      </div>
    );
  }

  const displayValue =
    formatCustomFieldDisplayValue(effectiveValue, property.property_type, property.options) ?? property.name;

  return (
    <Tooltip tooltipContent={`${property.name}: ${displayValue}`} isMobile={isMobile}>
      <div
        role="group"
        className="flex h-5 max-w-[9rem] flex-shrink-0 items-center truncate rounded-sm border-[0.5px] border-strong bg-layer-2 px-2 py-1 text-caption-sm-regular text-primary"
        onMouseDown={stopPropagation}
      >
        {displayValue}
      </div>
    </Tooltip>
  );
});
