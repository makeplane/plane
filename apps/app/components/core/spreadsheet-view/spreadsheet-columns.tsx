import React from "react";

type Props = {
  columnData: any;
  gridTemplateColumns: string;
};

export const SpreadsheetColumns: React.FC<Props> = ({ columnData, gridTemplateColumns }) => (
  <div className={`grid auto-rows-[minmax(36px,1fr)]`} style={{ gridTemplateColumns }}>
    {columnData.map((col: any) => {
      if (col.isActive) {
        return (
          <div
            className={`flex items-center justify-start cursor-default text-sm text-brand-base text-current py-2.5 px-2 ${
              col.propertyName === "title" ? "sticky  left-0 z-10 bg-brand-surface-2 pl-24" : ""
            }`}
          >
            {col.colName}
          </div>
        );
      }
    })}
  </div>
);
