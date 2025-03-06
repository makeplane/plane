import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { ExternalLink, Link, Pencil, Trash2 } from "lucide-react";
// plane imports
import { ContextMenu, CustomMenu, setToast, TContextMenuItem, TOAST_TYPE } from "@plane/ui";
import { cn, copyUrlToClipboard } from "@plane/utils";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";
// local components
import { DashboardDeleteModal } from "./modals/delete-modal";

type Props = {
  dashboardId: string;
  parentRef: React.RefObject<HTMLElement>;
};

export const DashboardQuickActions: React.FC<Props> = observer((props) => {
  const { dashboardId, parentRef } = props;
  // states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  // store hooks
  const {
    getDashboardById,
    workspaceDashboards: { deleteDashboard, toggleCreateUpdateModal, updateCreateUpdateModalPayload },
  } = useDashboards();
  // derived values
  const dashboardDetails = getDashboardById(dashboardId);
  const { canCurrentUserDeleteDashboard, canCurrentUserEditDashboard, getRedirectionLink } = dashboardDetails ?? {};
  // menu items
  const MENU_ITEMS: TContextMenuItem[] = useMemo(() => {
    const dashboardLink = getRedirectionLink?.();
    return [
      {
        key: "edit",
        action: () => {
          toggleCreateUpdateModal(true);
          updateCreateUpdateModalPayload({ ...dashboardDetails?.asJSON, id: dashboardId });
        },
        title: "Edit",
        icon: Pencil,
        shouldRender: !!canCurrentUserEditDashboard,
      },
      {
        key: "open-in-new-tab",
        action: () => window.open(dashboardLink, "_blank"),
        title: "Open in new tab",
        icon: ExternalLink,
      },
      {
        key: "copy-link",
        action: () => {
          if (!dashboardLink) return;
          copyUrlToClipboard(dashboardLink).then(() => {
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Link Copied!",
              message: "Page link copied to clipboard.",
            });
          });
        },
        title: "Copy link",
        icon: Link,
      },
      {
        key: "delete",
        action: () => setIsDeleteModalOpen(true),
        title: "Delete",
        icon: Trash2,
        shouldRender: !!canCurrentUserDeleteDashboard,
      },
    ];
  }, [
    canCurrentUserDeleteDashboard,
    canCurrentUserEditDashboard,
    getRedirectionLink,
    dashboardDetails?.asJSON,
    dashboardId,
    toggleCreateUpdateModal,
    updateCreateUpdateModalPayload,
  ]);

  return (
    <>
      <DashboardDeleteModal
        dashboardId={dashboardId}
        handleClose={() => setIsDeleteModalOpen(false)}
        handleDelete={async () => await deleteDashboard(dashboardId)}
        isOpen={isDeleteModalOpen}
      />
      {parentRef && <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />}
      <CustomMenu placement="bottom-end" optionsClassName="max-h-[90vh]" ellipsis closeOnSelect>
        {MENU_ITEMS.map((item) => {
          if (item.shouldRender === false) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                item.action?.();
              }}
              className={cn("flex items-center gap-2", item.className)}
              disabled={item.disabled}
            >
              {item.customContent ?? (
                <>
                  {item.icon && <item.icon className="size-3" />}
                  {item.title}
                </>
              )}
            </CustomMenu.MenuItem>
          );
        })}
      </CustomMenu>
    </>
  );
});
