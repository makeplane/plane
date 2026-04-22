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

// types
import type { ICycle, IModule, IProjectView, IWorkspaceView } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
// hooks
import {
  useQuickActionsFactory,
  useCycleEndFeature,
  useCycleExportFeature,
  useModuleExportFeature,
  useViewLockFeature,
  useViewExportFeature,
  useLayoutExportFeature,
  useIntakeExportFeature,
} from "@/components/common/quick-actions/factory";

// Types
type UseCycleMenuItemsProps = {
  cycleDetails: ICycle | undefined;
  isFavorite: boolean;
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
  handleEdit: () => void;
  handleArchive: () => void;
  handleRestore: () => void;
  handleDelete: () => void;
  handleCopyLink: () => void;
  handleOpenInNewTab: () => void;
  handleFavorite: () => void;
  permissions: {
    canEdit: boolean;
    canArchive: boolean;
    canRestore: boolean;
    canDelete: boolean;
    canFavorite: boolean;
  };
};

type UseLayoutMenuItemsProps = {
  workspaceSlug: string;
  projectId: string;
  storeType: "PROJECT" | "EPIC";
  handleCopyLink: () => void;
  handleOpenInNewTab: () => void;
};

type MenuResult = {
  items: TContextMenuItem[];
  modals: JSX.Element | null;
};

export const useCycleMenuItems = (props: UseCycleMenuItemsProps): MenuResult => {
  const factory = useQuickActionsFactory();
  const { cycleDetails, isFavorite, permissions, workspaceSlug, projectId, cycleId, ...handlers } = props;

  const isArchived = !!cycleDetails?.archived_at;
  const isCompleted = cycleDetails?.status?.toLowerCase() === "completed";
  const isCurrentCycle = cycleDetails?.status?.toLowerCase() === "current";
  const transferrableIssuesCount = cycleDetails
    ? Math.max(
        0,
        (cycleDetails.total_issues ?? 0) - (cycleDetails.cancelled_issues ?? 0) - (cycleDetails.completed_issues ?? 0)
      )
    : 0;

  const endCycleFeature = useCycleEndFeature({
    workspaceSlug,
    projectId,
    cycleId,
    cycleName: cycleDetails?.name,
    isCurrentCycle,
    transferrableIssuesCount,
    canEndCycle: permissions.canEdit,
  });

  const exportFeature = useCycleExportFeature({
    workspaceSlug,
    projectId,
    cycleId,
    isArchived,
  });

  // Assemble final menu items - order defined here
  const items = [
    factory.createEditMenuItem(handlers.handleEdit, permissions.canEdit && !isCompleted && !isArchived),
    factory.createOpenInNewTabMenuItem(handlers.handleOpenInNewTab),
    factory.createCopyLinkMenuItem(handlers.handleCopyLink),
    factory.createFavoriteMenuItem(handlers.handleFavorite, {
      isFavorite,
      shouldRender: permissions.canFavorite && !isArchived,
    }),
    ...endCycleFeature.items,
    ...exportFeature.items,
    factory.createArchiveMenuItem(handlers.handleArchive, {
      shouldRender: permissions.canArchive && !isArchived,
      disabled: !isCompleted,
      description: isCompleted ? undefined : "Only completed cycles can be archived",
    }),
    factory.createRestoreMenuItem(handlers.handleRestore, permissions.canRestore && isArchived),
    factory.createDeleteMenuItem(handlers.handleDelete, permissions.canDelete && !isCompleted && !isArchived),
  ].filter((item) => item.shouldRender !== false);

  // Assemble final modals
  const modals = (
    <>
      {endCycleFeature.modals}
      {exportFeature.modals}
    </>
  );

  return { items, modals };
};

type UseModuleMenuItemsProps = {
  moduleDetails: IModule | undefined;
  workspaceSlug: string;
  projectId: string;
  moduleId: string;
  handleEdit: () => void;
  handleArchive: () => void;
  handleRestore: () => void;
  handleDelete: () => void;
  handleCopyLink: () => void;
  handleOpenInNewTab: () => void;
  permissions: {
    canEdit: boolean;
    canArchive: boolean;
    canRestore: boolean;
    canDelete: boolean;
  };
};

export const useModuleMenuItems = (props: UseModuleMenuItemsProps): MenuResult => {
  const factory = useQuickActionsFactory();
  const { moduleDetails, permissions, workspaceSlug, projectId, moduleId, ...handlers } = props;

  const isArchived = !!moduleDetails?.archived_at;
  const moduleState = moduleDetails?.status?.toLocaleLowerCase();
  const isInArchivableGroup = !!moduleState && ["completed", "cancelled"].includes(moduleState);

  const exportFeature = useModuleExportFeature({
    workspaceSlug,
    projectId,
    moduleId,
    isArchived,
  });

  // Assemble final menu items - order defined here
  const items = [
    factory.createEditMenuItem(handlers.handleEdit, permissions.canEdit && !isArchived),
    factory.createOpenInNewTabMenuItem(handlers.handleOpenInNewTab),
    factory.createCopyLinkMenuItem(handlers.handleCopyLink),
    ...exportFeature.items,
    factory.createArchiveMenuItem(handlers.handleArchive, {
      shouldRender: permissions.canArchive && !isArchived,
      disabled: !isInArchivableGroup,
      description: isInArchivableGroup ? undefined : "Only completed or cancelled modules can be archived",
    }),
    factory.createRestoreMenuItem(handlers.handleRestore, permissions.canRestore && isArchived),
    factory.createDeleteMenuItem(handlers.handleDelete, permissions.canDelete),
  ].filter((item) => item.shouldRender !== false);

  // Assemble final modals
  const modals = exportFeature.modals;

  return { items, modals };
};

type UseViewMenuItemsProps = {
  workspaceSlug: string;
  projectId?: string;
  view: IProjectView | IWorkspaceView;
  handleEdit: () => void;
  handleDelete: () => void;
  handleCopyLink: () => void;
  handleOpenInNewTab: () => void;
  permissions: {
    canEdit: boolean;
    canLock: boolean;
    canDelete: boolean;
  };
  isDetailPage?: boolean;
};

export const useViewMenuItems = (props: UseViewMenuItemsProps): MenuResult => {
  const factory = useQuickActionsFactory();
  const { workspaceSlug, projectId, view, permissions, isDetailPage, ...handlers } = props;

  const lockFeature = useViewLockFeature({
    workspaceSlug,
    projectId,
    viewId: view?.id ?? "",
    isLocked: view?.is_locked ?? false,
    canLock: !!view?.id && permissions.canLock,
  });

  const exportFeature = useViewExportFeature({
    workspaceSlug,
    projectId,
    viewId: view?.id ?? "",
  });

  if (!view) return { items: [], modals: null };

  // Assemble final menu items - order defined here
  const items = [
    factory.createEditMenuItem(handlers.handleEdit, permissions.canEdit),
    ...(!isDetailPage ? (lockFeature?.items ?? []) : []),
    factory.createOpenInNewTabMenuItem(handlers.handleOpenInNewTab),
    factory.createCopyLinkMenuItem(handlers.handleCopyLink),
    ...exportFeature.items,
    factory.createDeleteMenuItem(handlers.handleDelete, permissions.canDelete),
  ].filter((item) => item.shouldRender !== false);

  // Assemble final modals
  const modals = exportFeature.modals;

  return { items, modals };
};

export const useLayoutMenuItems = (props: UseLayoutMenuItemsProps): MenuResult => {
  const factory = useQuickActionsFactory();
  const { workspaceSlug, projectId, storeType, ...handlers } = props;

  const exportFeature = useLayoutExportFeature({
    workspaceSlug,
    projectId,
    storeType,
  });

  // Assemble final menu items - order defined here
  const items = [
    factory.createOpenInNewTab(handlers.handleOpenInNewTab),
    factory.createCopyLayoutLinkMenuItem(handlers.handleCopyLink),
    ...exportFeature.items,
  ].filter((item) => item.shouldRender !== false);

  // Assemble final modals
  const modals = exportFeature.modals;

  return { items, modals };
};

export const useIntakeHeaderMenuItems = (props: {
  workspaceSlug: string;
  projectId: string;
  handleCopyLink: () => void;
}): MenuResult => {
  const factory = useQuickActionsFactory();

  const exportFeature = useIntakeExportFeature({
    workspaceSlug: props.workspaceSlug,
    projectId: props.projectId,
  });

  // Assemble final menu items - order defined here
  const items = [factory.createCopyLinkMenuItem(props.handleCopyLink), ...exportFeature.items].filter(
    (item) => item.shouldRender !== false
  );

  // Assemble final modals
  const modals = exportFeature.modals;

  return { items, modals };
};

type UseCommentMenuItemsProps = {
  comment: {
    id: string;
    actor: string;
    access: number | string;
  };
  isAuthor: boolean;
  showAccessSpecifier: boolean;
  showCopyLinkOption: boolean;
  handleEdit: () => void;
  handleCopyLink: () => void;
  handleToggleAccess: () => void;
  handleDelete: () => void;
};

export const useCommentMenuItems = (props: UseCommentMenuItemsProps): TContextMenuItem[] => {
  const factory = useQuickActionsFactory();
  const {
    comment,
    isAuthor,
    showAccessSpecifier,
    showCopyLinkOption,
    handleEdit,
    handleCopyLink,
    handleToggleAccess,
    handleDelete,
  } = props;

  // Check if access is INTERNAL (0 or "INTERNAL")
  const isInternal = comment.access === 0 || comment.access === "INTERNAL" || comment.access === "0";

  // Assemble final menu items - order defined here
  const items = [
    factory.createCommentEditMenuItem(handleEdit, isAuthor),
    factory.createCommentCopyLinkMenuItem(handleCopyLink, showCopyLinkOption),
    factory.createCommentAccessSpecifierMenuItem(handleToggleAccess, isInternal, showAccessSpecifier),
    factory.createCommentDeleteMenuItem(handleDelete, isAuthor),
  ].filter((item) => item.shouldRender !== false);

  return items;
};
