import { useRef } from "react";
//types
import { observer } from "mobx-react";
import { IProjectDisplayProperties } from "@/plane-web/constants/project/spreadsheet";
import { TProjectDisplayFilters } from "@/plane-web/types/workspace-project-filters";
//components

import { HeaderColumn } from "./columns/header-column";

interface Props {
  property: keyof IProjectDisplayProperties;
  displayFilters: TProjectDisplayFilters;
  handleDisplayFilterUpdate: (data: Partial<TProjectDisplayFilters>) => void;
}
export const SpreadsheetHeaderColumn = observer((props: Props) => {
  const { displayFilters, property, handleDisplayFilterUpdate } = props;

  //hooks
  const tableHeaderCellRef = useRef<HTMLTableCellElement | null>(null);

  return (
    <th
      className="h-11 w-full min-w-40 max-w-80 items-center bg-custom-background-90 text-sm font-medium px-4 py-1 border border-b-0 border-t-0 border-custom-border-100"
      ref={tableHeaderCellRef}
      tabIndex={0}
    >
      <HeaderColumn
        displayFilters={displayFilters}
        handleDisplayFilterUpdate={handleDisplayFilterUpdate}
        property={property}
        onClose={() => {
          tableHeaderCellRef?.current?.focus();
        }}
      />
    </th>
  );
});
