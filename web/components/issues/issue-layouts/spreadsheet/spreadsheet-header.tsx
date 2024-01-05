import { IIssueDisplayFilterOptions, IIssueDisplayProperties, TIssueOrderByOptions } from "@plane/types";
import { CustomMenu, LayersIcon } from "@plane/ui";
import { SPREADSHEET_PROPERTY_DETAILS, SPREADSHEET_PROPERTY_LIST } from "constants/spreadsheet";
import useLocalStorage from "hooks/use-local-storage";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  CheckIcon,
  ChevronDownIcon,
  Eraser,
  ListFilter,
  MoveRight,
} from "lucide-react";
import { WithDisplayPropertiesHOC } from "../properties/with-display-properties-HOC";

interface Props {
  displayProperties: IIssueDisplayProperties;
  displayFilters: IIssueDisplayFilterOptions;
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  isEstimateEnabled: boolean;
}

export const SpreadsheetHeader = (props: Props) => {
  const { displayProperties, displayFilters, handleDisplayFilterUpdate, isEstimateEnabled } = props;

  const { storedValue: selectedMenuItem, setValue: setSelectedMenuItem } = useLocalStorage(
    "spreadsheetViewSorting",
    ""
  );
  const { storedValue: activeSortingProperty, setValue: setActiveSortingProperty } = useLocalStorage(
    "spreadsheetViewActiveSortingProperty",
    ""
  );

  const handleOrderBy = (order: TIssueOrderByOptions, itemKey: string) => {
    handleDisplayFilterUpdate({ order_by: order });

    setSelectedMenuItem(`${order}_${itemKey}`);
    setActiveSortingProperty(order === "-created_at" ? "" : itemKey);
  };

  return (
    <tr className="sticky top-0 h-11 bg-custom-background-90 text-sm font-medium">
      <th className="sticky left-0 z-[2] w-[28rem] flex w-full items-center border border-l-0 border-custom-border-100 ">
        <WithDisplayPropertiesHOC displayProperties={displayProperties} displayPropertyKey="key">
          <span className="flex h-full w-24 flex-shrink-0 items-center px-4 py-2.5">
            <span className="mr-1.5 text-custom-text-400">#</span>ID
          </span>
        </WithDisplayPropertiesHOC>
        <span className="flex h-full w-full flex-grow items-center justify-center px-4 py-2.5">
          <LayersIcon className="mr-1.5 h-4 w-4 text-custom-text-400" />
          Issue
        </span>
      </th>
      {SPREADSHEET_PROPERTY_LIST.map((property) => {
        const propertyDetails = SPREADSHEET_PROPERTY_DETAILS[property];

        const shouldRenderProperty = property === "estimate" ? isEstimateEnabled : true;

        return (
          <WithDisplayPropertiesHOC
            displayProperties={displayProperties}
            displayPropertyKey={property}
            shouldRenderProperty={shouldRenderProperty}
          >
            <th className="sticky top-0 z-[1] flex h-11 w-full min-w-[8rem] items-center border border-l-0 border-custom-border-100 px-4 py-1">
              <CustomMenu
                customButtonClassName="!w-full"
                className="!w-full"
                customButton={
                  <div className="flex w-full cursor-pointer items-center justify-between gap-1.5 py-2 text-sm text-custom-text-200 hover:text-custom-text-100">
                    <div className="flex items-center gap-1.5">
                      {<propertyDetails.icon className="h-4 w-4 text-custom-text-400" />}
                      {propertyDetails.title}
                    </div>
                    <div className="ml-3 flex">
                      {activeSortingProperty === property && (
                        <div className="flex h-3.5 w-3.5 items-center justify-center rounded-full">
                          <ListFilter className="h-3 w-3" />
                        </div>
                      )}
                      <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
                    </div>
                  </div>
                }
                width="xl"
                placement="bottom-end"
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

                    {selectedMenuItem === `${propertyDetails.ascendingOrderKey}_${property}` && (
                      <CheckIcon className="h-3 w-3" />
                    )}
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
                      className={`mt-0.5 ${
                        selectedMenuItem === `-created_at_${property}` ? "bg-custom-background-80" : ""
                      }`}
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
            </th>
          </WithDisplayPropertiesHOC>
        );
      })}
    </tr>
  );
};
