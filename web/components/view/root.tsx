import { FC, Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { v4 as uuidV4 } from "uuid";
import cloneDeep from "lodash/cloneDeep";
// hooks
import { useView, useViewDetail } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import {
  ViewRoot,
  ViewCreateEditForm,
  ViewEditDropdown,
  ViewLayoutRoot,
  ViewFiltersDropdown,
  ViewFiltersEditDropdown,
  ViewDisplayFiltersDropdown,
  ViewAppliedFiltersRoot,
  ViewDuplicateConfirmationModal,
  ViewDeleteConfirmationModal,
} from ".";
// ui
import { Spinner } from "@plane/ui";
// constants
import { EViewPageType, viewLocalPayload } from "constants/view";
// types
import { TViewOperations } from "./types";
import { TView, TViewTypes } from "@plane/types";

type TGlobalViewRoot = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  viewPageType: EViewPageType;
  baseRoute: string;
};

type TViewOperationsToggle = {
  type: "CREATE" | "EDIT" | "DUPLICATE" | "DELETE" | undefined;
  viewId: string | undefined;
};

export const GlobalViewRoot: FC<TGlobalViewRoot> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, viewPageType, baseRoute } = props;
  // hooks
  const viewStore = useView(workspaceSlug, projectId, viewType);
  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewId, viewType);
  const { setToastAlert } = useToast();
  // states
  const [viewOperationsToggle, setViewOperationsToggle] = useState<TViewOperationsToggle>({
    type: undefined,
    viewId: undefined,
  });
  const handleViewOperationsToggle = useCallback(
    (type: TViewOperationsToggle["type"], viewId: string | undefined) => setViewOperationsToggle({ type, viewId }),
    []
  );
  // hooks
  const viewDetailCreateEditStore = useViewDetail(
    workspaceSlug,
    projectId,
    viewOperationsToggle?.viewId || viewId,
    viewType
  );

  const viewOperations: TViewOperations = useMemo(
    () => ({
      localViewCreateEdit: (viewId: string | undefined, currentView = undefined) => {
        if (viewId === undefined) {
          if (currentView !== undefined) {
            // creating new view
            const currentViewPayload = cloneDeep({ ...currentView, id: uuidV4() });
            handleViewOperationsToggle("CREATE", currentViewPayload.id);
            viewStore?.localViewCreate(workspaceSlug, projectId, currentViewPayload as TView);
          } else {
            // if current view is available, create a new view with the same data
            const viewPayload = viewLocalPayload;
            handleViewOperationsToggle("CREATE", viewPayload.id);
            viewStore?.localViewCreate(workspaceSlug, projectId, viewPayload as TView);
          }
        } else {
          handleViewOperationsToggle("EDIT", viewId);
          viewDetailCreateEditStore?.setIsEditable(true);
        }
      },
      localViewCreateEditClear: async (viewId: string | undefined) => {
        if (viewDetailCreateEditStore?.is_create && viewId) viewStore?.remove(workspaceSlug, projectId, viewId);
        if (viewDetailCreateEditStore?.is_editable && viewId) viewDetailCreateEditStore.resetChanges();
        handleViewOperationsToggle(undefined, undefined);
      },

      fetch: async () => {
        try {
          await viewStore?.fetch(workspaceSlug, projectId);
        } catch {
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "Something went wrong. Please try again later or contact the support team.",
          });
        }
      },
      create: async (data: Partial<TView>) => {
        try {
          await viewStore?.create(workspaceSlug, projectId, data);
          handleViewOperationsToggle(undefined, undefined);
          setToastAlert({
            type: "success",
            title: "Success!",
            message: "View created successfully.",
          });
        } catch {
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "Something went wrong. Please try again later or contact the support team.",
          });
        }
      },
      remove: async (viewId: string) => {
        try {
          await viewStore?.remove(workspaceSlug, projectId, viewId);
          handleViewOperationsToggle(undefined, undefined);
          setToastAlert({
            type: "success",
            title: "Success!",
            message: "View removed successfully.",
          });
        } catch {
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "Something went wrong. Please try again later or contact the support team.",
          });
        }
      },
      update: async () => {
        try {
          await viewDetailStore?.saveChanges();
          handleViewOperationsToggle(undefined, undefined);
          setToastAlert({
            type: "success",
            title: "Success!",
            message: "View updated successfully.",
          });
        } catch {
          setToastAlert({
            type: "error",
            title: "Error!",
            message: "Something went wrong. Please try again later or contact the support team.",
          });
        }
      },
    }),
    [
      workspaceSlug,
      projectId,
      viewStore,
      viewDetailStore,
      setToastAlert,
      viewDetailCreateEditStore,
      handleViewOperationsToggle,
    ]
  );

  // fetch all views
  useEffect(() => {
    const fetchViews = async () => {
      await viewStore?.fetch(
        workspaceSlug,
        projectId,
        viewStore?.viewIds.length > 0 ? "mutation-loader" : "init-loader"
      );
    };
    if (workspaceSlug && viewType && viewStore) fetchViews();
  }, [workspaceSlug, projectId, viewType, viewStore]);

  // fetch view by id
  useEffect(() => {
    const fetchViews = async () => {
      viewId && (await viewStore?.fetchById(workspaceSlug, projectId, viewId));
    };
    if (workspaceSlug && viewId && viewType && viewStore) fetchViews();
  }, [workspaceSlug, projectId, viewId, viewType, viewStore]);

  return (
    <div className="relative w-full h-full">
      {viewStore?.loader && viewStore?.loader === "init-loader" ? (
        <div className="relative w-full h-full flex justify-center items-center">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="border-b border-custom-border-200 pt-2">
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
                propertyVisibleCount={5}
              />
            </div>

            <div className="flex-shrink-0">
              <ViewLayoutRoot
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                viewId={viewId}
                viewType={viewType}
                viewPageType={viewPageType}
              />
            </div>

            <div className="flex-shrink-0">
              <ViewFiltersDropdown
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                viewId={viewId}
                viewType={viewType}
                viewPageType={viewPageType}
                displayDropdownText={false}
              />
            </div>

            <div className="flex-shrink-0">
              <ViewDisplayFiltersDropdown
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                viewId={viewId}
                viewType={viewType}
                viewPageType={viewPageType}
                displayDropdownText={false}
              />
            </div>

            <div className="flex-shrink-0">
              <ViewEditDropdown
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                viewId={viewId}
                viewOperations={viewOperations}
              />
            </div>

            <div className="flex-shrink-0">
              <ViewFiltersEditDropdown
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                viewId={viewId}
                viewType={viewType}
                viewOperations={viewOperations}
              />
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
              viewPageType={viewPageType}
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
