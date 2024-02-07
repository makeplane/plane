import { FC, Fragment, useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Plus } from "lucide-react";
// hooks
import { useView } from "hooks/store";
// components
import { ViewItem, ViewDropdown } from "../";
// ui
import { Button } from "@plane/ui";
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
  // state
  const [itemsToRenderViewsCount, setItemsToRenderViewCount] = useState<number>(0);

  useEffect(() => {
    const handleViewTabsVisibility = () => {
      const tabContainer = document.getElementById("tab-container");
      const tabItemViewMore = document.getElementById("tab-item-view-more");
      const itemWidth = 124;
      if (!tabContainer || !tabItemViewMore) return;

      const containerWidth = tabContainer.clientWidth;
      const itemViewMoreLeftOffset = tabItemViewMore.offsetLeft;
      const itemViewMoreRightOffset = containerWidth - itemViewMoreLeftOffset;

      if (itemViewMoreLeftOffset + (tabItemViewMore.clientWidth + 10) > containerWidth) {
        const itemsToRender = Math.floor(containerWidth / itemWidth);
        setItemsToRenderViewCount(itemsToRender);
      }
      if (itemViewMoreRightOffset > itemWidth + 10) {
        const itemsToRenderLeft = Math.floor(itemViewMoreLeftOffset / itemWidth) || 0;
        const itemsToRenderRight = Math.floor(itemViewMoreRightOffset / itemWidth) || 0;
        setItemsToRenderViewCount(itemsToRenderLeft + itemsToRenderRight);
      }
    };

    window.addEventListener("resize", () => handleViewTabsVisibility());
    handleViewTabsVisibility();

    return () => window.removeEventListener("resize", () => handleViewTabsVisibility());
  }, [viewStore?.viewIds]);

  return (
    <div className="relative flex justify-between px-5 gap-2">
      {viewStore?.viewIds && viewStore?.viewIds.length > 0 && (
        <div
          key={`views_list_${viewId}`}
          id="tab-container"
          className="relative flex items-center w-full overflow-hidden"
        >
          {viewStore?.viewIds?.slice(0, itemsToRenderViewsCount || viewStore?.viewIds.length).map((_viewId) => (
            <Fragment key={_viewId}>
              <ViewItem
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                viewId={viewId}
                viewType={viewType}
                viewItemId={_viewId}
              />
            </Fragment>
          ))}

          <div id="tab-item-view-more" className="min-w-[90px]">
            {viewStore?.viewIds.length <= (itemsToRenderViewsCount || viewStore?.viewIds.length) ? null : (
              <ViewDropdown
                workspaceSlug={workspaceSlug}
                projectId={projectId}
                viewId={viewId}
                viewType={viewType}
                viewOperations={viewOperations}
              >
                <div className="text-sm font-semibold mb-1 p-2 px-2.5 text-custom-text-200 cursor-pointer hover:bg-custom-background-80 whitespace-nowrap rounded relative flex items-center gap-1">
                  <span>
                    <Plus size={12} />
                  </span>
                  <span>
                    {viewStore?.viewIds.length - (itemsToRenderViewsCount || viewStore?.viewIds.length)} More...
                  </span>
                </div>
              </ViewDropdown>
            )}
          </div>
        </div>
      )}

      <div className="flex-shrink-0 my-auto pb-1">
        <Button size="sm" prependIcon={<Plus />} onClick={() => viewOperations?.localViewCreateEdit(undefined)}>
          New View
        </Button>
      </div>
    </div>
  );
});
