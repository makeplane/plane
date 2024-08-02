import { FC, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { v4 } from "uuid";
// ui
import { setToast, TOAST_TYPE } from "@plane/ui";
// plane web components
import {
  IssuePropertyCreateOptionItem,
  IssuePropertyOptionItem,
} from "@/plane-web/components/issue-types/properties/attributes";
// plane web hooks
import { useIssueProperty, useIssueType } from "@/plane-web/hooks/store";
// plane web types
import { TCreationListModes, TIssuePropertyOption, TIssuePropertyOptionCreateList } from "@/plane-web/types";

type TIssuePropertyOptionsRoot = {
  issueTypeId: string;
  issuePropertyId: string | undefined;
  issuePropertyOptionCreateList: TIssuePropertyOptionCreateList[];
  handleIssuePropertyOptionCreateList: (mode: TCreationListModes, value: TIssuePropertyOptionCreateList) => void;
};

const defaultIssuePropertyOption: Partial<Partial<TIssuePropertyOption>> = {
  id: undefined,
  name: undefined,
  is_default: false,
};

export const IssuePropertyOptionsRoot: FC<TIssuePropertyOptionsRoot> = observer((props) => {
  const { issueTypeId, issuePropertyId, issuePropertyOptionCreateList, handleIssuePropertyOptionCreateList } = props;
  // store hooks
  const issueType = useIssueType(issueTypeId);
  const issueProperty = useIssueProperty(issueTypeId, issuePropertyId);
  // derived values
  const activePropertyOptions = issueProperty?.activePropertyOptions;
  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const secondLastElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (secondLastElementRef.current) {
      secondLastElementRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      // get the input element and focus on it
      const inputElement = secondLastElementRef.current.querySelector("input");
      inputElement?.focus();
    }
  }, [issuePropertyOptionCreateList]);

  useEffect(() => {
    const emptyOptions = issuePropertyOptionCreateList.filter((item) => !item.name).length;

    if (emptyOptions < 2) {
      const optionsToAdd = 2 - emptyOptions;
      const newOptions = Array.from({ length: optionsToAdd }, () => ({
        key: v4(),
        ...defaultIssuePropertyOption,
      }));
      newOptions.forEach((option) => handleIssuePropertyOptionCreateList("add", option));
    }
  }, [handleIssuePropertyOptionCreateList, issuePropertyOptionCreateList]);

  // handlers
  const handleOptionCreate = async (propertyId: string, value: TIssuePropertyOptionCreateList) => {
    // get issue property details from the store
    const issueProperty = issueType?.getPropertyById(propertyId);
    if (!issueProperty) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { key, ...payload } = value;

    await issueProperty
      .createPropertyOptions([payload])
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: `Property option created successfully.`,
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? `Failed to create issue property option. Please try again!`,
        });
      })
      .finally(() => {
        handleIssuePropertyOptionCreateList("remove", value);
      });
  };

  const handleIssuePropertyOptionCreate = (value: TIssuePropertyOptionCreateList) => {
    // If issuePropertyId is present, then create the property option directly
    if (issuePropertyId) {
      handleOptionCreate(issuePropertyId, value);
    } else {
      // Else, update the create list
      handleIssuePropertyOptionCreateList("update", value);
    }
  };

  return (
    <div className="p-1 pt-3">
      <div className="text-xs font-medium text-custom-text-300 pb-1">Add options</div>
      <div ref={containerRef} className="flex flex-col items-center space-y-1.5 max-h-32 overflow-scroll">
        {activePropertyOptions &&
          activePropertyOptions.map(
            (propertyOption) =>
              propertyOption.id && (
                <IssuePropertyOptionItem
                  key={propertyOption.id}
                  issueTypeId={issueTypeId}
                  issuePropertyId={issuePropertyId}
                  optionId={propertyOption.id}
                  operationMode="update"
                />
              )
          )}
        {issuePropertyOptionCreateList.map((issuePropertyOption, index) => (
          <IssuePropertyCreateOptionItem
            key={issuePropertyOption.key}
            ref={index === issuePropertyOptionCreateList.length - 2 ? secondLastElementRef : undefined}
            issueTypeId={issueTypeId}
            issuePropertyId={issuePropertyId}
            propertyOptionCreateListData={issuePropertyOption}
            updateCreateListData={handleIssuePropertyOptionCreate}
          />
        ))}
      </div>
    </div>
  );
});
