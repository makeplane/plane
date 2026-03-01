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
import { useQuickActionsFactory } from "@/components/common/quick-actions/factory";

// Types
interface UseCycleMenuItemsProps {
  cycleDetails: ICycle | undefined;
  isEditingAllowed: boolean;
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
  handleEdit: () => void;
  handleArchive: () => void;
  handleRestore: () => void;
  handleDelete: () => void;
  handleCopyLink: () => void;
  handleOpenInNewTab: () => void;
}

interface UseModuleMenuItemsProps {
  moduleDetails: IModule | undefined;
  isEditingAllowed: boolean;
  workspaceSlug: string;
  projectId: string;
  moduleId: string;
  handleEdit: () => void;
  handleArchive: () => void;
  handleRestore: () => void;
  handleDelete: () => void;
  handleCopyLink: () => void;
  handleOpenInNewTab: () => void;
}

interface UseViewMenuItemsProps {
  isOwner: boolean;
  isAdmin: boolean;
  workspaceSlug: string;
  projectId?: string;
  view: IProjectView | IWorkspaceView;
  handleEdit: () => void;
  handleDelete: () => void;
  handleCopyLink: () => void;
  handleOpenInNewTab: () => void;
}

interface UseLayoutMenuItemsProps {
  workspaceSlug: string;
  projectId: string;
  storeType: "PROJECT" | "EPIC";
  handleCopyLink: () => void;
  handleOpenInNewTab: () => void;
}

type MenuResult = {
  items: TContextMenuItem[];
  modals: JSX.Element | null;
};

export const useCycleMenuItems = (props: UseCycleMenuItemsProps): MenuResult => {
  const factory = useQuickActionsFactory();
  const { cycleDetails, isEditingAllowed, workspaceSlug, projectId, cycleId, ...handlers } = props;

  const isArchived = !!cycleDetails?.archived_at;
  const isCompleted = cycleDetails?.status?.toLowerCase() === "completed";
  const isCurrentCycle = cycleDetails?.status?.toLowerCase() === "current";
  const transferrableIssuesCount = cycleDetails
    ? cycleDetails.total_issues - (cycleDetails.cancelled_issues + cycleDetails.completed_issues)
    : 0;

  const endCycleFeature = factory.useCycleEndFeature?.({
    workspaceSlug,
    projectId,
    cycleId,
    cycleName: cycleDetails?.name,
    isCurrentCycle,
    transferrableIssuesCount,
  });

  const exportFeature = factory.useCycleExportFeature?.({
    workspaceSlug,
    projectId,
    cycleId,
    isArchived,
  });

  // Assemble final menu items - order defined here
  const items = [
    factory.createEditMenuItem(handlers.handleEdit, isEditingAllowed && !isCompleted && !isArchived),
    factory.createOpenInNewTabMenuItem(handlers.handleOpenInNewTab),
    factory.createCopyLinkMenuItem(handlers.handleCopyLink),
    ...(endCycleFeature?.items ?? []),
    ...(exportFeature?.items ?? []),
    factory.createArchiveMenuItem(handlers.handleArchive, {
      shouldRender: isEditingAllowed && !isArchived,
      disabled: !isCompleted,
      description: isCompleted ? undefined : "Only completed cycles can be archived",
    }),
    factory.createRestoreMenuItem(handlers.handleRestore, isEditingAllowed && isArchived),
    factory.createDeleteMenuItem(handlers.handleDelete, isEditingAllowed && !isCompleted && !isArchived),
  ].filter((item) => item.shouldRender !== false);

  // Assemble final modals
  const modals = (
    <>
      {endCycleFeature?.modals}
      {exportFeature?.modals}
    </>
  );

  return { items, modals };
};

export const useModuleMenuItems = (props: UseModuleMenuItemsProps): MenuResult => {
  const factory = useQuickActionsFactory();
  const { moduleDetails, isEditingAllowed, workspaceSlug, projectId, moduleId, ...handlers } = props;

  const isArchived = !!moduleDetails?.archived_at;
  const moduleState = moduleDetails?.status?.toLocaleLowerCase();
  const isInArchivableGroup = !!moduleState && ["completed", "cancelled"].includes(moduleState);

  const exportFeature = factory.useModuleExportFeature?.({
    workspaceSlug,
    projectId,
    moduleId,
    isArchived,
  });

  // Assemble final menu items - order defined here
  const items = [
    factory.createEditMenuItem(handlers.handleEdit, isEditingAllowed && !isArchived),
    factory.createOpenInNewTabMenuItem(handlers.handleOpenInNewTab),
    factory.createCopyLinkMenuItem(handlers.handleCopyLink),
    ...(exportFeature?.items ?? []),
    factory.createArchiveMenuItem(handlers.handleArchive, {
      shouldRender: isEditingAllowed && !isArchived,
      disabled: !isInArchivableGroup,
      description: isInArchivableGroup ? undefined : "Only completed or cancelled modules can be archived",
    }),
    factory.createRestoreMenuItem(handlers.handleRestore, isEditingAllowed && isArchived),
    factory.createDeleteMenuItem(handlers.handleDelete, isEditingAllowed),
  ].filter((item) => item.shouldRender !== false);

  // Assemble final modals
  const modals = exportFeature?.modals ?? null;

  return { items, modals };
};

export const useViewMenuItems = (props: UseViewMenuItemsProps): MenuResult => {
  const factory = useQuickActionsFactory();
  const { workspaceSlug, isOwner, isAdmin, projectId, view, ...handlers } = props;

  if (!view) return { items: [], modals: null };

  const lockFeature = factory.useViewLockFeature?.({
    workspaceSlug,
    projectId,
    viewId: view.id,
    isLocked: view.is_locked,
    isOwner,
  });

  const exportFeature = factory.useViewExportFeature?.({
    workspaceSlug,
    projectId,
    viewId: view.id,
  });

  // Assemble final menu items - order defined here
  const items = [
    factory.createEditMenuItem(handlers.handleEdit, isOwner),
    ...(lockFeature?.items ?? []),
    factory.createOpenInNewTabMenuItem(handlers.handleOpenInNewTab),
    factory.createCopyLinkMenuItem(handlers.handleCopyLink),
    ...(exportFeature?.items ?? []),
    factory.createDeleteMenuItem(handlers.handleDelete, isOwner || isAdmin),
  ].filter((item) => item.shouldRender !== false);

  // Assemble final modals
  const modals = exportFeature?.modals ?? null;

  return { items, modals };
};

export const useLayoutMenuItems = (props: UseLayoutMenuItemsProps): MenuResult => {
  const factory = useQuickActionsFactory();
  const { workspaceSlug, projectId, storeType, ...handlers } = props;

  const exportFeature = factory.useLayoutExportFeature?.({
    workspaceSlug,
    projectId,
    storeType,
  });

  // Assemble final menu items - order defined here
  const items = [
    factory.createOpenInNewTab(handlers.handleOpenInNewTab),
    factory.createCopyLayoutLinkMenuItem(handlers.handleCopyLink),
    ...(exportFeature?.items ?? []),
  ].filter((item) => item.shouldRender !== false);

  // Assemble final modals
  const modals = exportFeature?.modals ?? null;

  return { items, modals };
};

export const useIntakeHeaderMenuItems = (props: {
  workspaceSlug: string;
  projectId: string;
  handleCopyLink: () => void;
}): MenuResult => {
  const factory = useQuickActionsFactory();

  const exportFeature = factory.useIntakeExportFeature?.({
    workspaceSlug: props.workspaceSlug,
    projectId: props.projectId,
  });

  // Assemble final menu items - order defined here
  const items = [factory.createCopyLinkMenuItem(props.handleCopyLink), ...(exportFeature?.items ?? [])].filter(
    (item) => item.shouldRender !== false
  );

  // Assemble final modals
  const modals = exportFeature?.modals ?? null;

  return { items, modals };
};

interface UseCommentMenuItemsProps {
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
}

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
