import { FC, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { CheckCircle } from "lucide-react";
// hooks
import { useView, useViewDetail } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { ViewRoot, ViewCreateEdit, ViewFiltersRoot, ViewAppliedFiltersRoot, ViewLayoutRoot } from ".";
// ui
import { Spinner } from "@plane/ui";
// constants
import { VIEW_TYPES } from "constants/view";
// types
import { TViewOperations } from "./types";
import { TView, TViewFilters, TViewDisplayFilters, TViewDisplayProperties } from "@plane/types";

type TAllIssuesViewRoot = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
};

export const AllIssuesViewRoot: FC<TAllIssuesViewRoot> = observer((props) => {
  const { workspaceSlug, projectId, viewId } = props;
  // states
  const [viewType, setViewType] = useState(VIEW_TYPES.WORKSPACE_VIEWS);
  const workspaceViewTabOptions = [
    {
      key: VIEW_TYPES.WORKSPACE_YOUR_VIEWS,
      title: "Your views",
      onClick: () => VIEW_TYPES.WORKSPACE_YOUR_VIEWS != viewType && setViewType(VIEW_TYPES.WORKSPACE_YOUR_VIEWS),
    },
    {
      key: VIEW_TYPES.WORKSPACE_VIEWS,
      title: "Workspace Views",
      onClick: () => VIEW_TYPES.WORKSPACE_VIEWS != viewType && setViewType(VIEW_TYPES.WORKSPACE_VIEWS),
    },
  ];
  // hooks
  const viewStore = useView(workspaceSlug, projectId, viewType);
  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewId, viewType);
  const { setToastAlert } = useToast();

  const viewOperations: TViewOperations = useMemo(
    () => ({
      localViewCreate: (data) => viewStore?.localViewCreate(data),
      clearLocalView: (viewId: string) => viewStore?.clearLocalView(viewId),
      setFilters: (filters: Partial<TViewFilters>) => viewDetailStore?.setFilters(filters),
      setDisplayFilters: (display_filters: Partial<TViewDisplayFilters>) =>
        viewDetailStore?.setDisplayFilters(display_filters),
      setDisplayProperties: (display_properties: Partial<TViewDisplayProperties>) =>
        viewDetailStore?.setDisplayProperties(display_properties),
      fetch: async () => await viewStore?.fetch(),
      create: async (data: Partial<TView>) => {
        try {
          await viewStore?.create(data);
          if (data.id) viewOperations.clearLocalView(data.id);
        } catch {
          setToastAlert({ title: "Error", message: "Error creating view", type: "error" });
        }
      },
    }),
    [viewStore, viewDetailStore, setToastAlert]
  );

  useEffect(() => {
    if (workspaceSlug && viewId && viewType && viewStore)
      viewStore?.fetch(viewStore?.viewIds.length > 0 ? "mutation-loader" : "init-loader");
  }, [workspaceSlug, viewId, viewType, viewStore]);

  return (
    <div className="relative w-full h-full">
      <div className="relative flex justify-between items-center gap-2 px-5 py-4">
        <div className="relative flex items-center gap-2">
          <div className="flex-shrink-0 w-6 h-6 rounded relative flex justify-center items-center bg-custom-background-80">
            <CheckCircle size={12} />
          </div>
          <div className="font-medium">All Issues</div>
        </div>
        <div className="relative inline-flex items-center rounded border border-custom-border-300 bg-custom-background-80">
          {workspaceViewTabOptions.map((tab) => (
            <div
              key={tab.key}
              className={`p-4 py-1.5 rounded text-sm transition-all cursor-pointer font-medium
                ${
                  viewType === tab.key
                    ? "text-custom-text-100 bg-custom-background-90"
                    : "text-custom-text-200 bg-custom-background-80 hover:text-custom-text-100"
                }`}
              onClick={tab.onClick}
            >
              {tab.title}
            </div>
          ))}
        </div>
      </div>

      {viewStore?.loader && viewStore?.loader === "init-loader" ? (
        <div className="relative w-full h-full flex justify-center items-center">
          <Spinner />
        </div>
      ) : (
        <>
          <ViewRoot
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            viewId={viewId}
            viewType={viewType}
            viewOperations={viewOperations}
          />

          {/* <ViewFiltersRoot
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            viewId={viewId}
            viewOperations={viewOperations}
          /> */}

          <div className="p-5 border-b border-custom-border-200 relative flex gap-2">
            <div className="w-full">
              <ViewAppliedFiltersRoot
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                viewId={viewId}
                viewType={viewType}
                viewOperations={viewOperations}
              />
            </div>

            <div className="flex-shrink-0 h-full">
              <ViewLayoutRoot
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                viewId={viewId}
                viewType={viewType}
                viewOperations={viewOperations}
              />
            </div>

            <div className="flex-shrink-0 relative w-7 h-7 overflow-hidden border border-red-500 rounded flex justify-center items-center">
              Filters
            </div>

            <div className="flex-shrink-0 relative w-7 h-7 overflow-hidden border border-red-500 rounded flex justify-center items-center">
              Display Filters
            </div>

            {!viewDetailStore?.is_local_view && (
              <div className="flex-shrink-0 h-full">
                <ViewCreateEdit
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  viewId={viewId}
                  viewType={viewType}
                  viewOperations={viewOperations}
                >
                  <div>Edit</div>
                </ViewCreateEdit>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
});
