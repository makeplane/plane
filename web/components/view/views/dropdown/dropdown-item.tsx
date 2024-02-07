import { FC } from "react";
import Link from "next/link";
import { Combobox } from "@headlessui/react";
import { GripVertical, MoreVertical } from "lucide-react";
// hooks
import { useViewDetail } from "hooks/store";
// ui
import { PhotoFilterIcon, Tooltip } from "@plane/ui";
// types
import { TViewTypes } from "@plane/types";

type TViewDropdownItem = {
  workspaceSlug: string;
  projectId: string | undefined;
  viewId: string;
  viewType: TViewTypes;
  currentViewId: string | undefined;
  searchQuery: string;
};

export const ViewDropdownItem: FC<TViewDropdownItem> = (props) => {
  const { workspaceSlug, projectId, viewId, viewType, currentViewId, searchQuery } = props;
  // hooks
  const viewDetailStore = useViewDetail(workspaceSlug, projectId, viewId, viewType);

  const isDragEnabled = false;
  const isEditable = !viewDetailStore?.is_local_view || false;

  if (!viewDetailStore) return <></>;
  if (!searchQuery || (searchQuery && viewDetailStore?.name?.toLowerCase().includes(searchQuery.toLowerCase())))
    return (
      <Combobox.Option
        value={undefined}
        className={`w-full px-1 pl-2 py-1.5 truncate flex items-center justify-between gap-1 rounded cursor-pointer select-none group
            ${currentViewId === viewDetailStore?.id ? `bg-custom-primary-100/10` : `hover:bg-custom-background-80`}
          `}
      >
        <Tooltip tooltipContent={viewDetailStore?.name} position="left">
          <div className="relative w-full flex items-center gap-1 overflow-hidden">
            {isDragEnabled && (
              <div className="flex-shrink-0 w-5 h-5 relative rounded flex justify-center items-center hover:bg-custom-background-100">
                <GripVertical className="w-3.5 h-3.5 text-custom-text-200 group-hover:text-custom-text-100" />
              </div>
            )}
            <Link
              href={`/${workspaceSlug}/workspace-views/${viewDetailStore?.id}`}
              className={`w-full h-full overflow-hidden relative flex items-center gap-1
                ${
                  currentViewId === viewDetailStore?.id
                    ? `text-custom-text-100`
                    : `text-custom-text-200 group-hover:text-custom-text-100`
                }
              `}
            >
              <div className="flex-shrink-0 w-5 h-5 relative flex justify-center items-center">
                <PhotoFilterIcon className="w-3 h-3 " />
              </div>

              <div className="w-full line-clamp-1 truncate overflow-hidden inline-block whitespace-nowrap text-sm font-medium">
                {viewDetailStore?.name}
              </div>
            </Link>
          </div>
        </Tooltip>

        {isEditable && (
          <div className="flex-shrink-0 w-5 h-5 relative rounded flex justify-center items-center hover:bg-custom-background-100">
            <MoreVertical className="h-3.5 w-3.5 flex-shrink-0" />
          </div>
        )}
      </Combobox.Option>
    );
  return <></>;
};
