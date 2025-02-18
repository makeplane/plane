import { observer } from "mobx-react";
// ui

// constants
// hooks
import { TSelectionHelper } from "@/hooks/use-multiple-select";
import { IProjectDisplayProperties } from "@/plane-web/constants/project/spreadsheet";
import { TProjectDisplayFilters } from "@/plane-web/types/workspace-project-filters";
import { SpreadsheetHeaderColumn } from "./spreadsheet-header-column";

interface Props {
  displayFilters: TProjectDisplayFilters;
  handleDisplayFilterUpdate: (data: Partial<TProjectDisplayFilters>) => void;
  canEditProperties: (projectId: string | undefined) => boolean;
  spreadsheetColumnsList: (keyof IProjectDisplayProperties)[];
  selectionHelpers: TSelectionHelper;
}

export const SpreadsheetHeader = observer((props: Props) => {
  const { displayFilters, handleDisplayFilterUpdate, spreadsheetColumnsList } = props;

  return (
    <thead className="sticky top-0 left-0 z-[12] border-b-[0.5px] border-custom-border-100">
      <tr>
        <th
          className="group/list-header sticky left-0 z-[15] h-11 w-[28rem] flex items-center gap-1 bg-custom-background-90 text-sm font-medium before:absolute before:h-full before:right-0 before:border-[0.5px] before:border-custom-border-100 pl-4"
          tabIndex={-1}
        >
          <span className="flex h-full w-full flex-grow items-center py-2.5">Projects</span>
        </th>

        {spreadsheetColumnsList.map((property) => (
          <SpreadsheetHeaderColumn
            key={property}
            property={property}
            displayFilters={displayFilters}
            handleDisplayFilterUpdate={handleDisplayFilterUpdate}
          />
        ))}
      </tr>
    </thead>
  );
});
