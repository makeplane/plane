import { FC, useEffect, useState } from "react";
import { isEqual } from "lodash";
import { observer } from "mobx-react";
// ui
import { Input, setToast, TOAST_TYPE } from "@plane/ui";
// plane web hooks
import { cn } from "@/helpers/common.helper";
import { usePropertyOption } from "@/plane-web/hooks/store";
import { IssuePropertyOption } from "@/plane-web/store/issue-types";
// plane web types
import { TIssuePropertyOption, TIssuePropertyOptionCreateList, TOperationMode } from "@/plane-web/types";

type TIssuePropertyOptionItem = {
  issueTypeId: string;
  issuePropertyId: string | undefined;
  optionId?: string;
  operationMode: TOperationMode;
  propertyOptionCreateListData?: TIssuePropertyOptionCreateList;
  updateCreateListData?: (value: TIssuePropertyOptionCreateList) => void;
};

export const IssuePropertyOptionItem: FC<TIssuePropertyOptionItem> = observer((props) => {
  const { issueTypeId, issuePropertyId, optionId, operationMode, propertyOptionCreateListData, updateCreateListData } =
    props;
  // store hooks
  const issuePropertyOption = usePropertyOption(issueTypeId, issuePropertyId, optionId);
  // derived values
  let key: string;
  let propertyOptionCreateData;
  if (propertyOptionCreateListData) {
    ({ key, ...propertyOptionCreateData } = propertyOptionCreateListData);
  }
  const propertyOptionDetail = optionId ? issuePropertyOption?.asJSON : propertyOptionCreateData;
  // return null if no property option found
  if (!propertyOptionDetail) return null;
  // states
  const [error, setError] = useState<string | undefined>(undefined);
  const [optionData, setOptionData] = useState<Partial<TIssuePropertyOption>>(propertyOptionDetail);

  useEffect(() => {
    if (optionId && !optionData.name) setError("Option name is required.");
    else setError(undefined);
  }, [optionId, optionData]);

  // handlers
  // handle update option operation
  const handleUpdateOption = async (data: Partial<IssuePropertyOption>) => {
    if (!issuePropertyId) return;
    await issuePropertyOption
      ?.updatePropertyOption(issuePropertyId, data)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: `Property option ${optionData?.name} updated successfully.`,
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? `Failed to update property option. Please try again!`,
        });
        setOptionData(propertyOptionDetail);
      });
  };

  // handle create/ update operation
  const handleCreateUpdate = async () => {
    // return if option name is same as previous or empty
    if (!optionData.name || isEqual(optionData.name, propertyOptionDetail.name)) return;
    // handle create property option
    if (operationMode === "create" && updateCreateListData) updateCreateListData({ key, ...optionData });
    // handle update property option
    else if (operationMode === "update") await handleUpdateOption(optionData);
  };

  // handle changes in option local data
  const handleOptionDataChange = <T extends keyof TIssuePropertyOption>(key: T, value: TIssuePropertyOption[T]) => {
    // update property data
    setOptionData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Input
      id={`option-${optionId}`}
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
      autoFocus
    />
  );
});
