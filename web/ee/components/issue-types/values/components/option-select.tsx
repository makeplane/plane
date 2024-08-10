import React, { useEffect, useState } from "react";
import { isEqual } from "lodash";
import { observer } from "mobx-react";
// components
import { CustomSearchSelect } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web hooks
import { useIssueProperty } from "@/plane-web/hooks/store";
// plane web types
import { EIssuePropertyType, EIssuePropertyValueError, TIssueProperty, TPropertyValueVariant } from "@/plane-web/types";

type TOptionValueSelectProps = {
  propertyDetail: Partial<TIssueProperty<EIssuePropertyType.OPTION>>;
  value: string[];
  issueTypeId: string;
  issuePropertyId: string;
  variant: TPropertyValueVariant;
  error?: EIssuePropertyValueError;
  isMultiSelect?: boolean;
  isDisabled?: boolean;
  buttonClassName?: string;
  onOptionValueChange: (value: string[]) => Promise<void>;
};

export const OptionValueSelect = observer((props: TOptionValueSelectProps) => {
  const {
    propertyDetail,
    value,
    issueTypeId,
    issuePropertyId,
    variant,
    error,
    isMultiSelect = false,
    isDisabled = false,
    buttonClassName = "",
    onOptionValueChange,
  } = props;
  // states
  const [data, setData] = useState<string[]>([]);
  // store hooks
  const issueProperty = useIssueProperty(issueTypeId, issuePropertyId);
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
          return `${data.length} options selected`;
        }
      }
      return "Select options";
    } else {
      if (data.length) {
        return issueProperty?.getPropertyOptionById(data[0])?.name;
      }
      return "Select option";
    }
  };

  const customSearchOptions = sortedActivePropertyOptions?.map((option) => ({
    value: option.id,
    query: option.name ?? "",
    content: option.name,
  }));

  const customSearchSelectProps = {
    label: getDisplayName(),
    options: customSearchOptions,
    className: "group w-full h-full flex",
    optionsClassName: "w-48",
    chevronClassName: "h-3.5 w-3.5 hidden group-hover:inline",
    buttonClassName: cn(
      "rounded text-sm bg-custom-background-100 border-custom-border-200",
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
