import { FC, useEffect, useState } from "react";
import isEqual from "lodash/isEqual";
import { observer } from "mobx-react";
import { Info } from "lucide-react";
// ui
import { Input, Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// plane web hooks
import { usePropertyOptions } from "@/plane-web/hooks/store";
// plane web types
import { TIssuePropertyOption, TIssuePropertyOptionCreateUpdateData } from "@/plane-web/types";

type TIssuePropertyOptionItem = {
  optionId?: string;
  propertyOptionData: TIssuePropertyOptionCreateUpdateData;
  updateOptionData: (value: TIssuePropertyOptionCreateUpdateData) => void;
  scrollIntoNewOptionView: () => void;
  error?: string;
};

export const IssuePropertyOptionItem: FC<TIssuePropertyOptionItem> = observer((props) => {
  const { optionId, propertyOptionData, updateOptionData, scrollIntoNewOptionView, error: optionsError } = props;
  // store hooks
  const { propertyOptions } = usePropertyOptions();
  // derived values
  const { key, ...propertyOptionCreateData } = propertyOptionData;
  // states
  const [error, setError] = useState<string | undefined>(optionsError);
  const [optionData, setOptionData] = useState<Partial<TIssuePropertyOption>>(propertyOptionCreateData);

  useEffect(() => {
    if (optionId && !optionData.name) setError("Option name is required.");
    else setError(optionsError ?? undefined);
  }, [optionId, optionData, optionsError]);

  const checkForDuplicate = ({ identifier, value }: { identifier: string | undefined; value: string }) => {
    if (!value) return;
    // check for duplicate option name
    const isDuplicate = propertyOptions.find(
      (option) => option.id !== identifier && option.key !== identifier && option.name === value
    );
    if (isDuplicate) setError("Option with same name already exists.");
    else setError(undefined);
    return isDuplicate;
  };

  // handle create/ update operation
  const handleCreateUpdate = async () => {
    // return if no change in data
    if (isEqual(propertyOptionCreateData.name, optionData.name)) return;
    // trim option name
    const optionDataToUpdate = { ...optionData, name: optionData.name?.trim() };
    setOptionData(optionDataToUpdate);
    // return if option name is same as previous or empty
    if (!optionDataToUpdate.name) return;
    // check for duplicate option name
    if (checkForDuplicate({ identifier: optionDataToUpdate.id ?? key, value: optionDataToUpdate.name })) return;
    // handle option data update
    updateOptionData({ key, ...optionDataToUpdate });
  };

  // handle changes in option local data
  const handleOptionDataChange = <T extends keyof TIssuePropertyOption>(key: T, value: TIssuePropertyOption[T]) => {
    // update property data
    setOptionData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="relative w-full flex items-center">
      <Input
        id={`option-${optionId}-${key}`}
        value={optionData.name}
        onChange={(e) => handleOptionDataChange("name", e.target.value)}
        onKeyDown={(e) => {
          if (["Enter", "Tab"].includes(e.key) && !!optionData.name) {
            e.currentTarget.blur();
            scrollIntoNewOptionView();
          }
        }}
        onBlur={() => handleCreateUpdate()}
        placeholder={"Add option"}
        className={cn("w-full text-sm bg-custom-background-100 border-[0.5px] rounded", {
          "border-custom-border-300": !Boolean(error),
        })}
        inputSize="xs"
        hasError={Boolean(error)}
      />
      {Boolean(error) && (
        <Tooltip tooltipContent={error} className="text-xs" position="left">
          <Info className="absolute right-1.5 h-3 w-3 stroke-red-600 hover:cursor-pointer" />
        </Tooltip>
      )}
    </div>
  );
});
