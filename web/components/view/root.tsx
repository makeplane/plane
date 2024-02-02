import { FC, ReactNode, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useView } from "hooks/store/use-view";
// components
import { ViewRoot, ViewCreateEdit, ViewFiltersRoot, ViewAppliedFiltersRoot } from "./";
// types
import { TViewOperations } from "./types";
import { TViewTypes } from "@plane/types";

type TWorkspaceViewRoot = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string | undefined;
  viewType: TViewTypes;
};

export const WorkspaceViewRoot: FC<TWorkspaceViewRoot> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType } = props;
  // hooks
  const views = useView(workspaceSlug, projectId, viewType);

  const viewOperations: TViewOperations = useMemo(
    () => ({
      create: async (data) => {
        await views?.create(data);
      },
      fetch: async () => {
        await views?.fetch();
      },
    }),
    [views]
  );

  useEffect(() => {
    if (workspaceSlug && viewId && viewOperations) viewOperations.fetch();
  }, [workspaceSlug, viewId, viewOperations]);

  console.log("views?.viewMap", Object.keys(views?.viewMap).length);

  Object.keys(views?.viewMap).map((viewId) => {
    console.log(views?.viewMap?.[viewId]?.access);
  });

  return (
    <div className="relative w-full h-full border border-red-500">
      <ViewCreateEdit
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        viewId={viewId}
        viewType={viewType}
        viewOperations={viewOperations}
      />

      {/* <ViewRoot
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        viewId={viewId}
        viewType={viewType}
        viewOperations={viewOperations}
      /> */}

      {/* <ViewFiltersRoot
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        viewId={"61d6b507-ae5c-45d6-b169-da7162f016a0"}
        viewOperations={viewOperations}
      />
      <ViewAppliedFiltersRoot
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        viewId={"61d6b507-ae5c-45d6-b169-da7162f016a0"}
        viewOperations={viewOperations}
      /> */}
    </div>
  );
});
