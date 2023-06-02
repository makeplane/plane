import React from "react";

type Props = {
  columnData: any;
  gridTemplateColumns: string;
};

export const SpreadsheetColumns: React.FC<Props> = ({ columnData, gridTemplateColumns }) => (
  <div
    className={`sticky z-10 top-0 grid pt-4 auto-rows-[minmax(36px,1fr)] rounded-lg border-b border-brand-base bg-brand-base`}
    style={{ gridTemplateColumns }}
  >
    {columnData.map((col: any) => {
      if (col.isActive) {
        return (
          <div className="flex items-center justify-center text-base text-brand-base text-current p-2.5 border-b border-brand-base ">
            {col.colName}
          </div>
        );
      }
    })}
  </div>
);
