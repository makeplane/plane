import React from "react";

type Props = {
  columnData: any;
  gridTemplateColumns: string;
};

export const SpreadsheetColumns: React.FC<Props> = ({ columnData, gridTemplateColumns }) => (
  <div
    className={`grid auto-rows-[minmax(36px,1fr)] bg-brand-base`}
    style={{ gridTemplateColumns }}
  >
    {columnData.map((col: any) => {
      if (col.isActive) {
        return (
          <div className="flex items-center justify-start cursor-default text-base text-brand-base text-current py-2.5 px-2">
            {col.colName}
          </div>
        );
      }
    })}
  </div>
);
