import React from "react";
// hooks
import useSpreadsheetIssuesView from "hooks/use-spreadsheet-issues-view";
import useLocalStorage from "hooks/use-local-storage";
// component
import { CustomMenu, Icon } from "components/ui";
// icon
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
// types
import { TIssueOrderByOptions } from "types";

type Props = {
  columnData: any;
  gridTemplateColumns: string;
};

export const SpreadsheetColumns: React.FC<Props> = ({ columnData, gridTemplateColumns }) => {
  const { storedValue: selectedMenuItem, setValue: setSelectedMenuItem } = useLocalStorage(
    "spreadsheetViewSorting",
    ""
  );
  const { storedValue: activeSortingProperty, setValue: setActiveSortingProperty } =
    useLocalStorage("spreadsheetViewActiveSortingProperty", "");

  const { orderBy, setOrderBy } = useSpreadsheetIssuesView();

  const handleOrderBy = (order: TIssueOrderByOptions, itemKey: string) => {
    setOrderBy(order);
    setSelectedMenuItem(`${order}_${itemKey}`);
    setActiveSortingProperty(order === "-created_at" ? "" : itemKey);
  };

  return (
    <div
      className={`grid auto-rows-[minmax(36px,1fr)] w-full min-w-max`}
      style={{ gridTemplateColumns }}
    >
      {columnData.map((col: any) => {
        if (col.isActive) {
          return (
            <div
              className={`bg-brand-surface-1 w-full ${
                col.propertyName === "title" ? "sticky left-0 z-20 bg-brand-surface-1 pl-24" : ""
              }`}
            >
              {col.propertyName === "title" ? (
                <div
                  className={`flex items-center justify-start gap-1.5 cursor-default text-sm text-brand-secondary text-current w-full py-2.5 px-2`}
                >
                  {col.colName}
                </div>
              ) : (
                <CustomMenu
                  className="!w-full"
                  customButton={
                    <div
                      className={`relative group flex items-center justify-start gap-1.5 cursor-pointer text-sm text-brand-secondary text-current hover:text-brand-base w-full py-3 px-2 ${
                        activeSortingProperty === col.propertyName ? "bg-brand-surface-2" : ""
                      }`}
                    >
                      {activeSortingProperty === col.propertyName && (
                        <div className="absolute top-1 right-1.5">
                          <Icon
                            iconName="filter_list"
                            className="flex items-center justify-center h-3.5 w-3.5 rounded-full bg-brand-accent text-xs text-white"
                          />
                        </div>
                      )}

                      {col.icon ? (
                        <col.icon
                          className={`text-brand-secondary group-hover:text-brand-base ${
                            col.propertyName === "estimate" ? "-rotate-90" : ""
                          }`}
                          aria-hidden="true"
                          height="14"
                          width="14"
                        />
                      ) : col.propertyName === "priority" ? (
                        <span className="text-sm material-symbols-rounded text-brand-secondary">
                          signal_cellular_alt
                        </span>
                      ) : (
                        ""
                      )}

                      {col.colName}
                      <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
                    </div>
                  }
                  menuItemsWhiteBg
                  width="xl"
                >
                  <CustomMenu.MenuItem
                    className={`${
                      selectedMenuItem === `${col.ascendingOrder}_${col.propertyName}`
                        ? "bg-brand-surface-2"
                        : ""
                    }`}
                    key={col.propertyName}
                    onClick={() => {
                      handleOrderBy(col.ascendingOrder, col.propertyName);
                    }}
                  >
                    <div
                      className={`group flex gap-1.5 px-1 items-center justify-between ${
                        selectedMenuItem === `${col.ascendingOrder}_${col.propertyName}`
                          ? "text-brand-base"
                          : "text-brand-secondary hover:text-brand-base"
                      }`}
                    >
                      <div className="flex gap-2 items-center">
                        {col.propertyName === "assignee" || col.propertyName === "labels" ? (
                          <>
                            <span className="relative flex items-center h-6 w-6">
                              <Icon
                                iconName="east"
                                className="absolute left-0 rotate-90 text-xs leading-3"
                              />
                              <Icon iconName="sort" className="absolute right-0 text-sm" />
                            </span>
                            <span>A</span>
                            <Icon iconName="east" className="text-sm" />
                            <span>Z</span>
                          </>
                        ) : col.propertyName === "due_date" ? (
                          <>
                            <span className="relative flex items-center h-6 w-6">
                              <Icon
                                iconName="east"
                                className="absolute left-0 rotate-90 text-xs leading-3"
                              />
                              <Icon iconName="sort" className="absolute right-0 text-sm" />
                            </span>
                            <span>New</span>
                            <Icon iconName="east" className="text-sm" />
                            <span>Old</span>
                          </>
                        ) : (
                          <>
                            <span className="relative flex items-center h-6 w-6">
                              <Icon
                                iconName="east"
                                className="absolute left-0 rotate-90 text-xs leading-3"
                              />
                              <Icon iconName="sort" className="absolute right-0 text-sm" />
                            </span>
                            <span>First</span>
                            <Icon iconName="east" className="text-sm" />
                            <span>Last</span>
                          </>
                        )}
                      </div>

                      <CheckIcon
                        className={`h-3.5 w-3.5 opacity-0 group-hover:opacity-100 ${
                          selectedMenuItem === `${col.ascendingOrder}_${col.propertyName}`
                            ? "opacity-100"
                            : ""
                        }`}
                      />
                    </div>
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem
                    className={`mt-0.5 ${
                      selectedMenuItem === `${col.descendingOrder}_${col.propertyName}`
                        ? "bg-brand-surface-2"
                        : ""
                    }`}
                    key={col.property}
                    onClick={() => {
                      handleOrderBy(col.descendingOrder, col.propertyName);
                    }}
                  >
                    <div
                      className={`group flex gap-1.5 px-1 items-center justify-between ${
                        selectedMenuItem === `${col.descendingOrder}_${col.propertyName}`
                          ? "text-brand-base"
                          : "text-brand-secondary hover:text-brand-base"
                      }`}
                    >
                      <div className="flex gap-2 items-center">
                        {col.propertyName === "assignee" || col.propertyName === "labels" ? (
                          <>
                            <span className="relative flex items-center h-6 w-6">
                              <Icon
                                iconName="east"
                                className="absolute left-0 -rotate-90 text-xs leading-3"
                              />
                              <Icon
                                iconName="sort"
                                className="absolute rotate-180 transform scale-x-[-1] right-0 text-sm"
                              />
                            </span>
                            <span>Z</span>
                            <Icon iconName="east" className="text-sm" />
                            <span>A</span>
                          </>
                        ) : col.propertyName === "due_date" ? (
                          <>
                            <span className="relative flex items-center h-6 w-6">
                              <Icon
                                iconName="east"
                                className="absolute left-0 -rotate-90 text-xs leading-3"
                              />
                              <Icon
                                iconName="sort"
                                className="absolute rotate-180 transform scale-x-[-1] right-0 text-sm"
                              />
                            </span>
                            <span>Old</span>
                            <Icon iconName="east" className="text-sm" />
                            <span>New</span>
                          </>
                        ) : (
                          <>
                            <span className="relative flex items-center h-6 w-6">
                              <Icon
                                iconName="east"
                                className="absolute left-0 -rotate-90 text-xs leading-3"
                              />
                              <Icon
                                iconName="sort"
                                className="absolute rotate-180 transform scale-x-[-1] right-0 text-sm"
                              />
                            </span>
                            <span>Last</span>
                            <Icon iconName="east" className="text-sm" />
                            <span>First</span>
                          </>
                        )}
                      </div>

                      <CheckIcon
                        className={`h-3.5 w-3.5 opacity-0 group-hover:opacity-100 ${
                          selectedMenuItem === `${col.descendingOrder}_${col.propertyName}`
                            ? "opacity-100"
                            : ""
                        }`}
                      />
                    </div>
                  </CustomMenu.MenuItem>
                  {selectedMenuItem &&
                    selectedMenuItem !== "" &&
                    orderBy !== "-created_at" &&
                    selectedMenuItem.includes(col.propertyName) && (
                      <CustomMenu.MenuItem
                        className={`mt-0.5${
                          selectedMenuItem === `-created_at_${col.propertyName}`
                            ? "bg-brand-surface-2"
                            : ""
                        }`}
                        key={col.property}
                        onClick={() => {
                          handleOrderBy("-created_at", col.propertyName);
                        }}
                      >
                        <div className={`group flex gap-1.5 px-1 items-center justify-between `}>
                          <div className="flex gap-1.5 items-center">
                            <span className="relative flex items-center justify-center h-6 w-6">
                              <Icon iconName="ink_eraser" className="text-sm" />
                            </span>

                            <span>Clear sorting</span>
                          </div>
                        </div>
                      </CustomMenu.MenuItem>
                    )}
                </CustomMenu>
              )}
            </div>
          );
        }
      })}
    </div>
  );
};
