import React from "react";
import { isEqual } from "lodash";
import { observer } from "mobx-react";
// components
import { CustomSearchSelect } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web hooks
import { TIssuePropertyOptionCreateList } from "@/plane-web/types";

type TDefaultOptionCreateSelectProps = {
  isMultiSelect?: boolean;
  isDisabled?: boolean;
  issuePropertyOptionCreateList: TIssuePropertyOptionCreateList[];
  handleOptionListUpdate: (value: TIssuePropertyOptionCreateList) => void;
};

export const DefaultOptionCreateSelect = observer((props: TDefaultOptionCreateSelectProps) => {
  const { isMultiSelect = false, isDisabled = false, issuePropertyOptionCreateList, handleOptionListUpdate } = props;
  // derived values
  const optionsList = issuePropertyOptionCreateList.filter((option) => !!option.name);
  const selectedDefaultOptionsKeys = optionsList.filter((option) => option.is_default).map((option) => option.key);
  // states
  const [data, setData] = React.useState<string[]>(selectedDefaultOptionsKeys ?? []);

  const customSearchOptions = optionsList.map((option) => ({
    value: option.key,
    query: option.name ?? "",
    content: option.name,
  }));

  const getOptionDetails = (optionId: string) => optionsList.find((option) => option.key === optionId);

  const getDisplayName = () => {
    if (isMultiSelect) {
      if (data.length) {
        if (data.length === 1) {
          return getOptionDetails(data[0])?.name;
        } else {
          return `${data.length} options selected`;
        }
      }
      return "Select options";
    } else {
      if (data.length) {
        return getOptionDetails(data[0])?.name;
      }
      return "Select option";
    }
  };

  const customSearchSelectProps = {
    label: getDisplayName(),
    options: customSearchOptions,
    className: "group w-full h-full flex",
    chevronClassName: "h-3.5 w-3.5 hidden group-hover:inline",
    buttonClassName: cn("rounded text-sm bg-custom-background-100 border-[0.5px] border-custom-border-300", {
      "text-custom-text-400": !data.length,
    }),
    disabled: isDisabled,
  };

  const onOptionValueChange = (value: string[]) => {
    issuePropertyOptionCreateList.map((option) => {
      handleOptionListUpdate({
        ...option,
        is_default: value.includes(option.key),
      });
    });
  };

  return (
    <>
      {isMultiSelect ? (
        <CustomSearchSelect
          {...customSearchSelectProps}
          value={data || []}
          onChange={(optionIds: string[]) => setData(optionIds)}
          onClose={() => {
            if (!isEqual(data, selectedDefaultOptionsKeys)) {
              onOptionValueChange(data);
            }
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
            if (!isEqual(updatedData, selectedDefaultOptionsKeys)) {
              onOptionValueChange(updatedData);
            }
          }}
          multiple={false}
        />
      )}
    </>
  );
});
