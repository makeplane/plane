"use client";

import { useState } from "react";
import { observer } from "mobx-react";

// ui
import {
  CYCLE_TRACKER_EVENTS,
  EUserPermissions,
  EUserPermissionsLevel,
  CYCLE_TRACKER_ELEMENTS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { TContextMenuItem } from "@plane/ui";
import { ContextMenu, CustomMenu } from "@plane/ui";
import { copyUrlToClipboard, cn } from "@plane/utils";
// helpers
// hooks
import { captureClick, captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useCycle } from "@/hooks/store/use-cycle";
import { useUserPermissions } from "@/hooks/store/user";
import { useAppRouter } from "@/hooks/use-app-router";
import { useCycleMenuItems } from "@/plane-web/components/common/quick-actions-helper";
// local imports
import { ArchiveCycleModal } from "./archived-cycles/modal";
import { CycleDeleteModal } from "./delete-modal";
import { CycleCreateUpdateModal } from "./modal";

type Props = {
  parentRef: React.RefObject<HTMLElement>;
  cycleId: string;
  projectId: string;
  workspaceSlug: string;
  customClassName?: string;
};

export const CycleQuickActions: React.FC<Props> = observer((props) => {
  const { parentRef, cycleId, projectId, workspaceSlug, customClassName } = props;
  // router
  const router = useAppRouter();
  // states
  const [updateModal, setUpdateModal] = useState(false);
  const [archiveCycleModal, setArchiveCycleModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { getCycleById, restoreCycle } = useCycle();
  const { t } = useTranslation();
  // derived values
  const cycleDetails = getCycleById(cycleId);
  // auth
  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  const cycleLink = `${workspaceSlug}/projects/${projectId}/cycles/${cycleId}`;
  const handleCopyText = () =>
    copyUrlToClipboard(cycleLink).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("common.link_copied"),
        message: t("common.link_copied_to_clipboard"),
      });
    });
  const handleOpenInNewTab = () => window.open(`/${cycleLink}`, "_blank");

  const handleRestoreCycle = async () =>
    await restoreCycle(workspaceSlug, projectId, cycleId)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("project_cycles.action.restore.success.title"),
          message: t("project_cycles.action.restore.success.description"),
        });
        captureSuccess({
          eventName: CYCLE_TRACKER_EVENTS.restore,
          payload: {
            id: cycleId,
          },
        });
        router.push(`/${workspaceSlug}/projects/${projectId}/archives/cycles`);
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("project_cycles.action.restore.failed.title"),
          message: t("project_cycles.action.restore.failed.description"),
        });
        captureError({
          eventName: CYCLE_TRACKER_EVENTS.restore,
          payload: {
            id: cycleId,
          },
        });
      });

  // Use unified menu hook from plane-web (resolves to CE or EE)
  const menuResult = useCycleMenuItems({
    cycleDetails: cycleDetails!,
    workspaceSlug,
    projectId,
    cycleId,
    isEditingAllowed,
    handleEdit: () => setUpdateModal(true),
    handleArchive: () => setArchiveCycleModal(true),
    handleRestore: handleRestoreCycle,
    handleDelete: () => setDeleteModal(true),
    handleCopyLink: handleCopyText,
    handleOpenInNewTab,
  });

  // Handle both CE (array) and EE (object) return types
  const MENU_ITEMS: TContextMenuItem[] = Array.isArray(menuResult) ? menuResult : menuResult.items;
  const additionalModals = Array.isArray(menuResult) ? null : menuResult.modals;

  const CONTEXT_MENU_ITEMS = MENU_ITEMS.map((item) => ({
    ...item,
    action: () => {
      captureClick({
        elementName: CYCLE_TRACKER_ELEMENTS.CONTEXT_MENU,
      });
      item.action();
    },
  }));

  return (
    <>
      {cycleDetails && (
        <div className="fixed">
          <CycleCreateUpdateModal
            data={cycleDetails}
            isOpen={updateModal}
            handleClose={() => setUpdateModal(false)}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
          />
          <ArchiveCycleModal
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            cycleId={cycleId}
            isOpen={archiveCycleModal}
            handleClose={() => setArchiveCycleModal(false)}
          />
          <CycleDeleteModal
            cycle={cycleDetails}
            isOpen={deleteModal}
            handleClose={() => setDeleteModal(false)}
            workspaceSlug={workspaceSlug}
            projectId={projectId}
          />
          {additionalModals}
        </div>
      )}
      <ContextMenu parentRef={parentRef} items={CONTEXT_MENU_ITEMS} />
      <CustomMenu ellipsis placement="bottom-end" closeOnSelect maxHeight="lg" buttonClassName={customClassName}>
        {MENU_ITEMS.map((item) => {
          if (item.shouldRender === false) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={() => {
                captureClick({
                  elementName: CYCLE_TRACKER_ELEMENTS.QUICK_ACTIONS,
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
