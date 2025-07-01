"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { ExternalLink, LinkIcon, Pencil, Trash2 } from "lucide-react";
// types
import { EUserPermissions, EUserPermissionsLevel, GLOBAL_VIEW_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IWorkspaceView } from "@plane/types";
import { CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
import { copyUrlToClipboard, cn } from "@plane/utils";
// components
import { CreateUpdateWorkspaceViewModal, DeleteGlobalViewModal } from "@/components/workspace";
// constants
// helpers
// hooks
import { captureClick } from "@/helpers/event-tracker.helper";
import { useUser, useUserPermissions } from "@/hooks/store";

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
  const { t } = useTranslation();
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

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      action: () => setUpdateViewModal(true),
      title: t("edit"),
      icon: Pencil,
      shouldRender: isOwner,
    },
    {
      key: "open-new-tab",
      action: handleOpenInNewTab,
      title: t("open_in_new_tab"),
      icon: ExternalLink,
    },
    {
      key: "copy-link",
      action: handleCopyText,
      title: t("copy_link"),
      icon: LinkIcon,
    },
    {
      key: "delete",
      action: () => setDeleteViewModal(true),
      title: t("delete"),
      icon: Trash2,
      shouldRender: isOwner || isAdmin,
    },
  ];

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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
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
