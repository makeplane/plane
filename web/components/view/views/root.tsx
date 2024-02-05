import { FC } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useView } from "hooks/store";
// components
import { ViewItem, ViewCreateEdit } from "../";
// types
import { TViewOperations } from "../types";
import { TViewTypes } from "@plane/types";

type TViewRoot = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string | undefined;
  viewType: TViewTypes;
  viewOperations: TViewOperations;
};

export const ViewRoot: FC<TViewRoot> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, viewOperations } = props;
  // hooks
  const viewStore = useView(workspaceSlug, projectId, viewType);

  return (
    <div className="border-b border-custom-border-100 relative flex px-5 gap-2">
      {viewStore?.viewIds && viewStore?.viewIds.length > 0 && (
        <div key={`views_list_${viewId}`} className="relative flex items-center w-full overflow-x-auto">
          {viewStore?.viewIds.map((_viewId) => (
            <ViewItem
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              viewId={viewId}
              viewType={viewType}
              viewItemId={_viewId}
            />
          ))}
        </div>
      )}

      <div className="flex-shrink-0 my-auto pb-1">
        <ViewCreateEdit
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          viewId={undefined}
          viewType={viewType}
          viewOperations={viewOperations}
        />
      </div>
    </div>
  );
});
