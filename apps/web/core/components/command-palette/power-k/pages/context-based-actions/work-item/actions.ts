import { LinkIcon, Signal, Trash2, UserMinus2, UserPlus2, Users } from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { DoubleCircleIcon } from "@plane/propel/icons";
import { EUserPermissions, TIssue } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { copyTextToClipboard } from "@plane/utils";
// lib
import { store } from "@/lib/store-context";
// local imports
import type { ContextBasedAction, TPowerKPageKeys } from "../../../types";

type TArgs = {
  handleClose: () => void;
  handleUpdateAssignee: (assigneeId: string) => void;
  handleUpdatePage: (page: TPowerKPageKeys) => void;
  handleUpdateSearchTerm: (searchTerm: string) => void;
  workItemDetails: TIssue | undefined | null;
};

export const getPowerKWorkItemContextBasedActions = (args: TArgs): ContextBasedAction[] => {
  const { handleClose, handleUpdateAssignee, handleUpdatePage, handleUpdateSearchTerm, workItemDetails } = args;
  // store
  const { workspaceSlug } = store.router;
  const { data: currentUser } = store.user;
  const { allowPermissions } = store.user.permission;
  const { toggleDeleteIssueModal } = store.commandPalette;
  // derived values
  const isCurrentUserAssigned = workItemDetails?.assignee_ids.includes(currentUser?.id ?? "");
  // permission
  const isEditingAllowed =
    allowPermissions(
      [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
      EUserPermissionsLevel.PROJECT,
      workspaceSlug?.toString(),
      workItemDetails?.project_id ?? undefined
    ) && !workItemDetails?.archived_at;

  const handleDeleteWorkItem = () => {
    toggleDeleteIssueModal(true);
    handleClose();
  };

  const copyWorkItemUrlToClipboard = () => {
    const url = new URL(window.location.href);
    copyTextToClipboard(url.href)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Copied to clipboard",
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Some error occurred",
        });
      });
  };

  return [
    {
      key: "change-state",
      i18n_label: "power_k.contextual_actions.work_item.change_state",
      icon: DoubleCircleIcon,
      action: () => {
        handleUpdateSearchTerm("");
        handleUpdatePage("change-work-item-state");
      },
      shouldRender: isEditingAllowed,
    },
    {
      key: "change-priority",
      i18n_label: "power_k.contextual_actions.work_item.change_priority",
      icon: Signal,
      action: () => {
        handleUpdateSearchTerm("");
        handleUpdatePage("change-work-item-priority");
      },
      shouldRender: isEditingAllowed,
    },
    {
      key: "change-assignee",
      i18n_label: "power_k.contextual_actions.work_item.change_assignee",
      icon: Users,
      action: () => {
        handleUpdateSearchTerm("");
        handleUpdatePage("change-work-item-assignee");
      },
      shouldRender: isEditingAllowed,
    },
    {
      key: "assign-to-me",
      i18n_label: isCurrentUserAssigned
        ? "power_k.contextual_actions.work_item.unassign_from_me"
        : "power_k.contextual_actions.work_item.assign_to_me",
      icon: isCurrentUserAssigned ? UserMinus2 : UserPlus2,
      action: () => {
        if (!currentUser) return;
        handleUpdateAssignee(currentUser.id);
        handleClose();
      },
      shouldRender: isEditingAllowed,
    },
    {
      key: "delete",
      i18n_label: "power_k.contextual_actions.work_item.delete",
      icon: Trash2,
      action: () => {
        handleClose();
        handleDeleteWorkItem();
      },
      shouldRender: isEditingAllowed,
    },
    {
      key: "copy-url",
      i18n_label: "power_k.contextual_actions.work_item.copy_url",
      icon: LinkIcon,
      action: () => {
        handleClose();
        copyWorkItemUrlToClipboard();
      },
    },
  ];
};
