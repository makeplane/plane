import React, { useRef } from "react";
import { observer } from "mobx-react";
// plane imports
import { SPREADSHEET_SELECT_GROUP } from "@plane/constants";
// components
import { LogoSpinner } from "@/components/common/logo-spinner";
import { MultipleSelectGroup } from "@/components/core/multiple-select";
// plane web imports
import { SPREADSHEET_PROPERTY_LIST } from "@/plane-web/constants/project/spreadsheet";
import { useBulkOperationStatus } from "@/plane-web/hooks/use-bulk-operation-status";
// types
import type { TProject } from "@/plane-web/types/projects";
import type { TProjectDisplayFilters } from "@/plane-web/types/workspace-project-filters";
// local components
import { SpreadsheetTable } from "./spreadsheet-table";

type Props = {
  displayFilters: TProjectDisplayFilters;
  handleDisplayFilterUpdate: (data: Partial<TProjectDisplayFilters>) => void;
  projectIds: string[] | undefined;
  updateProject: ((projectId: string | null, data: Partial<TProject>) => Promise<TProject>) | undefined;
  canEditProperties: (projectId: string | undefined) => boolean;
};

export const SpreadsheetView: React.FC<Props> = observer((props) => {
  const { displayFilters, handleDisplayFilterUpdate, projectIds, updateProject, canEditProperties } = props;
  // refs
  const containerRef = useRef<HTMLTableElement | null>(null);
  const portalRef = useRef<HTMLDivElement | null>(null);
  // plane web hooks
  const isBulkOperationsEnabled = useBulkOperationStatus();

  if (!projectIds || projectIds.length === 0)
    return (
      <div className="grid h-full w-full place-items-center">
        <LogoSpinner />
      </div>
    );
  return (
    <div className="relative flex h-full w-full flex-col overflow-x-hidden whitespace-nowrap rounded-lg bg-custom-background-200 text-custom-text-200">
      <div ref={portalRef} className="spreadsheet-menu-portal" />
      <MultipleSelectGroup
        containerRef={containerRef}
        entities={{
          [SPREADSHEET_SELECT_GROUP]: projectIds,
        }}
        disabled={!isBulkOperationsEnabled}
      >
        {(helpers) => (
          <>
            <div ref={containerRef} className="vertical-scrollbar horizontal-scrollbar scrollbar-lg h-full w-full">
              <SpreadsheetTable
                displayFilters={displayFilters}
                handleDisplayFilterUpdate={handleDisplayFilterUpdate}
                projectIds={projectIds}
                portalElement={portalRef}
                updateProject={updateProject}
                canEditProperties={canEditProperties}
                containerRef={containerRef}
                spreadsheetColumnsList={SPREADSHEET_PROPERTY_LIST}
                selectionHelpers={helpers}
              />
            </div>
          </>
        )}
      </MultipleSelectGroup>
    </div>
  );
});
