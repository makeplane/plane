import { observer } from "mobx-react-lite";
import Image from "next/image";
import { useRouter } from "next/router";
// components
import { ListLayout } from "@/components/core/list";
import { EmptyState } from "@/components/empty-state";
import { ModuleCardItem, ModuleListItem, ModulePeekOverview, ModulesListGanttChartView } from "@/components/modules";
import { CycleModuleBoardLayout, CycleModuleListLayout, GanttLayoutLoader } from "@/components/ui";
// constants
import { EmptyStateType } from "@/constants/empty-state";
// hooks
import { useCommandPalette, useEventTracker, useModule, useModuleFilter } from "@/hooks/store";
import AllFiltersImage from "public/empty-state/module/all-filters.svg";
import NameFilterImage from "public/empty-state/module/name-filter.svg";

export const ModulesListView: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId, peekModule } = router.query;
  // store hooks
  const { toggleCreateModuleModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const { getProjectModuleIds, getFilteredModuleIds, loader } = useModule();
  const { currentProjectDisplayFilters: displayFilters, searchQuery } = useModuleFilter();
  // derived values
  const projectModuleIds = projectId ? getProjectModuleIds(projectId.toString()) : undefined;
  const filteredModuleIds = projectId ? getFilteredModuleIds(projectId.toString()) : undefined;

  if (loader || !projectModuleIds || !filteredModuleIds)
    return (
      <>
        {displayFilters?.layout === "list" && <CycleModuleListLayout />}
        {displayFilters?.layout === "board" && <CycleModuleBoardLayout />}
        {displayFilters?.layout === "gantt" && <GanttLayoutLoader />}
      </>
    );

  if (projectModuleIds.length === 0)
    return (
      <EmptyState
        type={EmptyStateType.PROJECT_MODULE}
        primaryButtonOnClick={() => {
          setTrackElement("Module empty state");
          toggleCreateModuleModal(true);
        }}
      />
    );

  if (filteredModuleIds.length === 0)
    return (
      <div className="grid h-full w-full place-items-center">
        <div className="text-center">
          <Image
            src={searchQuery.trim() === "" ? AllFiltersImage : NameFilterImage}
            className="mx-auto h-36 w-36 sm:h-48 sm:w-48"
            alt="No matching modules"
          />
          <h5 className="mb-1 mt-7 text-xl font-medium">No matching modules</h5>
          <p className="text-base text-custom-text-400">
            {searchQuery.trim() === ""
              ? "Remove the filters to see all modules"
              : "Remove the search criteria to see all modules"}
          </p>
        </div>
      </div>
    );

  return (
    <>
      {displayFilters?.layout === "list" && (
        <div className="h-full overflow-y-auto">
          <div className="flex h-full w-full justify-between">
            <ListLayout>
              {filteredModuleIds.map((moduleId) => (
                <ModuleListItem key={moduleId} moduleId={moduleId} />
              ))}
            </ListLayout>
            <ModulePeekOverview
              projectId={projectId?.toString() ?? ""}
              workspaceSlug={workspaceSlug?.toString() ?? ""}
            />
          </div>
        </div>
      )}
      {displayFilters?.layout === "board" && (
        <div className="h-full w-full">
          <div className="flex h-full w-full justify-between">
            <div
              className={`grid h-full w-full grid-cols-1 gap-6 overflow-y-auto p-8 ${
                peekModule
                  ? "lg:grid-cols-1 xl:grid-cols-2 3xl:grid-cols-3"
                  : "lg:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4"
              } auto-rows-max transition-all vertical-scrollbar scrollbar-lg`}
            >
              {filteredModuleIds.map((moduleId) => (
                <ModuleCardItem key={moduleId} moduleId={moduleId} />
              ))}
            </div>
            <ModulePeekOverview
              projectId={projectId?.toString() ?? ""}
              workspaceSlug={workspaceSlug?.toString() ?? ""}
            />
          </div>
        </div>
      )}
      {displayFilters?.layout === "gantt" && <ModulesListGanttChartView />}
    </>
  );
});
