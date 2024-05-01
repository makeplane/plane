import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { ExternalLink, LinkIcon, Pencil, Trash2 } from "lucide-react";
// types
import { IWorkspaceView } from "@plane/types";
// ui
import { ContextMenu, CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { CreateUpdateWorkspaceViewModal, DeleteGlobalViewModal } from "@/components/workspace";
// constants
import { EUserProjectRoles } from "@/constants/project";
// helpers
import { cn } from "@/helpers/common.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useUser } from "@/hooks/store";

type Props = {
  parentRef: React.RefObject<HTMLElement>;
  workspaceSlug: string;
  globalViewId: string;
  viewId: string;
  view: IWorkspaceView;
};

export const WorkspaceViewQuickActions: React.FC<Props> = observer((props) => {
  const { parentRef, view, globalViewId, viewId, workspaceSlug } = props;
  // states
  const [updateViewModal, setUpdateViewModal] = useState(false);
  const [deleteViewModal, setDeleteViewModal] = useState(false);
  // store hooks
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  // auth
  const isEditingAllowed = !!currentWorkspaceRole && currentWorkspaceRole >= EUserProjectRoles.MEMBER;

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
      title: "Edit",
      icon: Pencil,
      shouldRender: isEditingAllowed,
    },
    {
      key: "open-new-tab",
      action: handleOpenInNewTab,
      title: "Open in new tab",
      icon: ExternalLink,
    },
    {
      key: "copy-link",
      action: handleCopyText,
      title: "Copy link",
      icon: LinkIcon,
    },
    {
      key: "delete",
      action: () => setDeleteViewModal(true),
      title: "Delete",
      icon: Trash2,
      shouldRender: isEditingAllowed,
    },
  ];

  return (
    <>
      <CreateUpdateWorkspaceViewModal data={view} isOpen={updateViewModal} onClose={() => setUpdateViewModal(false)} />
      <DeleteGlobalViewModal data={view} isOpen={deleteViewModal} onClose={() => setDeleteViewModal(false)} />

      <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />

      <CustomMenu
        customButton={
          <>
            {viewId === globalViewId ? (
              <span
                className={`flex min-w-min flex-shrink-0 whitespace-nowrap border-b-2 p-3 text-sm font-medium outline-none ${
                  viewId === globalViewId
                    ? "border-custom-primary-100 text-custom-primary-100"
                    : "border-transparent hover:border-custom-border-200 hover:text-custom-text-400"
                }`}
              >
                {view.name}
              </span>
            ) : (
              <Link key={viewId} id={`global-view-${viewId}`} href={`/${workspaceSlug}/workspace-views/${viewId}`}>
                <span
                  className={`flex min-w-min flex-shrink-0 whitespace-nowrap border-b-2 p-3 text-sm font-medium outline-none ${
                    viewId === globalViewId
                      ? "border-custom-primary-100 text-custom-primary-100"
                      : "border-transparent hover:border-custom-border-200 hover:text-custom-text-400"
                  }`}
                >
                  {view.name}
                </span>
              </Link>
            )}
          </>
        }
        placement="bottom-end"
        menuItemsClassName="z-20"
        closeOnSelect
      >
        {MENU_ITEMS.map((item) => {
          if (item.shouldRender === false) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                item.action();
              }}
              className={cn(
                "flex items-center gap-2",
                {
                  "text-custom-text-400": item.disabled,
                },
                item.className
              )}
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
