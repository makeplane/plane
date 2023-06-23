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

  const { orderBy, setOrderBy } = useSpreadsheetIssuesView();

  const handleOrderBy = (order: TIssueOrderByOptions, itemKey: string) => {
    setOrderBy(order);
    setSelectedMenuItem(`${order}_${itemKey}`);
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
              className={`bg-brand-surface-2 ${
                col.propertyName === "title" ? "sticky left-0 z-20 bg-brand-surface-2 pl-24" : ""
              }`}
            >
              {col.propertyName === "title" || col.propertyName === "priority" ? (
                <div
                  className={`flex items-center justify-start gap-1.5 cursor-default text-sm text-brand-secondary text-current py-2.5 px-2`}
                >
                  {col.icon ? (
                    <col.icon
                      className={`text-brand-secondary ${
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
                </div>
              ) : (
                <CustomMenu
                  customButton={
                    <div
                      className={`group flex items-center justify-start gap-1.5 cursor-pointer text-sm text-brand-secondary text-current hover:text-brand-base py-2.5 px-2`}
                    >
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
                      <div className="flex gap-1.5 items-center">
                        {col.propertyName === "assignee" || col.propertyName === "labels" ? (
                          <>
                            <span>A-Z</span>
                            <span>Ascending</span>
                          </>
                        ) : col.propertyName === "due_date" ? (
                          <>
                            <span>1-9</span>
                            <span>Ascending</span>
                          </>
                        ) : col.propertyName === "estimate" ? (
                          <>
                            <span>0</span>
                            <Icon iconName="east" className="text-sm" />
                            <span>10</span>
                          </>
                        ) : (
                          <>
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
                    className={`${
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
                      <div className="flex gap-1.5 items-center">
                        {col.propertyName === "assignee" || col.propertyName === "labels" ? (
                          <>
                            <span>Z-A</span>
                            <span>Descending</span>
                          </>
                        ) : col.propertyName === "due_date" ? (
                          <>
                            <span>9-1</span>
                            <span>Descending</span>
                          </>
                        ) : col.propertyName === "estimate" ? (
                          <>
                            <span>10</span>
                            <Icon iconName="east" className="text-sm" />
                            <span>0</span>
                          </>
                        ) : (
                          <>
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
                  <CustomMenu.MenuItem
                    className={`${
                      selectedMenuItem === `-created_at_${col.propertyName}`
                        ? "bg-brand-surface-2"
                        : ""
                    }`}
                    key={col.property}
                    onClick={() => {
                      handleOrderBy("-created_at", col.propertyName);
                    }}
                  >
                    <div
                      className={`group flex gap-1.5 px-1 items-center justify-between ${
                        selectedMenuItem === `-created_at_${col.propertyName}`
                          ? "text-brand-base"
                          : "text-brand-secondary hover:text-brand-base"
                      }`}
                    >
                      <div className="flex gap-1.5 items-center">
                        <Icon iconName="block" className="text-sm" />
                        <span>None</span>
                      </div>

                      <CheckIcon
                        className={`h-3.5 w-3.5 opacity-0 group-hover:opacity-100 ${
                          selectedMenuItem === `-created_at_${col.propertyName}`
                            ? "opacity-100"
                            : ""
                        }`}
                      />
                    </div>
                  </CustomMenu.MenuItem>
                </CustomMenu>
              )}
            </div>
          );
        }
      })}
    </div>
  );
};
