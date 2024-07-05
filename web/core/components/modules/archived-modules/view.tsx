import { FC } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
// components
import { ModuleListItem, ModulePeekOverview } from "@/components/modules";
// ui
import { CycleModuleListLayout } from "@/components/ui";
// hooks
import { useModule, useModuleFilter } from "@/hooks/store";
// assets
import AllFiltersImage from "@/public/empty-state/module/all-filters.svg";
import NameFilterImage from "@/public/empty-state/module/name-filter.svg";

export interface IArchivedModulesView {
  workspaceSlug: string;
  projectId: string;
}

export const ArchivedModulesView: FC<IArchivedModulesView> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { getFilteredArchivedModuleIds, loader } = useModule();
  const { archivedModulesSearchQuery } = useModuleFilter();
  // derived values
  const filteredArchivedModuleIds = getFilteredArchivedModuleIds(projectId);

  if (loader || !filteredArchivedModuleIds) return <CycleModuleListLayout />;

  if (filteredArchivedModuleIds.length === 0)
    return (
      <div className="h-full w-full grid place-items-center">
        <div className="text-center">
          <Image
            src={archivedModulesSearchQuery.trim() === "" ? AllFiltersImage : NameFilterImage}
            className="h-36 sm:h-48 w-36 sm:w-48 mx-auto"
            alt="No matching modules"
          />
          <h5 className="text-xl font-medium mt-7 mb-1">No matching modules</h5>
          <p className="text-custom-text-400 text-base">
            {archivedModulesSearchQuery.trim() === ""
              ? "Remove the filters to see all modules"
              : "Remove the search criteria to see all modules"}
          </p>
        </div>
      </div>
    );

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex h-full w-full justify-between">
        <div className="flex h-full w-full flex-col overflow-y-auto vertical-scrollbar scrollbar-lg">
          {filteredArchivedModuleIds.map((moduleId) => (
            <ModuleListItem key={moduleId} moduleId={moduleId} />
          ))}
        </div>
        <ModulePeekOverview
          projectId={projectId?.toString() ?? ""}
          workspaceSlug={workspaceSlug?.toString() ?? ""}
          isArchived
        />
      </div>
    </div>
  );
});
