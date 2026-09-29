/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo } from "react";
import { XCircle, ArchiveRestoreIcon } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { LinkIcon, CopyIcon, NewTabIcon, EditIcon, ArchiveIcon, TrashIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { EIssuesStoreType, TIssue } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
import { copyUrlToClipboard, generateWorkItemLink } from "@plane/utils";
// types
import { createCopyMenuWithDuplication } from "@/plane-web/components/issues/issue-layouts/quick-action-dropdowns";

type TTranslate = (key: string, params?: Record<string, any>) => string;

// Generic helper function to handle optional function calls gracefully
// Overload for functions without parameters
export function handleOptionalAction(
  t: TTranslate,
  optionalFn: (() => void) | (() => Promise<void>) | undefined,
  actionName: string
): void;

// Overload for functions with one parameter
export function handleOptionalAction<T>(
  t: TTranslate,
  optionalFn: ((param: T) => void) | ((param: T) => Promise<void>) | undefined,
  actionName: string,
  param: T
): void;

// Implementation
export function handleOptionalAction<T>(
  t: TTranslate,
  optionalFn: (() => void) | (() => Promise<void>) | ((param: T) => void) | ((param: T) => Promise<void>) | undefined,
  actionName: string,
  param?: T
): void {
  if (optionalFn) {
    if (param !== undefined) {
      (optionalFn as (param: T) => void | Promise<void>)(param);
    } else {
      (optionalFn as () => void | Promise<void>)();
    }
  } else {
    setToast({
      type: TOAST_TYPE.ERROR,
      title: t("issue_ui.quick_actions.action_not_available"),
      message: t("issue_ui.quick_actions.not_implemented", { action: actionName }),
    });
  }
}

export interface MenuItemFactoryProps {
  issue: TIssue;
  workspaceSlug?: string;
  projectIdentifier?: string;
  activeLayout?: string;
  isEditingAllowed: boolean;
  isArchivingAllowed?: boolean;
  isDeletingAllowed: boolean;
  isRestoringAllowed?: boolean;
  isInArchivableGroup?: boolean;
  issueTypeDetail?: { is_active?: boolean };
  // Action handlers
  setIssueToEdit: (issue: TIssue | undefined) => void;
  setCreateUpdateIssueModal: (open: boolean) => void;
  setDeleteIssueModal: (open: boolean) => void;
  setArchiveIssueModal?: (open: boolean) => void;
  setDuplicateWorkItemModal?: (open: boolean) => void;
  handleRemoveFromView?: () => void;
  handleRestore?: () => Promise<void>;
  // External handlers
  handleDelete?: () => Promise<void>;
  handleUpdate?: (data: TIssue) => Promise<void>;
  handleArchive?: () => Promise<void>;
  // Context-specific data
  cycleId?: string;
  moduleId?: string;
  storeType?: EIssuesStoreType;
}

// Common action handlers hook
export const useIssueActionHandlers = (props: MenuItemFactoryProps) => {
  const { issue, workspaceSlug, projectIdentifier, handleRestore } = props;
  const { t } = useTranslation();

  const workItemLink = useMemo(
    () =>
      generateWorkItemLink({
        workspaceSlug,
        projectId: issue?.project_id,
        issueId: issue?.id,
        projectIdentifier,
        sequenceId: issue?.sequence_id,
      }),
    [workspaceSlug, projectIdentifier, issue]
  );

  const handleCopyIssueLink = () =>
    copyUrlToClipboard(workItemLink).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("link_copied"),
        message: t("common.copied_to_clipboard"),
      })
    );

  const handleOpenInNewTab = () => window.open(workItemLink, "_blank");

  const handleIssueRestore = async () => {
    if (!handleRestore) {
      handleOptionalAction(t, handleRestore, t("restore"));
      return;
    }
    await handleRestore()
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("issue_ui.quick_actions.restore_success_title"),
          message: t("issue_ui.quick_actions.restore_success_message"),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("toast.error"),
          message: t("issue_ui.quick_actions.restore_failed"),
        });
      });
  };

  return {
    workItemLink,
    handleCopyIssueLink,
    handleOpenInNewTab,
    handleIssueRestore,
  };
};

export const useMenuItemFactory = (props: MenuItemFactoryProps) => {
  const { t } = useTranslation();
  const actionHandlers = useIssueActionHandlers(props);

  const {
    issue,
    activeLayout = "",
    isEditingAllowed,
    isArchivingAllowed = false,
    isDeletingAllowed,
    isRestoringAllowed = false,
    isInArchivableGroup = false,
    issueTypeDetail,
    setIssueToEdit,
    setCreateUpdateIssueModal,
    setDeleteIssueModal,
    setArchiveIssueModal,
    setDuplicateWorkItemModal,
    handleRemoveFromView,
  } = props;

  const createEditMenuItem = (customEditAction?: () => void): TContextMenuItem => ({
    key: "edit",
    title: t("common.actions.edit"),
    icon: EditIcon,
    action:
      customEditAction ||
      (() => {
        setIssueToEdit(issue);
        setCreateUpdateIssueModal(true);
      }),
    shouldRender: isEditingAllowed,
  });

  const createCopyMenuItem = (workspaceSlug?: string): TContextMenuItem => {
    const baseItem = {
      key: "make-a-copy",
      title: t("common.actions.make_a_copy"),
      icon: CopyIcon,
      action: () => {
        setCreateUpdateIssueModal(true);
      },
      shouldRender: isEditingAllowed && (issueTypeDetail?.is_active ?? true),
    };

    return createCopyMenuWithDuplication({
      baseItem,
      activeLayout,
      setCreateUpdateIssueModal,
      setDuplicateWorkItemModal,
      workspaceSlug,
    });
  };

  const createOpenInNewTabMenuItem = (): TContextMenuItem => ({
    key: "open-in-new-tab",
    title: t("common.actions.open_in_new_tab"),
    icon: NewTabIcon,
    action: actionHandlers.handleOpenInNewTab,
  });

  const createCopyLinkMenuItem = (): TContextMenuItem => ({
    key: "copy-link",
    title: t("common.actions.copy_link"),
    icon: LinkIcon,
    action: actionHandlers.handleCopyIssueLink,
  });

  const createRemoveFromCycleMenuItem = (): TContextMenuItem => ({
    key: "remove-from-cycle",
    title: t("issue_ui.quick_actions.remove_from_cycle"),
    icon: XCircle,
    action: () => handleOptionalAction(t, handleRemoveFromView, t("issue_ui.quick_actions.remove_from_cycle")),
    shouldRender: isEditingAllowed,
  });

  const createRemoveFromModuleMenuItem = (): TContextMenuItem => ({
    key: "remove-from-module",
    title: t("issue_ui.quick_actions.remove_from_module"),
    icon: XCircle,
    action: () => handleOptionalAction(t, handleRemoveFromView, t("issue_ui.quick_actions.remove_from_module")),
    shouldRender: isEditingAllowed,
  });

  const createArchiveMenuItem = (): TContextMenuItem => ({
    key: "archive",
    title: t("common.actions.archive"),
    description: isInArchivableGroup ? undefined : t("issue.archive.description"),
    icon: ArchiveIcon,
    className: "items-start",
    iconClassName: "mt-1",
    action: () => handleOptionalAction(t, setArchiveIssueModal, t("common.actions.archive"), true),
    disabled: !isInArchivableGroup,
    shouldRender: isArchivingAllowed,
  });

  const createRestoreMenuItem = (): TContextMenuItem => ({
    key: "restore",
    title: t("restore"),
    icon: ArchiveRestoreIcon,
    action: actionHandlers.handleIssueRestore,
    shouldRender: isRestoringAllowed,
  });

  const createDeleteMenuItem = (): TContextMenuItem => ({
    key: "delete",
    title: t("common.actions.delete"),
    icon: TrashIcon,
    action: () => {
      setDeleteIssueModal(true);
    },
    shouldRender: isDeletingAllowed,
  });

  return {
    ...actionHandlers,
    createEditMenuItem,
    createCopyMenuItem,
    createOpenInNewTabMenuItem,
    createCopyLinkMenuItem,
    createRemoveFromCycleMenuItem,
    createRemoveFromModuleMenuItem,
    createArchiveMenuItem,
    createRestoreMenuItem,
    createDeleteMenuItem,
  };
};

// Predefined menu item sets for different contexts
export const useProjectIssueMenuItems = (props: MenuItemFactoryProps): TContextMenuItem[] => {
  const factory = useMenuItemFactory(props);

  return useMemo(
    () => [
      factory.createEditMenuItem(),
      factory.createCopyMenuItem(),
      factory.createOpenInNewTabMenuItem(),
      factory.createCopyLinkMenuItem(),
      factory.createArchiveMenuItem(),
      factory.createDeleteMenuItem(),
    ],
    [factory]
  );
};

export const useWorkItemDetailMenuItems = (props: MenuItemFactoryProps): TContextMenuItem[] => {
  const factory = useMenuItemFactory(props);

  return useMemo(
    () => [
      factory.createCopyMenuItem(props.workspaceSlug),
      factory.createOpenInNewTabMenuItem(),
      factory.createArchiveMenuItem(),
      factory.createRestoreMenuItem(),
      factory.createDeleteMenuItem(),
    ],
    [factory]
  );
};

export const useAllIssueMenuItems = (props: MenuItemFactoryProps): TContextMenuItem[] => {
  const factory = useMenuItemFactory(props);

  return useMemo(
    () => [
      factory.createEditMenuItem(),
      factory.createCopyMenuItem(),
      factory.createOpenInNewTabMenuItem(),
      factory.createCopyLinkMenuItem(),
      factory.createArchiveMenuItem(),
      factory.createDeleteMenuItem(),
    ],
    [factory]
  );
};

export const useCycleIssueMenuItems = (props: MenuItemFactoryProps): TContextMenuItem[] => {
  const factory = useMenuItemFactory(props);

  const customEditAction = () => {
    props.setIssueToEdit({
      ...props.issue,
      cycle_id: props.cycleId ?? null,
    });
    props.setCreateUpdateIssueModal(true);
  };

  return useMemo(
    () => [
      factory.createEditMenuItem(customEditAction),
      factory.createCopyMenuItem(),
      factory.createOpenInNewTabMenuItem(),
      factory.createCopyLinkMenuItem(),
      factory.createRemoveFromCycleMenuItem(),
      factory.createArchiveMenuItem(),
      factory.createDeleteMenuItem(),
    ],
    [factory, props.cycleId]
  );
};

export const useModuleIssueMenuItems = (props: MenuItemFactoryProps): TContextMenuItem[] => {
  const factory = useMenuItemFactory(props);

  const customEditAction = () => {
    props.setIssueToEdit({
      ...props.issue,
      module_ids: props.moduleId ? [props.moduleId] : [],
    });
    props.setCreateUpdateIssueModal(true);
  };

  return useMemo(
    () => [
      factory.createEditMenuItem(customEditAction),
      factory.createCopyMenuItem(),
      factory.createOpenInNewTabMenuItem(),
      factory.createCopyLinkMenuItem(),
      factory.createRemoveFromModuleMenuItem(),
      factory.createArchiveMenuItem(),
      factory.createDeleteMenuItem(),
    ],
    [factory, props.moduleId]
  );
};

export const useArchivedIssueMenuItems = (props: MenuItemFactoryProps): TContextMenuItem[] => {
  const factory = useMenuItemFactory(props);

  return useMemo(
    () => [
      factory.createRestoreMenuItem(),
      factory.createOpenInNewTabMenuItem(),
      factory.createCopyLinkMenuItem(),
      factory.createDeleteMenuItem(),
    ],
    [factory]
  );
};
