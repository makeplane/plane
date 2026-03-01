/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import { ArchiveRestoreIcon, StopCircle, Download, LockOpen } from "lucide-react";
// plane imports
import { E_FEATURE_FLAGS, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import {
  EditIcon,
  NewTabIcon,
  LinkIcon,
  GlobeIcon,
  LockIcon,
  ArchiveIcon,
  TrashIcon,
  CommentReplyIcon,
} from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { EIssuesStoreType, EUserProjectRoles } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
// components
import { EndCycleModal } from "@/components/cycles/end-cycle";
import { ExportModal } from "@/components/common/quick-actions/export-modal";
import type { TExportProvider } from "@/components/common/quick-actions/export-modal";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useProjectView } from "@/hooks/store/use-project-view";
import { useWorkItemFilters } from "@/hooks/store/work-item-filters/use-work-item-filters";
import { useFlag } from "@/plane-web/hooks/store";
import { useUserPermissions } from "@/hooks/store/user";
// services
import exportService from "@/services/export.service";

type FeatureResult = {
  items: TContextMenuItem[];
  modals: JSX.Element | null;
};

/**
 * Unified factory for creating menu items across all entities (cycles, modules, views, epics)
 */
export const useQuickActionsFactory = () => {
  // store hooks
  const { t } = useTranslation();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const hasMemberPermissions = allowPermissions(
    [EUserProjectRoles.ADMIN, EUserProjectRoles.MEMBER],
    EUserPermissionsLevel.PROJECT
  );

  return {
    // Common menu items
    createEditMenuItem: (handler: () => void, shouldRender: boolean = true): TContextMenuItem => ({
      key: "edit",
      title: t("edit"),
      icon: EditIcon,
      action: handler,
      shouldRender,
    }),

    createOpenInNewTabMenuItem: (handler: () => void): TContextMenuItem => ({
      key: "open-new-tab",
      title: t("open_in_new_tab"),
      icon: NewTabIcon,
      action: handler,
    }),

    createCopyLinkMenuItem: (handler: () => void): TContextMenuItem => ({
      key: "copy-link",
      title: t("copy_link"),
      icon: LinkIcon,
      action: handler,
    }),

    createArchiveMenuItem: (
      handler: () => void,
      opts: { shouldRender?: boolean; disabled?: boolean; description?: string }
    ): TContextMenuItem => ({
      key: "archive",
      title: t("archive"),
      icon: ArchiveIcon,
      action: handler,
      className: "items-start",
      iconClassName: "mt-1",
      description: opts.description,
      disabled: opts.disabled,
      shouldRender: opts.shouldRender,
    }),

    createRestoreMenuItem: (handler: () => void, shouldRender: boolean = true): TContextMenuItem => ({
      key: "restore",
      title: t("restore"),
      icon: ArchiveRestoreIcon,
      action: handler,
      shouldRender,
    }),

    createDeleteMenuItem: (handler: () => void, shouldRender: boolean = true): TContextMenuItem => ({
      key: "delete",
      title: t("delete"),
      icon: TrashIcon,
      action: handler,
      shouldRender,
    }),

    // Layout-level actions (for work item list views)
    createOpenInNewTab: (handler: () => void): TContextMenuItem => ({
      key: "open-in-new-tab",
      title: "Open in new tab",
      icon: NewTabIcon,
      action: handler,
    }),

    createCopyLayoutLinkMenuItem: (handler: () => void): TContextMenuItem => ({
      key: "copy-link",
      title: "Copy link",
      icon: LinkIcon,
      action: handler,
    }),

    // Comment menu items
    createCommentEditMenuItem: (handler: () => void, shouldRender: boolean = true): TContextMenuItem => ({
      key: "edit",
      title: t("common.actions.edit"),
      icon: EditIcon,
      action: handler,
      shouldRender,
    }),

    createCommentCopyLinkMenuItem: (handler: () => void, shouldRender: boolean = true): TContextMenuItem => ({
      key: "copy_link",
      title: t("common.actions.copy_link"),
      icon: LinkIcon,
      action: handler,
      shouldRender,
    }),

    createCommentAccessSpecifierMenuItem: (
      handler: () => void,
      isInternal: boolean,
      shouldRender: boolean = true
    ): TContextMenuItem => ({
      key: "access_specifier",
      title: isInternal ? t("issue.comments.switch.public") : t("issue.comments.switch.private"),
      icon: isInternal ? GlobeIcon : LockIcon,
      action: handler,
      shouldRender,
    }),

    createCommentDeleteMenuItem: (handler: () => void, shouldRender: boolean = true): TContextMenuItem => ({
      key: "delete",
      title: t("common.actions.delete"),
      icon: TrashIcon,
      action: handler,
      shouldRender,
    }),

    // EE-specific menu items
    createEndCycleMenuItem: (handler: () => void, shouldRender: boolean = true): TContextMenuItem => ({
      key: "end-cycle",
      title: "End Cycle",
      icon: StopCircle,
      action: handler,
      shouldRender,
    }),

    createExportMenuItem: (handler: () => void, shouldRender: boolean = true): TContextMenuItem => ({
      key: "export",
      title: "Export",
      icon: Download,
      action: handler,
      shouldRender,
    }),

    createLockMenuItem: (
      handler: () => void,
      opts: { isLocked: boolean; shouldRender?: boolean }
    ): TContextMenuItem => ({
      key: "toggle-lock",
      title: opts.isLocked ? "Unlock" : "Lock",
      icon: opts.isLocked ? LockOpen : LockIcon,
      action: handler,
      shouldRender: opts.shouldRender,
    }),

    // EE feature: End Cycle with modal
    useCycleEndFeature: (props: {
      workspaceSlug: string;
      projectId: string;
      cycleId: string;
      cycleName: string | undefined;
      isCurrentCycle: boolean;
      transferrableIssuesCount: number;
    }): FeatureResult => {
      const [isOpen, setIsOpen] = useState(false);
      const isEnabled = useFlag(props.workspaceSlug, E_FEATURE_FLAGS.CYCLE_PROGRESS_CHARTS);

      const items =
        isEnabled && props.isCurrentCycle
          ? [
              {
                key: "end-cycle",
                title: "End Cycle",
                icon: StopCircle,
                action: () => setIsOpen(true),
                shouldRender: true,
              } as TContextMenuItem,
            ]
          : [];

      const modals =
        isEnabled && props.isCurrentCycle ? (
          <EndCycleModal
            isOpen={isOpen}
            handleClose={() => setIsOpen(false)}
            cycleId={props.cycleId}
            projectId={props.projectId}
            workspaceSlug={props.workspaceSlug}
            transferrableIssuesCount={props.transferrableIssuesCount}
          />
        ) : null;

      return { items, modals };
    },

    // EE feature: Export for Cycles
    useCycleExportFeature: (props: {
      workspaceSlug: string;
      projectId: string;
      cycleId: string;
      isArchived: boolean;
    }): FeatureResult => {
      const [isOpen, setIsOpen] = useState(false);
      const { getFilter } = useWorkItemFilters();
      const richFilters = getFilter(EIssuesStoreType.CYCLE, props.cycleId)?.getExternalExpression();

      const { issuesFilter: _issuesFilter } = useIssues(EIssuesStoreType.CYCLE);
      const isEnabled = useFlag(props.workspaceSlug, E_FEATURE_FLAGS.ADVANCED_EXPORTS) && hasMemberPermissions;

      const handleExport = async (provider: TExportProvider) => {
        try {
          await exportService.exportCycleWorkItems(
            props.workspaceSlug,
            props.projectId,
            props.cycleId,
            provider,
            richFilters
          );
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Export started",
            message: "Your export will be ready soon.",
            actionItems: (
              <div className="flex items-center gap-1 text-11 text-secondary">
                <a
                  href={`/${props.workspaceSlug}/settings/exports/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-primary px-2 py-1 hover:bg-layer-1 font-medium rounded"
                >
                  View Exports
                </a>
              </div>
            ),
          });
          setIsOpen(false);
        } catch (_error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Failed to export cycle. Please try again.",
          });
        }
      };

      const items =
        isEnabled && !props.isArchived
          ? [
              {
                key: "export",
                title: "Export",
                icon: Download,
                action: () => setIsOpen(true),
                shouldRender: true,
              } as TContextMenuItem,
            ]
          : [];

      const modals = isEnabled ? (
        <ExportModal isOpen={isOpen} onClose={() => setIsOpen(false)} onConfirm={handleExport} />
      ) : null;

      return { items, modals };
    },

    // EE feature: Export for Modules
    useModuleExportFeature: (props: {
      workspaceSlug: string;
      projectId: string;
      moduleId: string;
      isArchived: boolean;
    }): FeatureResult => {
      const [isOpen, setIsOpen] = useState(false);
      const { getFilter } = useWorkItemFilters();
      const richFilters = getFilter(EIssuesStoreType.MODULE, props.moduleId)?.getExternalExpression();
      const isEnabled = useFlag(props.workspaceSlug, E_FEATURE_FLAGS.ADVANCED_EXPORTS) && hasMemberPermissions;

      const handleExport = async (provider: TExportProvider) => {
        try {
          await exportService.exportModuleWorkItems(
            props.workspaceSlug,
            props.projectId,
            props.moduleId,
            provider,
            richFilters
          );
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Export started",
            message: "Your export will be ready soon.",
            actionItems: (
              <div className="flex items-center gap-1 text-11 text-secondary">
                <a
                  href={`/${props.workspaceSlug}/settings/exports`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-primary px-2 py-1 hover:bg-layer-1 font-medium rounded"
                >
                  View Exports
                </a>
              </div>
            ),
          });
          setIsOpen(false);
        } catch (_error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Failed to export module. Please try again.",
          });
        }
      };

      const items =
        isEnabled && !props.isArchived
          ? [
              {
                key: "export",
                title: "Export",
                icon: Download,
                action: () => setIsOpen(true),
                shouldRender: true,
              } as TContextMenuItem,
            ]
          : [];

      const modals = isEnabled ? (
        <ExportModal isOpen={isOpen} onClose={() => setIsOpen(false)} onConfirm={handleExport} />
      ) : null;

      return { items, modals };
    },

    // EE feature: View Lock
    useViewLockFeature: (props: {
      workspaceSlug: string;
      projectId?: string;
      viewId: string;
      isLocked: boolean;
      isOwner: boolean;
    }): FeatureResult => {
      const { lockView, unLockView } = useProjectView();
      const isEnabled = useFlag(props.workspaceSlug, E_FEATURE_FLAGS.VIEW_LOCK);

      const handleToggleLock = async () => {
        if (!props.projectId) return;
        const operation = props.isLocked ? unLockView : lockView;
        await operation(props.workspaceSlug, props.projectId, props.viewId)
          .then(() => {
            setToast({
              type: TOAST_TYPE.SUCCESS,
              title: "Success!",
              message: props.isLocked ? "View unlocked successfully." : "View locked successfully.",
            });
            return;
          })
          .catch(() => {
            setToast({
              type: TOAST_TYPE.ERROR,
              title: "Error!",
              message: props.isLocked
                ? "View could not be unlocked. Please try again later."
                : "View could not be locked. Please try again later.",
            });
          });
      };

      const items =
        isEnabled && props.isOwner
          ? [
              {
                key: "toggle-lock",
                title: props.isLocked ? "Unlock" : "Lock",
                icon: props.isLocked ? LockOpen : LockIcon,
                action: () => void handleToggleLock(),
                shouldRender: true,
              } as TContextMenuItem,
            ]
          : [];

      return { items, modals: null };
    },

    // EE feature: Export for Views
    useViewExportFeature: (props: { workspaceSlug: string; projectId?: string; viewId: string }): FeatureResult => {
      const [isOpen, setIsOpen] = useState(false);
      const { getFilter } = useWorkItemFilters();
      const richFilterEntityType = props.projectId ? EIssuesStoreType.PROJECT_VIEW : EIssuesStoreType.GLOBAL;
      const richFilters = getFilter(richFilterEntityType, props.viewId)?.getExternalExpression();
      const isEnabled = useFlag(props.workspaceSlug, E_FEATURE_FLAGS.ADVANCED_EXPORTS) && hasMemberPermissions;

      const handleExport = async (provider: TExportProvider) => {
        try {
          if (props.projectId) {
            await exportService.exportProjectViewWorkItems(
              props.workspaceSlug,
              props.projectId,
              props.viewId,
              provider,
              richFilters
            );
          } else {
            await exportService.exportWorkspaceViewWorkItems(props.workspaceSlug, props.viewId, provider, richFilters);
          }
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Export started",
            message: "Your export will be ready soon.",
            actionItems: (
              <div className="flex items-center gap-1 text-11 text-secondary">
                <a
                  href={`/${props.workspaceSlug}/settings/exports`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-primary px-2 py-1 hover:bg-layer-1 font-medium rounded"
                >
                  View Exports
                </a>
              </div>
            ),
          });
          setIsOpen(false);
        } catch (_error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Failed to export view. Please try again.",
          });
        }
      };

      const items = isEnabled
        ? [
            {
              key: "export",
              title: "Export",
              icon: Download,
              action: () => setIsOpen(true),
              shouldRender: true,
            } as TContextMenuItem,
          ]
        : [];

      const modals = isEnabled ? (
        <ExportModal isOpen={isOpen} onClose={() => setIsOpen(false)} onConfirm={handleExport} />
      ) : null;

      return { items, modals };
    },

    // EE feature: Export for Layouts
    useLayoutExportFeature: (props: {
      workspaceSlug: string;
      projectId: string;
      storeType: "PROJECT" | "EPIC";
    }): FeatureResult => {
      const [isOpen, setIsOpen] = useState(false);
      const { getFilter } = useWorkItemFilters();
      const richFilterEntityType = props.storeType === "EPIC" ? EIssuesStoreType.EPIC : EIssuesStoreType.PROJECT;
      const richFilters = getFilter(richFilterEntityType, props.projectId)?.getExternalExpression();
      const isEnabled = useFlag(props.workspaceSlug, E_FEATURE_FLAGS.ADVANCED_EXPORTS) && hasMemberPermissions;

      const handleExport = async (provider: TExportProvider) => {
        try {
          if (props.storeType === "EPIC") {
            await exportService.exportEpics(props.workspaceSlug, props.projectId, provider, richFilters);
          } else {
            await exportService.exportWorkItems(props.workspaceSlug, props.projectId, provider, richFilters);
          }
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Export started",
            message: "Your export will be ready soon.",
            actionItems: (
              <div className="flex items-center gap-1 text-11 text-secondary">
                <a
                  href={`/${props.workspaceSlug}/settings/exports`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-primary px-2 py-1 hover:bg-layer-1 font-medium rounded"
                >
                  View Exports
                </a>
              </div>
            ),
          });
          setIsOpen(false);
        } catch (_error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: `Failed to export ${props.storeType === "EPIC" ? "epics" : "work items"}. Please try again.`,
          });
        }
      };

      const items = isEnabled
        ? [
            {
              key: "export",
              title: "Export",
              icon: Download,
              action: () => setIsOpen(true),
              shouldRender: true,
            } as TContextMenuItem,
          ]
        : [];

      const modals = isEnabled ? (
        <ExportModal isOpen={isOpen} onClose={() => setIsOpen(false)} onConfirm={handleExport} />
      ) : null;

      return { items, modals };
    },

    // EE feature: Export for Intake
    useIntakeExportFeature: (props: { workspaceSlug: string; projectId: string }): FeatureResult => {
      const [isOpen, setIsOpen] = useState(false);
      const isEnabled = useFlag(props.workspaceSlug, E_FEATURE_FLAGS.ADVANCED_EXPORTS) && hasMemberPermissions;

      const handleExport = async (provider: TExportProvider) => {
        try {
          await exportService.exportIntakeWorkItems(props.workspaceSlug, props.projectId, provider);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Export started",
            message: "Your export will be ready soon.",
            actionItems: (
              <div className="flex items-center gap-1 text-11 text-secondary">
                <a
                  href={`/${props.workspaceSlug}/settings/exports`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-primary px-2 py-1 hover:bg-layer-1 font-medium rounded"
                >
                  View Exports
                </a>
              </div>
            ),
          });
          setIsOpen(false);
        } catch (_error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Failed to export intake. Please try again.",
          });
        }
      };

      const items = isEnabled
        ? [
            {
              key: "export",
              title: "Export",
              icon: Download,
              action: () => setIsOpen(true),
              shouldRender: true,
            } as TContextMenuItem,
          ]
        : [];

      const modals = isEnabled ? (
        <ExportModal isOpen={isOpen} onClose={() => setIsOpen(false)} onConfirm={handleExport} />
      ) : null;

      return { items, modals };
    },

    // Reply menu items (EE-only)
    createReplyEditMenuItem: (handler: () => void, shouldRender: boolean = true): TContextMenuItem => ({
      key: "edit",
      title: t("common.actions.edit"),
      icon: EditIcon,
      action: handler,
      shouldRender,
    }),

    createReplyDeleteMenuItem: (handler: () => void, shouldRender: boolean = true): TContextMenuItem => ({
      key: "delete",
      title: t("common.actions.delete"),
      icon: TrashIcon,
      action: handler,
      shouldRender,
    }),

    // EE feature: Comment Reply
    useCommentReplyFeature: (props: {
      commentId: string;
      handleReply?: () => void;
      shouldRender: boolean;
    }): FeatureResult => {
      const { t } = useTranslation();

      const items = [
        {
          key: "reply",
          title: t("common.actions.reply"),
          icon: CommentReplyIcon,
          action: props.handleReply || (() => {}),
          shouldRender: props.shouldRender,
        } as TContextMenuItem,
      ];

      return { items, modals: null };
    },
  };
};
