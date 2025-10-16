"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, GLOBAL_VIEW_TRACKER_ELEMENTS } from "@plane/constants";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkspaceView } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
import { CustomMenu } from "@plane/ui";
import { copyUrlToClipboard, cn } from "@plane/utils";
// helpers
import { captureClick } from "@/helpers/event-tracker.helper";
// hooks
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { useViewMenuItems } from "@/plane-web/components/views/helper";
// local imports
import { DeleteGlobalViewModal } from "./delete-view-modal";
import { CreateUpdateWorkspaceViewModal } from "./modal";

type Props = {
  workspaceSlug: string;
  view: IWorkspaceView;
};

export const WorkspaceViewQuickActions: React.FC<Props> = observer((props) => {
  const { workspaceSlug, view } = props;
  // states
  const [updateViewModal, setUpdateViewModal] = useState(false);
  const [deleteViewModal, setDeleteViewModal] = useState(false);
  // store hooks
  const { data } = useUser();
  const { allowPermissions } = useUserPermissions();
  // auth
  const isOwner = view?.owned_by === data?.id;
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  const viewLink = `${workspaceSlug}/workspace-views/${view.id}`;
  const handleCopyText = () =>
    copyUrlToClipboard(viewLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "View link copied to clipboard.",
      });
    });
  const handleOpenInNewTab = () => window.open(`/${viewLink}`, "_blank");

  const MENU_ITEMS: TContextMenuItem[] = useViewMenuItems({
    isOwner,
    isAdmin,
    setDeleteViewModal,
    setCreateUpdateViewModal: setUpdateViewModal,
    handleOpenInNewTab,
    handleCopyText,
    isLocked: view.is_locked,
    workspaceSlug,
    viewId: view.id,
  });

  return (
    <>
      <CreateUpdateWorkspaceViewModal data={view} isOpen={updateViewModal} onClose={() => setUpdateViewModal(false)} />
      <DeleteGlobalViewModal data={view} isOpen={deleteViewModal} onClose={() => setDeleteViewModal(false)} />
      <CustomMenu
        ellipsis
        placement="bottom-end"
        closeOnSelect
        buttonClassName="flex-shrink-0 flex items-center justify-center size-[26px] bg-custom-background-80/70 rounded"
      >
        {MENU_ITEMS.map((item) => {
          if (item.shouldRender === false) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={() => {
                captureClick({
                  elementName: GLOBAL_VIEW_TRACKER_ELEMENTS.QUICK_ACTIONS,
                });
                item.action();
              }}
              className={cn(
                "flex items-center gap-2",
                {
                  "text-custom-text-400": item.disabled,
                },
                item.className
              )}
              disabled={item.disabled}
            >
              {item.icon && <item.icon className={cn("h-3 w-3", item.iconClassName)} />}
              <div>
                <h5>{item.title}</h5>
                {item.description && (
                  <p
                    className={cn("text-custom-text-300 whitespace-pre-line", {
                      "text-custom-text-400": item.disabled,
                    })}
                  >
                    {item.description}
                  </p>
                )}
              </div>
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
    </>
  );
});
