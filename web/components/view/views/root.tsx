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
  viewId: string;
  viewType: TViewTypes;
  viewOperations: TViewOperations;
  baseRoute: string;
};

export const ViewRoot: FC<TViewRoot> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, viewOperations, baseRoute } = props;
  // hooks
  const viewStore = useView(workspaceSlug, projectId, viewType);
  // state
  const [itemsToRenderViewsCount, setItemsToRenderViewCount] = useState<number>(0);

  useEffect(() => {
    const handleViewTabsVisibility = () => {
      const tabContainer = document.getElementById("tab-container");
      const tabItemViewMore = document.getElementById("tab-item-view-more");
      const itemWidth = 128;
      if (!tabContainer || !tabItemViewMore) return;

      const containerWidth = tabContainer.clientWidth;
      const itemViewMoreLeftOffset = tabItemViewMore.offsetLeft + (tabItemViewMore.clientWidth + 10);
      const itemViewMoreRightOffset = containerWidth - itemViewMoreLeftOffset;

      if (itemViewMoreLeftOffset > containerWidth) {
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

  const viewIds = viewStore?.viewIds?.slice(0, itemsToRenderViewsCount || viewStore?.viewIds.length) || [];

  if (!viewIds.includes(viewId)) {
    viewIds.pop();
    viewIds.push(viewId);
  }

  return (
    <div className="relative flex justify-between px-5 gap-2">
      <div className="w-full">
        {viewStore?.viewIds && viewStore?.viewIds.length > 0 && (
          <div id="tab-container" className="relative flex items-center w-full overflow-hidden">
            {viewIds.map((_viewId) => (
              <Fragment key={_viewId}>
                <ViewItem
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  viewId={viewId}
                  viewType={viewType}
                  viewItemId={_viewId}
                  baseRoute={baseRoute}
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
                  baseRoute={baseRoute}
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
      </div>

      <div className="flex-shrink-0 my-auto pb-1">
        <Button size="sm" prependIcon={<Plus />} onClick={() => viewOperations?.localViewCreateEdit(undefined)}>
          New View
        </Button>
      </div>
    </div>
  );
});
