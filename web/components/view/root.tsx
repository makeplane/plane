import { FC, Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
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
} from "./";
// ui
import { Loader } from "@plane/ui";
// constants
import {
  ELocalViews,
  EViewLayouts,
  EViewPageType,
  TViewCRUD,
  viewDefaultFilterParametersByViewTypeAndLayout,
} from "constants/view";
// types
import { TViewOperations } from "./types";
import { TViewTypes } from "@plane/types";

type TGlobalViewRoot = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  viewPageType: EViewPageType;
  baseRoute: string;
};

type TViewOperationsToggle = {
  type: "DUPLICATE" | "DELETE" | undefined;
  viewId: string | undefined;
};

export const GlobalViewRoot: FC<TGlobalViewRoot> = observer((props) => {
  // router
  const router = useRouter();
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

  const viewOperations: TViewOperations = useMemo(
    () => ({
      localViewCreateEdit: (viewId: string | undefined, status: TViewCRUD) => {
        viewStore?.localViewHandler(viewId, status);
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
      create: async () => {
        try {
          await viewStore?.create();
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
      remove: async (viewId: string) => {
        try {
          await viewStore?.remove(viewId);
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
      duplicate: async (viewId: string) => {
        try {
          await viewStore?.duplicate(viewId);
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
    }),
    [viewStore, viewDetailStore, handleViewOperationsToggle, setToastAlert, workspaceSlug, projectId]
  );

  const applyFIltersFromRouter = () => {
    if (workspaceSlug && viewId && Object.values(ELocalViews).includes(viewId as ELocalViews)) {
      const routerQueryParams = { ...router.query };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { ["workspaceSlug"]: _workspaceSlug, ["viewId"]: _viewId, ...filters } = routerQueryParams;

      const acceptedFilters = viewDefaultFilterParametersByViewTypeAndLayout(
        viewPageType,
        EViewLayouts.SPREADSHEET,
        "filters"
      );

      Object.keys(filters).forEach((key) => {
        const filterKey: any = key;
        const filterValue = filters[key]?.toString() || undefined;
        if (filterKey && filterValue && acceptedFilters.includes(filterKey)) {
          const _filterValues = filterValue.split(",");
          _filterValues.forEach((element) => {
            console.log("filterKey", filterKey);
            console.log("element", element);
            viewDetailStore?.setFilters(filterKey, element);
          });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  };

  // fetch all views
  useEffect(() => {
    const fetchViews = async () => {
      await viewStore?.fetch(
        workspaceSlug,
        projectId,
        viewStore?.viewIds.length > 0 ? "view-mutation-loader" : "view-loader"
      );
    };
    if (workspaceSlug && viewType && viewStore) fetchViews();
  }, [workspaceSlug, projectId, viewType, viewStore]);

  // fetch view by id
  useEffect(() => {
    const fetchViewByViewId = async () => {
      await viewStore?.fetchById(workspaceSlug, projectId, viewId);
      // applyFIltersFromRouter();
    };
    if (workspaceSlug && viewId && viewType && viewStore) {
      fetchViewByViewId();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug, projectId, viewId, viewType, viewStore]);

  console.log("viewStore? -->", viewStore?.viewMapCEN?.id);

  return (
    <div className="relative w-full h-full">
      {viewStore?.loader && viewStore?.loader === "view-loader" ? (
        <Loader className="relative w-full flex items-center gap-2 pt-2 pb-1 px-5 border-b border-custom-border-300">
          <div>
            <Loader.Item height="30px" width="120px" />
            <div className="border-t-2 rounded-t border-custom-primary-100" />
          </div>
          <Loader.Item height="30px" width="120px" />
          <Loader.Item height="30px" width="120px" />
          <Loader.Item height="30px" width="120px" />
          <Loader.Item height="30px" width="120px" />
          <div className="ml-auto">
            <Loader.Item height="30px" width="120px" />
          </div>
        </Loader>
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

          {viewStore?.loader === "view-detail-loader" ? (
            <Loader className="relative w-full flex items-center gap-2 py-3 px-5 border-b border-custom-border-300">
              <div className="mr-auto relative flex items-center gap-2">
                <Loader.Item width="140px" height="30px" />
                <Loader.Item width="140px" height="30px" />
                <Loader.Item width="140px" height="30px" />
                <Loader.Item width="140px" height="30px" />
              </div>
              <Loader.Item width="30px" height="30px" />
              <Loader.Item width="30px" height="30px" />
              <Loader.Item width="30px" height="30px" />
              <Loader.Item width="120px" height="30px" />
            </Loader>
          ) : (
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
                  viewType={viewType}
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
          )}
        </>
      )}

      {/* create edit modal */}
      {viewStore?.viewMapCEN?.id && (
        <ViewCreateEditForm
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          viewId={viewStore?.viewMapCEN?.id}
          viewType={viewType}
          viewPageType={viewPageType}
          viewOperations={viewOperations}
          isLocalView={true}
        />
      )}

      {viewOperationsToggle.type && viewOperationsToggle.viewId && (
        <Fragment>
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
