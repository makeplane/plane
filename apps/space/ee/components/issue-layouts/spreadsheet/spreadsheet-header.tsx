import { observer } from "mobx-react";
// types
import { IIssueDisplayProperties } from "@plane/types";
// components
import { SpreadsheetHeaderColumn } from "./spreadsheet-header-column";

interface Props {
  displayProperties: IIssueDisplayProperties;
  spreadsheetColumnsList: (keyof IIssueDisplayProperties)[];
}

export const SpreadsheetHeader = observer((props: Props) => {
  const { displayProperties, spreadsheetColumnsList } = props;
  // router

  return (
    <thead className="sticky top-0 left-0 z-[12] border-b-[0.5px] border-custom-border-100">
      <tr>
        <th
          className="group/list-header sticky left-0 z-[15] h-11 w-[28rem] flex items-center gap-1 bg-custom-background-90 text-sm font-medium before:absolute before:h-full before:right-0 before:border-[0.5px] before:border-custom-border-100 pl-2"
          tabIndex={-1}
        >
          <span className="flex h-full w-full flex-grow items-center pl-6 py-2.5">Work items</span>
        </th>

        {spreadsheetColumnsList.map((property) => (
          <SpreadsheetHeaderColumn key={property} property={property} displayProperties={displayProperties} />
        ))}
      </tr>
    </thead>
  );
});
