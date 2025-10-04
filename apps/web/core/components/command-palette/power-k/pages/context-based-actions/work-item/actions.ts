import { Bell, BellOff, LinkIcon, Signal, TagIcon, Trash2, Triangle, UserMinus2, UserPlus2, Users } from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { ContrastIcon, DiceIcon, DoubleCircleIcon } from "@plane/propel/icons";
import { EUserPermissions, TIssue } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { copyTextToClipboard } from "@plane/utils";
// lib
import { store } from "@/lib/store-context";
// local imports
import type { ContextBasedAction, TPowerKPageKeys } from "../../../types";

type TArgs = {
  handleClose: () => void;
  handleSubscription: () => void;
  handleUpdateAssignee: (assigneeId: string) => void;
  handleUpdatePage: (page: TPowerKPageKeys) => void;
  handleUpdateSearchTerm: (searchTerm: string) => void;
  isSubscribed: boolean;
  workItemDetails: TIssue | undefined | null;
};

export const getPowerKWorkItemContextBasedActions = (args: TArgs): ContextBasedAction[] => {
  const {
    handleClose,
    handleSubscription,
    handleUpdateAssignee,
    handleUpdatePage,
    handleUpdateSearchTerm,
    isSubscribed,
    workItemDetails,
  } = args;
  // store
  const { workspaceSlug } = store.router;
  const { data: currentUser } = store.user;
  const { allowPermissions } = store.user.permission;
  const { toggleDeleteIssueModal } = store.commandPalette;
  const { getProjectById } = store.projectRoot.project;
  const { areEstimateEnabledByProjectId } = store.projectEstimate;
  // derived values
  const projectDetails = workItemDetails?.project_id ? getProjectById(workItemDetails?.project_id) : undefined;
  const isCurrentUserAssigned = workItemDetails?.assignee_ids.includes(currentUser?.id ?? "");
  const isEstimateEnabled = workItemDetails?.project_id
    ? areEstimateEnabledByProjectId(workItemDetails?.project_id)
    : false;
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
      key: "change-assignees",
      i18n_label: "power_k.contextual_actions.work_item.change_assignees",
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
      key: "change-estimate",
      i18n_label: "power_k.contextual_actions.work_item.change_estimate",
      icon: Triangle,
      action: () => {
        handleUpdateSearchTerm("");
        handleUpdatePage("change-work-item-estimate");
      },
      shouldRender: isEstimateEnabled && isEditingAllowed,
    },
    {
      key: "add-to-cycle",
      i18n_label: "power_k.contextual_actions.work_item.add_to_cycle",
      icon: ContrastIcon,
      action: () => {
        handleUpdateSearchTerm("");
        handleUpdatePage("change-work-item-cycle");
      },
      shouldRender: Boolean(projectDetails?.cycle_view && isEditingAllowed),
    },
    {
      key: "add-to-modules",
      i18n_label: "power_k.contextual_actions.work_item.add_to_modules",
      icon: DiceIcon,
      action: () => {
        handleUpdateSearchTerm("");
        handleUpdatePage("change-work-item-module");
      },
      shouldRender: Boolean(projectDetails?.module_view && isEditingAllowed),
    },
    {
      key: "add-labels",
      i18n_label: "power_k.contextual_actions.work_item.add_labels",
      icon: TagIcon,
      action: () => {
        handleUpdateSearchTerm("");
        handleUpdatePage("change-work-item-label");
      },
      shouldRender: isEditingAllowed,
    },
    {
      key: "subscribe",
      i18n_label: isSubscribed
        ? "power_k.contextual_actions.work_item.unsubscribe"
        : "power_k.contextual_actions.work_item.subscribe",
      icon: isSubscribed ? BellOff : Bell,
      action: () => {
        handleClose();
        handleSubscription();
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
