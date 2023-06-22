import React from "react";
// hooks
import useSpreadsheetIssuesView from "hooks/use-spreadsheet-issues-view";
// component
import { CustomMenu, Icon } from "components/ui";
// icon
import { ChevronDownIcon } from "@heroicons/react/24/outline";

type Props = {
  columnData: any;
  gridTemplateColumns: string;
};

export const SpreadsheetColumns: React.FC<Props> = ({ columnData, gridTemplateColumns }) => {
  const { orderBy, setOrderBy } = useSpreadsheetIssuesView();
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
                      <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
                    </div>
                  }
                  width="xl"
                >
                  <CustomMenu.MenuItem
                    key={col.propertyName}
                    onClick={() => {
                      setOrderBy(col.ascendingOrder);
                    }}
                  >
                    <div className="flex gap-1.5 items-center text-brand-secondary hover:text-brand-base">
                      <span>First</span>
                      <Icon iconName="east" className="text-sm" />
                      <span>Last</span>
                    </div>
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem
                    key={col.property}
                    onClick={() => {
                      setOrderBy(col.descendingOrder);
                    }}
                  >
                    <div className="flex gap-1.5 items-center text-brand-secondary hover:text-brand-base">
                      <span>Last</span>
                      <Icon iconName="east" className="text-sm" />
                      <span>First</span>
                    </div>
                  </CustomMenu.MenuItem>
                  <CustomMenu.MenuItem
                    key={col.property}
                    onClick={() => {
                      setOrderBy("-created_at");
                    }}
                  >
                    <div className="flex gap-1.5 items-center text-brand-secondary hover:text-brand-base">
                      <Icon iconName="block" className="text-sm" />
                      <span>None</span>
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
