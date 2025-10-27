"use client";

import { useState } from "react";
import { observer } from "mobx-react";

// plane imports
import {
  EUserPermissions,
  EUserPermissionsLevel,
  MODULE_TRACKER_ELEMENTS,
  MODULE_TRACKER_EVENTS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TContextMenuItem } from "@plane/ui";
import { ContextMenu, CustomMenu } from "@plane/ui";
import { copyUrlToClipboard, cn } from "@plane/utils";
// components
import { ArchiveModuleModal, CreateUpdateModuleModal, DeleteModuleModal } from "@/components/modules";
// helpers
import { captureClick, captureSuccess, captureError } from "@/helpers/event-tracker.helper";
// hooks
import { useModule } from "@/hooks/store/use-module";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { useModuleMenuItems } from "@/plane-web/components/common/quick-actions-helper";

type Props = {
  parentRef: React.RefObject<HTMLDivElement>;
  moduleId: string;
  projectId: string;
  workspaceSlug: string;
  customClassName?: string;
};

export const ModuleQuickActions: React.FC<Props> = observer((props) => {
  const { parentRef, moduleId, projectId, workspaceSlug, customClassName } = props;
  // router
  const router = useAppRouter();
  // states
  const [editModal, setEditModal] = useState(false);
  const [archiveModuleModal, setArchiveModuleModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  // store hooks
  const { allowPermissions } = useUserPermissions();

  const { getModuleById, restoreModule } = useModule();

  const { t } = useTranslation();
  // derived values
  const moduleDetails = getModuleById(moduleId);
  // auth
  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

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

  const handleRestoreModule = async () =>
    await restoreModule(workspaceSlug, projectId, moduleId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Restore success",
          message: "Your module can be found in project modules.",
        });
        captureSuccess({
          eventName: MODULE_TRACKER_EVENTS.restore,
          payload: { id: moduleId },
        });
        router.push(`/${workspaceSlug}/projects/${projectId}/archives/modules`);
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Module could not be restored. Please try again.",
        });
        captureError({
          eventName: MODULE_TRACKER_EVENTS.restore,
          payload: { id: moduleId },
          error,
        });
      });

  // Use unified menu hook from plane-web (resolves to CE or EE)
  const menuResult = useModuleMenuItems({
    moduleDetails: moduleDetails!,
    workspaceSlug,
    projectId,
    moduleId,
    isEditingAllowed,
    handleEdit: () => setEditModal(true),
    handleArchive: () => setArchiveModuleModal(true),
    handleRestore: handleRestoreModule,
    handleDelete: () => setDeleteModal(true),
    handleCopyLink: handleCopyText,
    handleOpenInNewTab,
  });

  // Handle both CE (array) and EE (object) return types
  const MENU_ITEMS: TContextMenuItem[] = Array.isArray(menuResult) ? menuResult : menuResult.items;
  const additionalModals = Array.isArray(menuResult) ? null : menuResult.modals;

  const CONTEXT_MENU_ITEMS: TContextMenuItem[] = MENU_ITEMS.map((item) => ({
    ...item,
    onClick: () => {
      captureClick({
        elementName: MODULE_TRACKER_ELEMENTS.CONTEXT_MENU,
      });
      item.action();
    },
  }));

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
          {additionalModals}
        </div>
      )}
      <ContextMenu parentRef={parentRef} items={CONTEXT_MENU_ITEMS} />
      <CustomMenu ellipsis placement="bottom-end" closeOnSelect buttonClassName={customClassName}>
        {MENU_ITEMS.map((item) => {
          if (item.shouldRender === false) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={() => {
                captureClick({
                  elementName: MODULE_TRACKER_ELEMENTS.QUICK_ACTIONS,
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
