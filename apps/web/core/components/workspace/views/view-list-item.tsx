"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
// plane imports
import { GLOBAL_VIEW_TRACKER_ELEMENTS } from "@plane/constants";
import { CustomMenu } from "@plane/ui";
import { truncateText } from "@plane/utils";
// helpers
import { captureClick } from "@/helpers/event-tracker.helper";
// hooks
import { useGlobalView } from "@/hooks/store/use-global-view";
// local imports
import { DeleteGlobalViewModal } from "./delete-view-modal";
import { CreateUpdateWorkspaceViewModal } from "./modal";

type Props = { viewId: string };

export const GlobalViewListItem: React.FC<Props> = observer((props) => {
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
      <div className="group border-b border-custom-border-200 hover:bg-custom-background-90">
        <Link href={`/${workspaceSlug}/workspace-views/${view.id}`}>
          <div className="relative flex h-[52px] w-full items-center justify-between rounded p-4">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <p className="truncate text-sm font-medium leading-4">{truncateText(view.name, 75)}</p>
                  {view?.description && <p className="text-xs text-custom-text-200">{view.description}</p>}
                </div>
              </div>
              <div className="ml-2 flex flex-shrink-0">
                <div className="flex items-center gap-4">
                  <CustomMenu ellipsis>
                    <CustomMenu.MenuItem
                      onClick={() => {
                        captureClick({
                          elementName: GLOBAL_VIEW_TRACKER_ELEMENTS.LIST_ITEM,
                        });
                        setUpdateViewModal(true);
                      }}
                    >
                      <span className="flex items-center justify-start gap-2">
                        <Pencil size={14} strokeWidth={2} />
                        <span>Edit View</span>
                      </span>
                    </CustomMenu.MenuItem>
                    <CustomMenu.MenuItem
                      onClick={() => {
                        captureClick({
                          elementName: GLOBAL_VIEW_TRACKER_ELEMENTS.LIST_ITEM,
                        });
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
