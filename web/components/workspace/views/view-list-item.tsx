import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { observer } from "mobx-react-lite";
import { Pencil, Trash2 } from "lucide-react";
// store hooks
import { useGlobalView } from "hooks/store";
// components
import { CreateUpdateWorkspaceViewModal, DeleteGlobalViewModal } from "components/workspace";
// ui
import { CustomMenu, PhotoFilterIcon } from "@plane/ui";
// helpers
import { truncateText } from "helpers/string.helper";
import { calculateTotalFilters } from "helpers/filter.helper";

type Props = { viewId: string };

export const GlobalViewListItem: React.FC<Props> = observer((props) => {
  const { viewId } = props;
  // states
  const [updateViewModal, setUpdateViewModal] = useState(false);
  const [deleteViewModal, setDeleteViewModal] = useState(false);
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const { getViewDetailsById } = useGlobalView();
  // derived data
  const view = getViewDetailsById(viewId);

  if (!view) return null;

  const totalFilters = calculateTotalFilters(view.filters ?? {});

  return (
    <>
      <CreateUpdateWorkspaceViewModal data={view} isOpen={updateViewModal} onClose={() => setUpdateViewModal(false)} />
      <DeleteGlobalViewModal data={view} isOpen={deleteViewModal} onClose={() => setDeleteViewModal(false)} />
      <div className="group border-b border-custom-border-200 hover:bg-custom-background-90">
        <Link href={`/${workspaceSlug}/workspace-views/${view.id}`}>
          <div className="relative flex w-full items-center justify-between rounded p-4">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-10 w-10 place-items-center rounded bg-custom-background-90 group-hover:bg-custom-background-100">
                  <PhotoFilterIcon className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col">
                  <p className="truncate text-sm font-medium leading-4">{truncateText(view.name, 75)}</p>
                  {view?.description && <p className="text-xs text-custom-text-200">{view.description}</p>}
                </div>
              </div>
              <div className="ml-2 flex flex-shrink-0">
                <div className="flex items-center gap-4">
                  <p className="hidden rounded bg-custom-background-80 px-2 py-1 text-xs text-custom-text-200 group-hover:block">
                    {totalFilters} {totalFilters === 1 ? "filter" : "filters"}
                  </p>
                  <CustomMenu ellipsis>
                    <CustomMenu.MenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setUpdateViewModal(true);
                      }}
                    >
                      <span className="flex items-center justify-start gap-2">
                        <Pencil size={14} strokeWidth={2} />
                        <span>Edit View</span>
                      </span>
                    </CustomMenu.MenuItem>
                    <CustomMenu.MenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteViewModal(true);
                      }}
                    >
                      <span className="flex items-center justify-start gap-2">
                        <Trash2 size={14} strokeWidth={2} />
                        <span>Delete View</span>
                      </span>
                    </CustomMenu.MenuItem>
                  </CustomMenu>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </>
  );
});
