import { FC, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { GripVertical } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TIssuePropertyOptionCreateUpdateData } from "@plane/types";
import { Sortable, Tooltip } from "@plane/ui";
// plane web imports
import { usePropertyOptions } from "@/plane-web/hooks/store";
// local imports
import { IssuePropertyCreateOptionItem } from "./create-option-item";
import { IssuePropertyOptionItem } from "./option";

type TIssuePropertyOptionsRoot = {
  customPropertyId: string | undefined;
  error?: string;
};

export const IssuePropertyOptionsRoot: FC<TIssuePropertyOptionsRoot> = observer((props) => {
  const { customPropertyId, error } = props;
  // plane imports
  const { t } = useTranslation();
  // store hooks
  const { propertyOptions, handlePropertyOptionsList } = usePropertyOptions();
  // derived values
  const sortedActivePropertyOptions = propertyOptions.filter((item) => item.id);
  const createListData = propertyOptions.filter((item) => !item.id && item.key);
  // refs
  const containerRef = useRef<HTMLDivElement>(null);
  const secondLastElementRef = useRef<HTMLDivElement>(null);

  const scrollIntoElementView = () => {
    if (secondLastElementRef.current) {
      secondLastElementRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      // get the input element and focus on it
      const inputElement = secondLastElementRef.current.querySelector("input");
      inputElement?.focus();
    }
  };

  useEffect(() => {
    scrollIntoElementView();
  }, []);

  const handleOptionsDragAndDrop = (
    data: TIssuePropertyOptionCreateUpdateData[],
    movedItem?: TIssuePropertyOptionCreateUpdateData
  ) => {
    if (!sortedActivePropertyOptions || !customPropertyId || !movedItem) return;

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

    handlePropertyOptionsList("update", { id: movedItem.id, sort_order: newSortOrder });
  };

  return (
    <>
      <div className="text-xs font-medium text-custom-text-300">
        {t("work_item_types.settings.properties.attributes.option.create_update.label")}
      </div>
      <div ref={containerRef} className="flex flex-col items-center -ml-2 -mr-1.5 space-y-1.5">
        {sortedActivePropertyOptions && sortedActivePropertyOptions?.length > 0 && (
          <Sortable
            data={sortedActivePropertyOptions}
            render={(propertyOption: TIssuePropertyOptionCreateUpdateData) => (
              <div key={propertyOption.id} className="flex group w-full items-center">
                <Tooltip tooltipContent="Drag to rearrange">
                  <div className="rounded-sm flex-shrink-0 w-3 relative flex justify-center items-center transition-colors cursor-grab">
                    <GripVertical size={12} className="hidden group-hover:block text-custom-text-200" />
                  </div>
                </Tooltip>
                <IssuePropertyOptionItem
                  optionId={propertyOption.id}
                  propertyOptionData={propertyOption}
                  updateOptionData={(value) => {
                    handlePropertyOptionsList("update", value);
                  }}
                  scrollIntoNewOptionView={() => {
                    setTimeout(() => {
                      scrollIntoElementView();
                    }, 0);
                  }}
                />
              </div>
            )}
            containerClassName="w-full -ml-0.5 pr-2.5"
            onChange={(
              data: TIssuePropertyOptionCreateUpdateData[],
              movedItem?: TIssuePropertyOptionCreateUpdateData
            ) => handleOptionsDragAndDrop(data, movedItem)}
            keyExtractor={(option: TIssuePropertyOptionCreateUpdateData, index) =>
              option.id?.toString() ?? index.toString()
            }
          />
        )}
        {createListData.map((issuePropertyOption, index) => (
          <div key={issuePropertyOption.key} className="flex group w-full items-center">
            <Tooltip tooltipContent="Save to enable drag-and-rearrange">
              <div className="rounded-sm flex-shrink-0 w-3 relative flex justify-center items-center transition-colors cursor-not-allowed">
                <GripVertical size={12} className="hidden group-hover:block text-custom-text-400" />
              </div>
            </Tooltip>
            <IssuePropertyCreateOptionItem
              ref={index === createListData.length - 2 ? secondLastElementRef : undefined}
              propertyOptionCreateListData={issuePropertyOption}
              updateCreateListData={(value) => {
                handlePropertyOptionsList("update", value);
              }}
              scrollIntoNewOptionView={() => {
                setTimeout(() => {
                  scrollIntoElementView();
                }, 0);
              }}
              error={index === 0 ? error : undefined}
            />
          </div>
        ))}
      </div>
    </>
  );
});
