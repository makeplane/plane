/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// constants
import { SPREADSHEET_SELECT_GROUP } from "@plane/constants";
// ui
import type { IIssueDisplayFilterOptions, IIssueDisplayProperties } from "@plane/types";
// components
import { cn } from "@plane/utils";
import { MultipleSelectGroupAction } from "@/components/core/multiple-select";
import { SpreadsheetColumnsToggle } from "@/components/issues/spreadsheet-columns-toggle";
// hooks
import type { TSelectionHelper } from "@/hooks/use-multiple-select";
import { SpreadsheetHeaderColumn } from "./spreadsheet-header-column";

interface Props {
  displayProperties: IIssueDisplayProperties;
  displayFilters: IIssueDisplayFilterOptions;
  handleDisplayFilterUpdate: (data: Partial<IIssueDisplayFilterOptions>) => void;
  handleDisplayPropertiesUpdate?: (data: Partial<IIssueDisplayProperties>) => void;
  canEditProperties: (projectId: string | undefined) => boolean;
  isEstimateEnabled: boolean;
  spreadsheetColumnsList: (keyof IIssueDisplayProperties)[];
  selectionHelpers: TSelectionHelper;
  isEpic?: boolean;
}

export const SpreadsheetHeader = observer(function SpreadsheetHeader(props: Props) {
  const {
    displayProperties,
    displayFilters,
    handleDisplayFilterUpdate,
    handleDisplayPropertiesUpdate,
    canEditProperties,
    isEstimateEnabled,
    spreadsheetColumnsList,
    selectionHelpers,
    isEpic = false,
  } = props;
  // router
  const { projectId } = useParams();
  // derived values
  const isGroupSelectionEmpty = selectionHelpers.isGroupSelected(SPREADSHEET_SELECT_GROUP) === "empty";
  // auth
  const canSelectIssues = canEditProperties(projectId?.toString()) && !selectionHelpers.isSelectionDisabled;

  return (
    <thead className="sticky top-0 left-0 z-[12]">
      <tr>
        {/* Single header column containing both identifier and workitem */}
        <th
          className="group/list-header relative left-0 z-[15] h-11 min-w-60 border-r-[0.5px] border-b-[0.5px] border-subtle bg-layer-1 text-body-xs-medium nth-last-2:border-r-0 md:sticky"
          tabIndex={-1}
        >
          <div className="flex h-full w-full items-center gap-2 px-page-x">
            {/* Workitem header section */}
            <div className="flex h-full min-w-80 flex-grow items-center gap-1 py-2.5">
              {canSelectIssues && (
                <div className="absolute left-0.5 flex w-4 flex-shrink-0 items-center">
                  <MultipleSelectGroupAction
                    className={cn(
                      "pointer-events-none size-3.5 opacity-0 !outline-none group-hover/list-header:pointer-events-auto group-hover/list-header:opacity-100",
                      {
                        "pointer-events-auto opacity-100": !isGroupSelectionEmpty,
                      }
                    )}
                    groupID={SPREADSHEET_SELECT_GROUP}
                    selectionHelpers={selectionHelpers}
                  />
                </div>
              )}
              <span className="text-body-xs-medium">{`${isEpic ? "Epics" : "Work items"}`}</span>
            </div>
          </div>
        </th>

        {spreadsheetColumnsList.map((property) => (
          <SpreadsheetHeaderColumn
            key={property}
            property={property}
            displayProperties={displayProperties}
            displayFilters={displayFilters}
            handleDisplayFilterUpdate={handleDisplayFilterUpdate}
            isEstimateEnabled={isEstimateEnabled}
            isEpic={isEpic}
          />
        ))}

        {/* Config column header, pinned to the right edge */}
        <th className="right-0 z-15 h-11 w-12 min-w-12 border-b-[0.5px] border-l-[0.5px] border-subtle bg-layer-1 shadow-direction-left md:sticky">
          <div className="flex size-full items-center justify-center">
            {handleDisplayPropertiesUpdate && (
              <SpreadsheetColumnsToggle
                columns={spreadsheetColumnsList}
                displayProperties={displayProperties}
                handleDisplayPropertiesUpdate={handleDisplayPropertiesUpdate}
                isEstimateEnabled={isEstimateEnabled}
                isEpic={isEpic}
              />
            )}
          </div>
        </th>
      </tr>
    </thead>
  );
});
