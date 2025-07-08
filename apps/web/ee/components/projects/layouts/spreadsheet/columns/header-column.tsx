"use client";

//ui
import { ArrowDownWideNarrow, ArrowUpNarrowWide, CheckIcon, ChevronDownIcon, Eraser, MoveRight } from "lucide-react";
import { CustomMenu } from "@plane/ui";
//hooks
import useLocalStorage from "@/hooks/use-local-storage";
import { IProjectDisplayProperties, SPREADSHEET_PROPERTY_DETAILS } from "@/plane-web/constants/project/spreadsheet";
import { TProjectDisplayFilters, TProjectSortBy } from "@/plane-web/types/workspace-project-filters";
//types
//constants

interface Props {
  property: keyof IProjectDisplayProperties;
  displayFilters: TProjectDisplayFilters;
  handleDisplayFilterUpdate: (data: Partial<TProjectDisplayFilters>) => void;
  onClose: () => void;
}

export const HeaderColumn = (props: Props) => {
  const { handleDisplayFilterUpdate, property, onClose } = props;

  const { storedValue: selectedMenuItem } = useLocalStorage("projectSpreadsheetViewSorting", "");
  const { setValue: setActiveSortingProperty } = useLocalStorage("spreadsheetViewActiveSortingProperty", "");
  const propertyDetails = SPREADSHEET_PROPERTY_DETAILS[property];

  const handleOrderBy = (order: any, itemKey: string) => {
    console.log(order, itemKey);
    handleDisplayFilterUpdate({ sort_order: order, sort_by: itemKey as TProjectSortBy });

    // setSelectedMenuItem(`${order}_${itemKey}`);
    setActiveSortingProperty(itemKey);
  };

  return (
    <CustomMenu
      customButtonClassName="clickable !w-full"
      customButtonTabIndex={-1}
      className="!w-full"
      customButton={
        <div className="flex w-full cursor-pointer items-center justify-between gap-1.5 py-2 text-sm text-custom-text-200 hover:text-custom-text-100">
          <div className="flex items-center gap-1.5">
            {<propertyDetails.icon className="h-4 w-4 text-custom-text-400" />}
            {propertyDetails.title}
          </div>
          {propertyDetails.isSortingAllowed && (
            <div className="ml-3 flex gap-2">
              {selectedMenuItem?.includes(propertyDetails.title.toLowerCase()) &&
                (selectedMenuItem?.includes("desc") ? (
                  <ArrowUpNarrowWide className="h-3 w-3 stroke-[1.5]" />
                ) : (
                  <ArrowDownWideNarrow className="h-3 w-3 stroke-[1.5]" />
                ))}
              <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
            </div>
          )}
        </div>
      }
      onMenuClose={onClose}
      placement="bottom-start"
      closeOnSelect
      disabled={!propertyDetails.isSortingAllowed}
    >
      <CustomMenu.MenuItem onClick={() => handleOrderBy("asc", property)}>
        <div
          className={`flex items-center justify-between gap-1.5 px-1 ${
            selectedMenuItem === `asc_${property}`
              ? "text-custom-text-100"
              : "text-custom-text-200 hover:text-custom-text-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <ArrowDownWideNarrow className="h-3 w-3 stroke-[1.5]" />
            <span>{propertyDetails.ascendingOrderTitle}</span>
            <MoveRight className="h-3 w-3" />
            <span>{propertyDetails.descendingOrderTitle}</span>
          </div>

          {selectedMenuItem === `asc_${property}` && <CheckIcon className="h-3 w-3" />}
        </div>
      </CustomMenu.MenuItem>
      <CustomMenu.MenuItem onClick={() => handleOrderBy("desc", property)}>
        <div
          className={`flex items-center justify-between gap-1.5 px-1 ${
            selectedMenuItem === `desc_${property}`
              ? "text-custom-text-100"
              : "text-custom-text-200 hover:text-custom-text-100"
          }`}
        >
          <div className="flex items-center gap-2">
            <ArrowUpNarrowWide className="h-3 w-3 stroke-[1.5]" />
            <span>{propertyDetails.descendingOrderTitle}</span>
            <MoveRight className="h-3 w-3" />
            <span>{propertyDetails.ascendingOrderTitle}</span>
          </div>

          {selectedMenuItem === `desc_${property}` && <CheckIcon className="h-3 w-3" />}
        </div>
      </CustomMenu.MenuItem>
      {selectedMenuItem && selectedMenuItem !== "" && selectedMenuItem.includes(property) && (
        <CustomMenu.MenuItem className={`mt-0.5}`} key={property} onClick={() => handleOrderBy("asc", "manual")}>
          <div className="flex items-center gap-2 px-1">
            <Eraser className="h-3 w-3" />
            <span>Clear sorting</span>
          </div>
        </CustomMenu.MenuItem>
      )}
    </CustomMenu>
  );
};
