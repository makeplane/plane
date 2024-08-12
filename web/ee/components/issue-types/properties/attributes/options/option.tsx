import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
// ui
import { Input } from "@plane/ui";
// plane web hooks
import { cn } from "@/helpers/common.helper";
// plane web types
import { TIssuePropertyOption, TIssuePropertyOptionCreateUpdateData } from "@/plane-web/types";

type TIssuePropertyOptionItem = {
  optionId?: string;
  propertyOptionData: TIssuePropertyOptionCreateUpdateData;
  updateOptionData: (value: TIssuePropertyOptionCreateUpdateData) => void;
  error?: string;
};

export const IssuePropertyOptionItem: FC<TIssuePropertyOptionItem> = observer((props) => {
  const { optionId, propertyOptionData, updateOptionData, error: optionsError } = props;
  // derived values
  const { key, ...propertyOptionCreateData } = propertyOptionData;
  // states
  const [error, setError] = useState<string | undefined>(optionsError);
  const [optionData, setOptionData] = useState<Partial<TIssuePropertyOption>>(propertyOptionCreateData);

  useEffect(() => {
    if (optionId && !optionData.name) setError("Option name is required.");
    else setError(optionsError ?? undefined);
  }, [optionId, optionData, optionsError]);

  // handle create/ update operation
  const handleCreateUpdate = async () => {
    // return if option name is same as previous or empty
    if (!optionData.name) return;
    // handle option data update
    updateOptionData({ key, ...optionData });
  };

  // handle changes in option local data
  const handleOptionDataChange = <T extends keyof TIssuePropertyOption>(key: T, value: TIssuePropertyOption[T]) => {
    // update property data
    setOptionData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Input
      id={`option-${optionId}-${key}`}
      value={optionData.name}
      onChange={(e) => handleOptionDataChange("name", e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && !!optionData.name && e.currentTarget.blur()}
      onBlur={() => handleCreateUpdate()}
      placeholder={"Add option"}
      className={cn("w-full text-sm bg-custom-background-100 border-[0.5px] rounded", {
        "border-custom-border-300": !Boolean(error),
      })}
      inputSize="xs"
      hasError={Boolean(error)}
    />
  );
});
