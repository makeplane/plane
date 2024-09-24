"use client";

//ui
import { ArrowDownWideNarrow, ArrowUpNarrowWide, CheckIcon, ChevronDownIcon, Eraser, MoveRight } from "lucide-react";
import { IIssueDisplayFilterOptions, IIssueDisplayProperties, TIssueOrderByOptions } from "@plane/types";
import { CustomMenu, Row } from "@plane/ui";
//hooks
import { SPREADSHEET_PROPERTY_DETAILS } from "@/constants/spreadsheet";
import useLocalStorage from "@/hooks/use-local-storage";
//types
//constants

interface Props {
  property: keyof IIssueDisplayProperties;
  displayFilters: IIssueDisplayFilterOptions;
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  onClose: () => void;
}

export const HeaderColumn = (props: Props) => {
  const { displayFilters, handleDisplayFilterUpdate, property, onClose } = props;

  const { storedValue: selectedMenuItem, setValue: setSelectedMenuItem } = useLocalStorage(
    "spreadsheetViewSorting",
    ""
  );
  const { storedValue: activeSortingProperty, setValue: setActiveSortingProperty } = useLocalStorage(
    "spreadsheetViewActiveSortingProperty",
    ""
  );
  const propertyDetails = SPREADSHEET_PROPERTY_DETAILS[property];

  const handleOrderBy = (order: TIssueOrderByOptions, itemKey: string) => {
    handleDisplayFilterUpdate({ order_by: order });

    setSelectedMenuItem(`${order}_${itemKey}`);
    setActiveSortingProperty(order === "-created_at" ? "" : itemKey);
  };

  return (
    <CustomMenu
      customButtonClassName="clickable !w-full"
      customButtonTabIndex={-1}
      className="!w-full"
      customButton={
        <Row className="flex w-full cursor-pointer items-center justify-between gap-1.5 py-2 text-sm text-custom-text-200 hover:text-custom-text-100">
          <div className="flex items-center gap-1.5">
            {<propertyDetails.icon className="h-4 w-4 text-custom-text-400" />}
            {propertyDetails.title}
          </div>
          <div className="ml-3 flex">
            {activeSortingProperty === property && (
              <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full">
                {propertyDetails.ascendingOrderKey === displayFilters.order_by ? (
                  <ArrowDownWideNarrow className="h-3 w-3" />
                ) : (
                  <ArrowUpNarrowWide className="h-3 w-3" />
                )}
              </div>
            )}
            <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
          </div>
        </Row>
      }
      onMenuClose={onClose}
      placement="bottom-start"
      closeOnSelect
    >
      <CustomMenu.MenuItem onClick={() => handleOrderBy(propertyDetails.ascendingOrderKey, property)}>
        <div
          className={`flex items-center justify-between gap-1.5 px-1 ${
            selectedMenuItem === `${propertyDetails.ascendingOrderKey}_${property}`
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

          {selectedMenuItem === `${propertyDetails.ascendingOrderKey}_${property}` && <CheckIcon className="h-3 w-3" />}
        </div>
      </CustomMenu.MenuItem>
      <CustomMenu.MenuItem onClick={() => handleOrderBy(propertyDetails.descendingOrderKey, property)}>
        <div
          className={`flex items-center justify-between gap-1.5 px-1 ${
            selectedMenuItem === `${propertyDetails.descendingOrderKey}_${property}`
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

          {selectedMenuItem === `${propertyDetails.descendingOrderKey}_${property}` && (
            <CheckIcon className="h-3 w-3" />
          )}
        </div>
      </CustomMenu.MenuItem>
      {selectedMenuItem &&
        selectedMenuItem !== "" &&
        displayFilters?.order_by !== "-created_at" &&
        selectedMenuItem.includes(property) && (
          <CustomMenu.MenuItem
            className={`mt-0.5 ${selectedMenuItem === `-created_at_${property}` ? "bg-custom-background-80" : ""}`}
            key={property}
            onClick={() => handleOrderBy("-created_at", property)}
          >
            <div className="flex items-center gap-2 px-1">
              <Eraser className="h-3 w-3" />
              <span>Clear sorting</span>
            </div>
          </CustomMenu.MenuItem>
        )}
    </CustomMenu>
  );
};
