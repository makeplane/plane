import { FC, Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { CheckCircle, ChevronDown, ChevronUp, Pencil } from "lucide-react";
// hooks
import { useView, useViewDetail } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import {
  ViewRoot,
  ViewCreateEditForm,
  ViewLayoutRoot,
  ViewFiltersDropdown,
  ViewDisplayFiltersDropdown,
  ViewAppliedFiltersRoot,
  ViewDuplicateConfirmationModal,
  ViewDeleteConfirmationModal,
} from ".";
// ui
import { Spinner } from "@plane/ui";
// constants
import { viewLocalPayload } from "constants/view";
// types
import { TViewOperations } from "./types";
import { TView, TViewFilters, TViewDisplayFilters, TViewDisplayProperties, TViewTypes } from "@plane/types";

type TAllIssuesViewRoot = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  baseRoute: string;
  workspaceViewTabOptions: { key: TViewTypes; title: string; href: string }[];
};

type TViewOperationsToggle = {
  type: "CREATE" | "EDIT" | "DUPLICATE" | "DELETE" | undefined;
  viewId: string | undefined;
};

export const AllIssuesViewRoot: FC<TAllIssuesViewRoot> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, baseRoute, workspaceViewTabOptions } = props;
  // hooks
  const viewStore = useView(workspaceSlug, projectId, viewType);
  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewId, viewType);
  const { setToastAlert } = useToast();
  // states
  const [viewOperationsToggle, setViewOperationsToggle] = useState<TViewOperationsToggle>({
    type: undefined,
    viewId: undefined,
  });
  const handleViewOperationsToggle = (type: TViewOperationsToggle["type"], viewId: string | undefined) =>
    setViewOperationsToggle({ type, viewId });

  const viewDetailCreateStore = useViewDetail(
    workspaceSlug,
    projectId,
    viewOperationsToggle?.viewId || viewId,
    viewType
  );

  const viewOperations: TViewOperations = useMemo(
    () => ({
      setName: (name: string) => viewDetailStore?.setName(name),
      setDescription: (name: string) => viewDetailStore?.setDescription(name),
      setFilters: (filterKey: keyof TViewFilters | undefined, filterValue: "clear_all" | string) => {
        if (viewOperationsToggle.type && ["CREATE", "EDIT"].includes(viewOperationsToggle.type))
          viewDetailCreateStore?.setFilters(filterKey, filterValue);
        else viewDetailStore?.setFilters(filterKey, filterValue);
      },
      setDisplayFilters: (display_filters: Partial<TViewDisplayFilters>) =>
        viewDetailStore?.setDisplayFilters(display_filters),
      setDisplayProperties: (displayPropertyKey: keyof TViewDisplayProperties) =>
        viewDetailStore?.setDisplayProperties(displayPropertyKey),
      localViewCreateEdit: (viewId: string | undefined) => {
        if (viewId === undefined) {
          const viewPayload = viewLocalPayload;
          handleViewOperationsToggle("CREATE", viewPayload.id);
          viewStore?.localViewCreate(viewPayload as TView);
        } else handleViewOperationsToggle("EDIT", viewId);
      },
      localViewCreateEditClear: async (viewId: string | undefined) => {
        if (viewId) viewStore?.remove(viewId);
        handleViewOperationsToggle(undefined, undefined);
      },
      fetch: async () => await viewStore?.fetch(),
      create: async (data: Partial<TView>) => {
        try {
          await viewStore?.create(data);
          handleViewOperationsToggle(undefined, undefined);
        } catch {
          setToastAlert({ title: "Error", message: "Error creating view", type: "error" });
        }
      },
      remove: async (viewId: string) => {
        try {
          await viewStore?.remove(viewId);
          handleViewOperationsToggle(undefined, undefined);
        } catch {
          setToastAlert({ title: "Error", message: "Error removing view", type: "error" });
        }
      },
      update: async () => {
        try {
          await viewDetailStore?.saveChanges();
          handleViewOperationsToggle(undefined, undefined);
        } catch {
          setToastAlert({ title: "Error", message: "Error updating view", type: "error" });
        }
      },
    }),
    [viewStore, viewDetailStore, setToastAlert, viewOperationsToggle, viewDetailCreateStore]
  );

  // fetch all issues
  useEffect(() => {
    const fetchViews = async () => {
      await viewStore?.fetch(viewStore?.viewIds.length > 0 ? "mutation-loader" : "init-loader");
    };
    if (workspaceSlug && viewType && viewStore) fetchViews();
  }, [workspaceSlug, projectId, viewType, viewStore]);

  // fetch view by id
  useEffect(() => {
    const fetchViews = async () => {
      viewId && (await viewStore?.fetchById(viewId));
    };
    if (workspaceSlug && viewId && viewType && viewStore) fetchViews();
  }, [workspaceSlug, projectId, viewId, viewType, viewStore]);

  return (
    <div className="relative w-full h-full">
      <div className="relative flex justify-between items-center gap-2 px-5 py-4">
        <div className="relative flex items-center gap-2">
          <div className="flex-shrink-0 w-6 h-6 rounded relative flex justify-center items-center bg-custom-background-80">
            <CheckCircle size={12} />
          </div>
          <div className="font-medium">All Issues</div>
        </div>
        <div className="relative inline-flex items-center rounded border border-custom-border-200 bg-custom-background-80">
          {workspaceViewTabOptions.map((tab) => (
            <Link
              key={tab.key}
              href={tab.href}
              className={`p-4 py-1.5 rounded text-sm transition-all cursor-pointer font-medium
                ${
                  viewType === tab.key
                    ? "text-custom-text-100 bg-custom-background-100"
                    : "text-custom-text-200 bg-custom-background-80 hover:text-custom-text-100"
                }`}
            >
              {tab.title}
            </Link>
          ))}
        </div>
      </div>

      {viewStore?.loader && viewStore?.loader === "init-loader" ? (
        <div className="relative w-full h-full flex justify-center items-center">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="border-b border-custom-border-200">
            <ViewRoot
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              viewId={viewId}
              viewType={viewType}
              viewOperations={viewOperations}
              baseRoute={baseRoute}
            />
          </div>

          <div className="p-5 py-2 border-b border-custom-border-200 relative flex items-start gap-1">
            <div className="w-full overflow-hidden">
              <ViewAppliedFiltersRoot
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                viewId={viewId}
                viewType={viewType}
                viewOperations={viewOperations}
                propertyVisibleCount={5}
              />
            </div>

            <div className="flex-shrink-0">
              <ViewLayoutRoot
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                viewId={viewId}
                viewType={viewType}
                viewOperations={viewOperations}
              />
            </div>

            <div className="flex-shrink-0">
              <ViewFiltersDropdown
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                viewId={viewId}
                viewType={viewType}
                viewOperations={viewOperations}
                displayDropdownText={true}
              />
            </div>

            <div className="flex-shrink-0">
              <ViewDisplayFiltersDropdown
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                viewId={viewId}
                viewType={viewType}
                viewOperations={viewOperations}
                displayDropdownText={true}
              />
            </div>

            <div className="relative flex items-center gap-1 rounded px-2 h-7 transition-all hover:bg-custom-background-80 cursor-pointer">
              <div className="w-4 h-4 relative flex justify-center items-center overflow-hidden">
                <Pencil size={12} />
              </div>
            </div>

            <div className=" relative flex items-center rounded h-7 transition-all cursor-pointer bg-custom-primary-100/20 text-custom-primary-100">
              <div className="text-sm px-3 font-medium h-full border-r border-white/50 flex justify-center items-center rounded-l transition-all hover:bg-custom-primary-100/30">
                Update
              </div>
              <div className="flex-shrink-0 px-1.5 hover:bg-custom-primary-100/30 h-full flex justify-center items-center rounded-r transition-all">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
        </>
      )}

      {/* create edit modal */}
      {viewOperationsToggle.type && viewOperationsToggle.viewId && (
        <Fragment>
          {["CREATE", "EDIT"].includes(viewOperationsToggle.type) && (
            <ViewCreateEditForm
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              viewId={viewOperationsToggle.viewId}
              viewType={viewType}
              viewOperations={viewOperations}
            />
          )}

          {["DUPLICATE"].includes(viewOperationsToggle.type) && (
            <ViewDuplicateConfirmationModal viewId={viewOperationsToggle.viewId} viewOperations={viewOperations} />
          )}

          {["DELETE"].includes(viewOperationsToggle.type) && (
            <ViewDeleteConfirmationModal viewId={viewOperationsToggle.viewId} viewOperations={viewOperations} />
          )}
        </Fragment>
      )}
    </div>
  );
});
