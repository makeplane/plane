import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { IIssueDisplayFilterOptions, IIssueDisplayProperties } from "@plane/types";
// components
import { Row } from "@plane/ui";
import { MultipleSelectGroupAction } from "@/components/core";
import { SpreadsheetHeaderColumn } from "@/components/issues/issue-layouts";
// constants
import { SPREADSHEET_SELECT_GROUP } from "@/constants/spreadsheet";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { TSelectionHelper } from "@/hooks/use-multiple-select";

interface Props {
  displayProperties: IIssueDisplayProperties;
  displayFilters: IIssueDisplayFilterOptions;
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  canEditProperties: (projectId: string | undefined) => boolean;
  isEstimateEnabled: boolean;
  spreadsheetColumnsList: (keyof IIssueDisplayProperties)[];
  selectionHelpers: TSelectionHelper;
}

export const SpreadsheetHeader = observer((props: Props) => {
  const {
    displayProperties,
    displayFilters,
    handleDisplayFilterUpdate,
    canEditProperties,
    isEstimateEnabled,
    spreadsheetColumnsList,
    selectionHelpers,
  } = props;
  // router
  const { projectId } = useParams();
  // derived values
  const isGroupSelectionEmpty = selectionHelpers.isGroupSelected(SPREADSHEET_SELECT_GROUP) === "empty";
  // auth
  const canSelectIssues = canEditProperties(projectId?.toString()) && !selectionHelpers.isSelectionDisabled;

  return (
    <thead className="sticky top-0 left-0 z-[12] border-b-[0.5px] border-custom-border-100">
      <tr>
        <th
          className="group/list-header sticky left-0 z-[15] h-11 w-[28rem] flex items-center gap-1 bg-custom-background-90 text-sm font-medium before:absolute before:h-full before:right-0 before:border-custom-border-100"
          tabIndex={-1}
        >
          <Row>
            {canSelectIssues && (
              <div className="flex-shrink-0 flex items-center w-3.5 mr-1 absolute left-1 py-[11px]">
                <MultipleSelectGroupAction
                  className={cn(
                    "size-3.5 opacity-0 pointer-events-none group-hover/list-header:opacity-100 group-hover/list-header:pointer-events-auto !outline-none",
                    {
                      "opacity-100 pointer-events-auto": !isGroupSelectionEmpty,
                    }
                  )}
                  groupID={SPREADSHEET_SELECT_GROUP}
                  selectionHelpers={selectionHelpers}
                />
              </div>
            )}
            <span className="flex h-full w-full flex-grow items-center py-2.5">Issues</span>
          </Row>
        </th>

        {spreadsheetColumnsList.map((property) => (
          <SpreadsheetHeaderColumn
            key={property}
            property={property}
            displayProperties={displayProperties}
            displayFilters={displayFilters}
            handleDisplayFilterUpdate={handleDisplayFilterUpdate}
            isEstimateEnabled={isEstimateEnabled}
          />
        ))}
      </tr>
    </thead>
  );
});
