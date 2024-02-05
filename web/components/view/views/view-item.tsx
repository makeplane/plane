import { FC } from "react";
import Link from "next/link";
import { observer } from "mobx-react-lite";
// hooks
import { useView } from "hooks/store";
// ui
import { PhotoFilterIcon } from "@plane/ui";
// types
import { TViewTypes } from "@plane/types";

type TViewItem = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string | undefined;
  viewType: TViewTypes;
  viewItemId: string;
};

export const ViewItem: FC<TViewItem> = observer((props) => {
  const { workspaceSlug, projectId, viewId, viewType, viewItemId } = props;
  // hooks
  const viewStore = useView(workspaceSlug, projectId, viewType);

  const view = viewStore?.viewById(viewItemId);

  if (!view) return <></>;
  return (
    <div key={viewItemId} className="space-y-0.5 relative h-full flex flex-col justify-between">
      <Link
        href={`/${workspaceSlug}/workspace-views/${viewItemId}`}
        className={`cursor-pointer relative p-2 px-2.5 flex justify-center items-center gap-1.5 rounded transition-all hover:bg-custom-background-80
        ${viewItemId === viewId ? `text-custom-primary-100 bg-custom-primary-100/10` : `border-transparent`}
      `}
        onClick={(e) => viewItemId === viewId && e.preventDefault()}
      >
        <div className="flex-shrink-0 bg-custom-background-80 rounded-sm relative w-5 h-5 flex justify-center items-center overflow-hidden">
          <PhotoFilterIcon className="w-3 h-3" />
        </div>
        <div className="w-full max-w-[80px] inline-block text-sm line-clamp-1 truncate overflow-hidden font-medium">
          {view?.name}
        </div>
      </Link>
      <div className={`border-b-2 ${viewItemId === viewId ? `border-custom-primary-100` : `border-transparent`}`} />
    </div>
  );
});
