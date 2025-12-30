import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// plane imports
import { EditIcon, TrashIcon } from "@plane/propel/icons";
import { CustomMenu } from "@plane/ui";
import { truncateText } from "@plane/utils";
// hooks
import { useGlobalView } from "@/hooks/store/use-global-view";
// local imports
import { DeleteGlobalViewModal } from "./delete-view-modal";
import { CreateUpdateWorkspaceViewModal } from "./modal";

type Props = { viewId: string };

export const GlobalViewListItem = observer(function GlobalViewListItem(props: Props) {
  const { viewId } = props;
  // states
  const [updateViewModal, setUpdateViewModal] = useState(false);
  const [deleteViewModal, setDeleteViewModal] = useState(false);
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { getViewDetailsById } = useGlobalView();
  // derived data
  const view = getViewDetailsById(viewId);

  if (!view) return null;

  return (
    <>
      <CreateUpdateWorkspaceViewModal data={view} isOpen={updateViewModal} onClose={() => setUpdateViewModal(false)} />
      <DeleteGlobalViewModal data={view} isOpen={deleteViewModal} onClose={() => setDeleteViewModal(false)} />
      <div className="group border-b border-subtle hover:bg-surface-2">
        <Link href={`/${workspaceSlug}/workspace-views/${view.id}`}>
          <div className="relative flex h-[52px] w-full items-center justify-between rounded-sm p-4">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <p className="truncate text-13 font-medium leading-4">{truncateText(view.name, 75)}</p>
                  {view?.description && <p className="text-11 text-secondary">{view.description}</p>}
                </div>
              </div>
              <div className="ml-2 flex flex-shrink-0">
                <div className="flex items-center gap-4">
                  <CustomMenu ellipsis>
                    <CustomMenu.MenuItem
                      onClick={() => {
                        setUpdateViewModal(true);
                      }}
                    >
                      <span className="flex items-center justify-start gap-2">
                        <EditIcon width={14} height={14} strokeWidth={2} />
                        <span>Edit View</span>
                      </span>
                    </CustomMenu.MenuItem>
                    <CustomMenu.MenuItem
                      onClick={() => {
                        setDeleteViewModal(true);
                      }}
                    >
                      <span className="flex items-center justify-start gap-2">
                        <TrashIcon width={14} height={14} strokeWidth={2} />
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
