"use client";

import { useState } from "react";
import { observer } from "mobx-react";

// icons
import { ArchiveRestoreIcon, ExternalLink, LinkIcon, Pencil, Trash2 } from "lucide-react";
// ui
import {
  CYCLE_TRACKER_EVENTS,
  EUserPermissions,
  EUserPermissionsLevel,
  CYCLE_TRACKER_ELEMENTS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ArchiveIcon, ContextMenu, CustomMenu, TContextMenuItem, TOAST_TYPE, setToast } from "@plane/ui";
import { copyUrlToClipboard, cn } from "@plane/utils";
// components
import { ArchiveCycleModal, CycleCreateUpdateModal, CycleDeleteModal } from "@/components/cycles";
// helpers
// hooks
import { captureClick, captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useCycle, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
import { useEndCycle, EndCycleModal } from "@/plane-web/components/cycles";

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
  const isArchived = !!cycleDetails?.archived_at;
  const isCompleted = cycleDetails?.status?.toLowerCase() === "completed";
  const isCurrentCycle = cycleDetails?.status?.toLowerCase() === "current";
  const transferrableIssuesCount = cycleDetails
    ? cycleDetails.total_issues - (cycleDetails.cancelled_issues + cycleDetails.completed_issues)
    : 0;
  // auth
  const isEditingAllowed = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug,
    projectId
  );

  const { isEndCycleModalOpen, setEndCycleModalOpen, endCycleContextMenu } = useEndCycle(isCurrentCycle);

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

  const handleEditCycle = () => {
    setUpdateModal(true);
  };

  const handleArchiveCycle = () => setArchiveCycleModal(true);

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

  const handleDeleteCycle = () => {
    setDeleteModal(true);
  };

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      title: t("edit"),
      icon: Pencil,
      action: handleEditCycle,
      shouldRender: isEditingAllowed && !isCompleted && !isArchived,
    },
    {
      key: "open-new-tab",
      action: handleOpenInNewTab,
      title: t("open_in_new_tab"),
      icon: ExternalLink,
      shouldRender: !isArchived,
    },
    {
      key: "copy-link",
      action: handleCopyText,
      title: t("copy_link"),
      icon: LinkIcon,
      shouldRender: !isArchived,
    },
    {
      key: "archive",
      action: handleArchiveCycle,
      title: t("archive"),
      description: isCompleted ? undefined : t("project_cycles.only_completed_cycles_can_be_archived"),
      icon: ArchiveIcon,
      className: "items-start",
      iconClassName: "mt-1",
      shouldRender: isEditingAllowed && !isArchived,
      disabled: !isCompleted,
    },
    {
      key: "restore",
      action: handleRestoreCycle,
      title: t("restore"),
      icon: ArchiveRestoreIcon,
      shouldRender: isEditingAllowed && isArchived,
    },
    {
      key: "delete",
      action: handleDeleteCycle,
      title: t("delete"),
      icon: Trash2,
      shouldRender: isEditingAllowed && !isCompleted && !isArchived,
    },
  ];

  if (endCycleContextMenu) MENU_ITEMS.splice(3, 0, endCycleContextMenu);

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
          {isCurrentCycle && (
            <EndCycleModal
              isOpen={isEndCycleModalOpen}
              handleClose={() => setEndCycleModalOpen(false)}
              cycleId={cycleId}
              projectId={projectId}
              workspaceSlug={workspaceSlug}
              transferrableIssuesCount={transferrableIssuesCount}
              cycleName={cycleDetails.name}
            />
          )}
        </div>
      )}
      <ContextMenu parentRef={parentRef} items={CONTEXT_MENU_ITEMS} />
      <CustomMenu ellipsis placement="bottom-end" closeOnSelect maxHeight="lg" buttonClassName={customClassName}>
        {MENU_ITEMS.map((item) => {
          if (item.shouldRender === false) return null;
          return (
            <CustomMenu.MenuItem
              key={item.key}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
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
