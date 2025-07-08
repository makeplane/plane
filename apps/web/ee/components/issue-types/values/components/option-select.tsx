import React, { useEffect, useState } from "react";
import { isEqual } from "lodash";
import { observer } from "mobx-react";
// components
import { ChevronDown } from "lucide-react";
import {
  EIssuePropertyType,
  EIssuePropertyValueError,
  IIssueProperty,
  TIssueProperty,
  TPropertyValueVariant,
} from "@plane/types";
import { CustomSearchSelect } from "@plane/ui";
// helpers
import { cn } from "@plane/utils";

type TOptionValueSelectProps = {
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType.OPTION>>;
  value: string[];
  customPropertyId: string;
  variant: TPropertyValueVariant;
  error?: EIssuePropertyValueError;
  isMultiSelect?: boolean;
  isDisabled?: boolean;
  buttonClassName?: string;
  showOptionDetails?: boolean;
  onOptionValueChange: (value: string[]) => Promise<void>;
  getPropertyInstanceById: (customPropertyId: string) => IIssueProperty<EIssuePropertyType> | undefined;
};

export const OptionValueSelect = observer((props: TOptionValueSelectProps) => {
  const {
    propertyDetail,
    value,
    customPropertyId,
    variant,
    error,
    isMultiSelect = false,
    isDisabled = false,
    buttonClassName = "",
    showOptionDetails = false,
    onOptionValueChange,
    getPropertyInstanceById,
  } = props;
  // states
  const [data, setData] = useState<string[]>([]);
  // store hooks
  const issueProperty = getPropertyInstanceById(customPropertyId);
  // derived values
  const sortedActivePropertyOptions = issueProperty?.sortedActivePropertyOptions;

  useEffect(() => {
    setData(value);
  }, [value]);

  const getDisplayName = () => {
    if (isMultiSelect) {
      if (data.length) {
        if (data.length === 1) {
          return issueProperty?.getPropertyOptionById(data[0])?.name;
        } else {
          if (showOptionDetails) {
            // get selected option names (comma separated), add "and" before the last option÷
            return data
              .map((optionId) => issueProperty?.getPropertyOptionById(optionId)?.name)
              .join(", ")
              .replace(/, ([^,]*)$/, " and $1");
          } else {
            return `${data.length} options selected`;
          }
        }
      }
      return "Select options";
    } else {
      if (data.length) {
        return issueProperty?.getPropertyOptionById(data[0])?.name;
      }
      return "Select an option";
    }
  };

  const customSearchOptions = sortedActivePropertyOptions?.map((option) => ({
    value: option.id,
    query: option.name ?? "",
    content: option.name,
  }));

  // sort all the options to top which is available in value.
  customSearchOptions?.sort((a, b) => {
    const aIndex = a.value ? value.indexOf(a.value) : -1;
    const bIndex = b.value ? value.indexOf(b.value) : -1;
    if (aIndex === -1 && bIndex === -1) {
      return 0;
    }
    if (aIndex === -1) {
      return 1;
    }
    if (bIndex === -1) {
      return -1;
    }
    return aIndex - bIndex;
  });

  const customSearchSelectProps = {
    options: customSearchOptions,
    className: "group w-full h-full flex",
    optionsClassName: "w-48",
    customButton: (
      <>
        <span className="text-sm truncate whitespace-nowrap">{getDisplayName()}</span>
        {!isDisabled && (
          <ChevronDown className={cn("flex-shrink-0 h-3.5 w-3.5 hidden group-hover:inline")} aria-hidden="true" />
        )}
      </>
    ),
    customButtonClassName: cn(
      "items-center rounded px-2 py-1 text-sm bg-custom-background-100 border-custom-border-200",
      {
        "border-[0.5px]": variant === "create" || Boolean(error),
        "border-0": variant === "update",
        "text-custom-text-400": !data.length,
        "border-red-500": Boolean(error),
      },
      buttonClassName
    ),
    disabled: isDisabled,
  };

  return (
    <>
      {isMultiSelect ? (
        <CustomSearchSelect
          {...customSearchSelectProps}
          value={data || []}
          onChange={(optionIds: string[]) => {
            setData(optionIds);
            // add data-delay-outside-click to delay the dropdown from closing so that data can be synced
            document.body?.setAttribute("data-delay-outside-click", "true");
          }}
          onClose={() => {
            if (!isEqual(data, value)) {
              onOptionValueChange(data);
            }
            document.body?.removeAttribute("data-delay-outside-click");
          }}
          multiple
        />
      ) : (
        <CustomSearchSelect
          {...customSearchSelectProps}
          value={data?.[0] || null}
          onChange={(optionId: string) => {
            const updatedData = optionId && !data?.includes(optionId) ? [optionId] : [];
            setData(updatedData);
            if (!isEqual(updatedData, value)) {
              onOptionValueChange(updatedData);
            }
          }}
          multiple={false}
        />
      )}
      {Boolean(error) && (
        <span className="text-xs font-medium text-red-500">
          {error === "REQUIRED" ? `${propertyDetail.display_name} is required` : error}
        </span>
      )}
    </>
  );
});
