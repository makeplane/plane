import { FC, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { v4 } from "uuid";
// ui
import { GripVertical } from "lucide-react";
import { setToast, Sortable, TOAST_TYPE, Tooltip } from "@plane/ui";
// plane web components
import {
  IssuePropertyCreateOptionItem,
  IssuePropertyOptionItem,
} from "@/plane-web/components/issue-types/properties/attributes";
// plane web hooks
import { useIssueProperty, useIssueType } from "@/plane-web/hooks/store";
import { IIssuePropertyOption } from "@/plane-web/store/issue-types";
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
  const sortedActivePropertyOptions = issueProperty?.sortedActivePropertyOptions;
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
      .createPropertyOption(payload)
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

  const handleOptionsDragAndDrop = (data: TIssuePropertyOption[], movedItem?: IIssuePropertyOption) => {
    if (!sortedActivePropertyOptions || !issuePropertyId || !movedItem) return;

    // Function to calculate new sort_order
    const calculateSortOrder = (prev: number | undefined, next: number | undefined): number => {
      if (prev === undefined) return (next ?? 10000) / 2; // First element case
      if (next === undefined) return prev + 10000; // Last element case
      return (prev + next) / 2; // Middle elements case
    };

    // get the moved item index from the new data
    const movedItemIndex = data.findIndex((item) => item.id === movedItem.id);

    // get the previous and next item from the new data
    const prevItem = data[movedItemIndex - 1];
    const nextItem = data[movedItemIndex + 1];

    if (movedItemIndex === -1 || !movedItem.id) return;

    // get the new sort order
    const newSortOrder = calculateSortOrder(prevItem?.sort_order, nextItem?.sort_order);

    // update the sort order of the changed item
    const updatePropertyOption = issueProperty?.getPropertyOptionById(movedItem.id)?.updatePropertyOption;
    if (issuePropertyId && updatePropertyOption) {
      updatePropertyOption(issuePropertyId, { sort_order: newSortOrder });
    }
  };

  return (
    <div className="pt-3">
      <div className="text-xs font-medium text-custom-text-300 p-1">Add options</div>
      <div
        ref={containerRef}
        className="flex flex-col items-center, py-1 space-y-1.5 -mr-2 max-h-36 vertical-scrollbar scrollbar-xs"
      >
        {sortedActivePropertyOptions && sortedActivePropertyOptions?.length > 0 && (
          <Sortable
            data={sortedActivePropertyOptions}
            render={(propertyOption: IIssuePropertyOption) => (
              <div key={propertyOption.id} className="flex w-full items-center gap-0.5">
                <Tooltip tooltipContent="Drag to rearrange">
                  <div className="rounded-sm flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-grab">
                    <GripVertical size={14} className="text-custom-text-200" />
                  </div>
                </Tooltip>
                <IssuePropertyOptionItem
                  issueTypeId={issueTypeId}
                  issuePropertyId={issuePropertyId}
                  optionId={propertyOption.id}
                  operationMode="update"
                />
              </div>
            )}
            containerClassName="w-full pr-1"
            onChange={(data: IIssuePropertyOption[], movedItem?: IIssuePropertyOption) =>
              handleOptionsDragAndDrop(data, movedItem)
            }
            keyExtractor={(option: IIssuePropertyOption, index) => option.id?.toString() ?? index.toString()}
          />
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
