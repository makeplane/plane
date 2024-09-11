"use client";

import { useState } from "react";
import { observer } from "mobx-react";

// icons
import { ArchiveRestoreIcon, ExternalLink, LinkIcon, Pencil, Trash2 } from "lucide-react";
// ui
import { ArchiveIcon, ContextMenu, CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
// components
import { ArchiveModuleModal, CreateUpdateModuleModal, DeleteModuleModal } from "@/components/modules";
// helpers
import { cn } from "@/helpers/common.helper";
import { copyUrlToClipboard } from "@/helpers/string.helper";
// hooks
import { useModule, useEventTracker, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

type Props = {
  parentRef: React.RefObject<HTMLDivElement>;
  moduleId: string;
  projectId: string;
  workspaceSlug: string;
};

export const ModuleQuickActions: React.FC<Props> = observer((props) => {
  const { parentRef, moduleId, projectId, workspaceSlug } = props;
  // router
  const router = useAppRouter();
  // states
  const [editModal, setEditModal] = useState(false);
  const [archiveModuleModal, setArchiveModuleModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  // store hooks
  const { setTrackElement } = useEventTracker();
  const { allowPermissions } = useUserPermissions();

  const { getModuleById, restoreModule } = useModule();
  // derived values
  const moduleDetails = getModuleById(moduleId);
  const isArchived = !!moduleDetails?.archived_at;
  // auth
  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  const moduleState = moduleDetails?.status?.toLocaleLowerCase();
  const isInArchivableGroup = !!moduleState && ["completed", "cancelled"].includes(moduleState);

  const moduleLink = `${workspaceSlug}/projects/${projectId}/modules/${moduleId}`;
  const handleCopyText = () =>
    copyUrlToClipboard(moduleLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Link Copied!",
        message: "Module link copied to clipboard.",
      });
    });
  const handleOpenInNewTab = () => window.open(`/${moduleLink}`, "_blank");

  const handleEditModule = () => {
    setTrackElement("Modules page list layout");
    setEditModal(true);
  };

  const handleArchiveModule = () => setArchiveModuleModal(true);

  const handleRestoreModule = async () =>
    await restoreModule(workspaceSlug, projectId, moduleId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Restore success",
          message: "Your module can be found in project modules.",
        });
        router.push(`/${workspaceSlug}/projects/${projectId}/archives/modules`);
      })
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Module could not be restored. Please try again.",
        })
      );

  const handleDeleteModule = () => {
    setTrackElement("Modules page list layout");
    setDeleteModal(true);
  };

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      title: "Edit",
      icon: Pencil,
      action: handleEditModule,
      shouldRender: isEditingAllowed && !isArchived,
    },
    {
      key: "open-new-tab",
      action: handleOpenInNewTab,
      title: "Open in new tab",
      icon: ExternalLink,
      shouldRender: !isArchived,
    },
    {
      key: "copy-link",
      action: handleCopyText,
      title: "Copy link",
      icon: LinkIcon,
      shouldRender: !isArchived,
    },
    {
      key: "archive",
      action: handleArchiveModule,
      title: "Archive",
      description: isInArchivableGroup ? undefined : "Only completed or canceled\nmodule can be archived.",
      icon: ArchiveIcon,
      className: "items-start",
      iconClassName: "mt-1",
      shouldRender: isEditingAllowed && !isArchived,
      disabled: !isInArchivableGroup,
    },
    {
      key: "restore",
      action: handleRestoreModule,
      title: "Restore",
      icon: ArchiveRestoreIcon,
      shouldRender: isEditingAllowed && isArchived,
    },
    {
      key: "delete",
      action: handleDeleteModule,
      title: "Delete",
      icon: Trash2,
      shouldRender: isEditingAllowed,
    },
  ];

  return (
    <>
      {moduleDetails && (
        <div className="fixed">
          <CreateUpdateModuleModal
            isOpen={editModal}
            onClose={() => setEditModal(false)}
            data={moduleDetails}
            projectId={projectId}
            workspaceSlug={workspaceSlug}
          />
          <ArchiveModuleModal
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            moduleId={moduleId}
            isOpen={archiveModuleModal}
            handleClose={() => setArchiveModuleModal(false)}
          />
          <DeleteModuleModal data={moduleDetails} isOpen={deleteModal} onClose={() => setDeleteModal(false)} />
        </div>
      )}
      <ContextMenu parentRef={parentRef} items={MENU_ITEMS} />
      <CustomMenu ellipsis placement="bottom-end" closeOnSelect>
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
