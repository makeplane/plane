import { FC, Fragment } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
// hooks
import { useViewDetail } from "hooks/store";
// ui
import { PhotoFilterIcon, Tooltip } from "@plane/ui";
// types
import { TViewTypes } from "@plane/types";

type TViewItem = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  viewItemId: string;
  baseRoute: string;
};

export const ViewItem: FC<TViewItem> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, viewItemId, baseRoute } = props;
  // hooks
  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewItemId, viewType);

  if (!viewDetailStore) return <></>;
  return (
    <div className="space-y-0.5 relative h-full flex flex-col justify-between">
      <Tooltip tooltipContent={viewDetailStore?.name} position="top">
        <Link
          href={`${baseRoute}/${viewItemId}`}
          className={`cursor-pointer relative p-2 px-2.5 flex justify-center items-center gap-1.5 rounded transition-all hover:bg-custom-background-80
        ${viewItemId === viewId ? `text-custom-primary-100 bg-custom-primary-100/10` : `border-transparent`}
      `}
          onClick={(e) => viewItemId === viewId && e.preventDefault()}
        >
          <div className={`flex-shrink-0 rounded-sm relative w-3 h-3 flex justify-center items-center overflow-hidden`}>
            <PhotoFilterIcon className="w-3 h-3" />
          </div>
          <div className="w-full max-w-[80px] inline-block text-sm line-clamp-1 truncate overflow-hidden font-medium">
            {viewDetailStore?.name}
          </div>
        </Link>
      </Tooltip>
      <div
        className={`border-b-2 rounded-t-sm ${
          viewItemId === viewId ? `border-custom-primary-100` : `border-transparent`
        }`}
      />
    </div>
  );
});
