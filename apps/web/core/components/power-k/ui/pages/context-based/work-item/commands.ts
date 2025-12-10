import { useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Bell,
  BellOff,
  Signal,
  TagIcon,
  TicketCheck,
  Triangle,
  Type,
  UserMinus2,
  UserPlus2,
  Users,
} from "lucide-react";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { LinkIcon, TrashIcon, ContrastIcon, DiceIcon, DoubleCircleIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { ICycle, IIssueLabel, IModule, TIssue, TIssuePriorities } from "@plane/types";
import { EIssueServiceType, EUserPermissions } from "@plane/types";
import { copyTextToClipboard } from "@plane/utils";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";

export const usePowerKWorkItemContextBasedCommands = (): TPowerKCommandConfig[] => {
  // params
  const { workspaceSlug, workItem: entityIdentifier } = useParams();
  // store
  const {
    data: currentUser,
    permission: { allowPermissions },
  } = useUser();
  const { toggleDeleteIssueModal } = useCommandPalette();
  const { getProjectById } = useProject();
  const { areEstimateEnabledByProjectId } = useProjectEstimates();
  const {
    issue: { getIssueById, getIssueIdByIdentifier, addCycleToIssue, removeIssueFromCycle, changeModulesInIssue },
    subscription: { getSubscriptionByIssueId, createSubscription, removeSubscription },
    updateIssue,
  } = useIssueDetail(EIssueServiceType.ISSUES);
  const {
    issue: {
      addCycleToIssue: addCycleToEpic,
      removeIssueFromCycle: removeEpicFromCycle,
      changeModulesInIssue: changeModulesInEpic,
    },
    subscription: { createSubscription: createEpicSubscription, removeSubscription: removeEpicSubscription },
    updateIssue: updateEpic,
  } = useIssueDetail(EIssueServiceType.EPICS);
  // derived values
  const entityId = entityIdentifier ? getIssueIdByIdentifier(entityIdentifier.toString()) : null;
  const entityDetails = entityId ? getIssueById(entityId) : null;
  const isEpic = !!entityDetails?.is_epic;
  const projectDetails = entityDetails?.project_id ? getProjectById(entityDetails?.project_id) : undefined;
  const isCurrentUserAssigned = !!entityDetails?.assignee_ids?.includes(currentUser?.id ?? "");
  const isEstimateEnabled = entityDetails?.project_id
    ? areEstimateEnabledByProjectId(entityDetails?.project_id)
    : false;
  const isSubscribed = Boolean(entityId ? getSubscriptionByIssueId(entityId) : false);
  // translation
  const { t } = useTranslation();
  // handlers
  const updateEntity = isEpic ? updateEpic : updateIssue;
  const createEntitySubscription = isEpic ? createEpicSubscription : createSubscription;
  const removeEntitySubscription = isEpic ? removeEpicSubscription : removeSubscription;
  // permission
  const isEditingAllowed =
    allowPermissions(
      [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
      EUserPermissionsLevel.PROJECT,
      workspaceSlug?.toString(),
      entityDetails?.project_id ?? undefined
    ) && !entityDetails?.archived_at;

  const handleUpdateEntity = useCallback(
    async (formData: Partial<TIssue>) => {
      if (!workspaceSlug || !entityDetails || !entityDetails.project_id) return;
      await updateEntity(workspaceSlug.toString(), entityDetails.project_id, entityDetails.id, formData).catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: `${isEpic ? "Epic" : "Work item"} could not be updated. Please try again.`,
        });
      });
    },
    [entityDetails, isEpic, updateEntity, workspaceSlug]
  );

  const handleUpdateAssignee = useCallback(
    (assigneeId: string) => {
      if (!entityDetails) return;

      const updatedAssignees = [...(entityDetails.assignee_ids ?? [])];
      if (updatedAssignees.includes(assigneeId)) updatedAssignees.splice(updatedAssignees.indexOf(assigneeId), 1);
      else updatedAssignees.push(assigneeId);

      handleUpdateEntity({ assignee_ids: updatedAssignees });
    },
    [entityDetails, handleUpdateEntity]
  );

  const handleSubscription = useCallback(async () => {
    if (!workspaceSlug || !entityDetails || !entityDetails.project_id) return;

    try {
      if (isSubscribed) {
        await removeEntitySubscription(workspaceSlug.toString(), entityDetails.project_id, entityDetails.id);
      } else {
        await createEntitySubscription(workspaceSlug.toString(), entityDetails.project_id, entityDetails.id);
      }
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("toast.success"),
        message: isSubscribed
          ? t("issue.subscription.actions.unsubscribed")
          : t("issue.subscription.actions.subscribed"),
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("toast.error"),
        message: t("common.error.message"),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createEntitySubscription, entityDetails, isSubscribed, removeEntitySubscription, workspaceSlug]);

  const handleDeleteWorkItem = useCallback(() => {
    toggleDeleteIssueModal(true);
  }, [toggleDeleteIssueModal]);

  const copyWorkItemIdToClipboard = useCallback(() => {
    const id = `${projectDetails?.identifier}-${entityDetails?.sequence_id}`;
    copyTextToClipboard(id)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("power_k.contextual_actions.work_item.copy_id_toast_success"),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("power_k.contextual_actions.work_item.copy_id_toast_error"),
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityDetails?.sequence_id, projectDetails?.identifier]);

  const copyWorkItemTitleToClipboard = useCallback(() => {
    copyTextToClipboard(entityDetails?.name ?? "")
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("power_k.contextual_actions.work_item.copy_title_toast_success"),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("power_k.contextual_actions.work_item.copy_title_toast_error"),
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityDetails?.name]);

  const copyWorkItemUrlToClipboard = useCallback(() => {
    const url = new URL(window.location.href);
    copyTextToClipboard(url.href)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("power_k.contextual_actions.work_item.copy_url_toast_success"),
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("power_k.contextual_actions.work_item.copy_url_toast_error"),
        });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [
    {
      id: "change_work_item_state",
      i18n_title: "power_k.contextual_actions.work_item.change_state",
      icon: DoubleCircleIcon,
      group: "contextual",
      contextType: "work-item",
      type: "change-page",
      page: "update-work-item-state",
      onSelect: (data) => {
        const stateId = data as string;
        if (entityDetails?.state_id === stateId) return;
        handleUpdateEntity({
          state_id: stateId,
        });
      },
      shortcut: "s",
      isEnabled: () => isEditingAllowed,
      isVisible: () => isEditingAllowed,
      closeOnSelect: true,
    },
    {
      id: "change_work_item_priority",
      i18n_title: "power_k.contextual_actions.work_item.change_priority",
      icon: Signal,
      group: "contextual",
      contextType: "work-item",
      type: "change-page",
      page: "update-work-item-priority",
      onSelect: (data) => {
        const priority = data as TIssuePriorities;
        if (entityDetails?.priority === priority) return;
        handleUpdateEntity({
          priority,
        });
      },
      shortcut: "p",
      isEnabled: () => isEditingAllowed,
      isVisible: () => isEditingAllowed,
      closeOnSelect: true,
    },
    {
      id: "change_work_item_assignees",
      i18n_title: "power_k.contextual_actions.work_item.change_assignees",
      icon: Users,
      group: "contextual",
      contextType: "work-item",
      type: "change-page",
      page: "update-work-item-assignee",
      onSelect: (data) => {
        const assigneeId = data as string;
        handleUpdateAssignee(assigneeId);
      },
      shortcut: "a",
      isEnabled: () => isEditingAllowed,
      isVisible: () => isEditingAllowed,
      closeOnSelect: false,
    },
    {
      id: "assign_work_item_to_me",
      i18n_title: isCurrentUserAssigned
        ? "power_k.contextual_actions.work_item.unassign_from_me"
        : "power_k.contextual_actions.work_item.assign_to_me",
      icon: isCurrentUserAssigned ? UserMinus2 : UserPlus2,
      group: "contextual",
      contextType: "work-item",
      type: "action",
      action: () => {
        if (!currentUser) return;
        handleUpdateAssignee(currentUser.id);
      },
      shortcut: "i",
      isEnabled: () => isEditingAllowed,
      isVisible: () => isEditingAllowed,
      closeOnSelect: true,
    },
    {
      id: "change_work_item_estimate",
      i18n_title: "power_k.contextual_actions.work_item.change_estimate",
      icon: Triangle,
      group: "contextual",
      contextType: "work-item",
      type: "change-page",
      page: "update-work-item-estimate",
      onSelect: (data) => {
        const estimatePointId = data as string | null;
        if (entityDetails?.estimate_point === estimatePointId) return;
        handleUpdateEntity({
          estimate_point: estimatePointId,
        });
      },
      modifierShortcut: "shift+e",
      isEnabled: () => isEstimateEnabled && isEditingAllowed,
      isVisible: () => isEstimateEnabled && isEditingAllowed,
      closeOnSelect: true,
    },
    {
      id: "add_work_item_to_cycle",
      i18n_title: "power_k.contextual_actions.work_item.add_to_cycle",
      icon: ContrastIcon,
      group: "contextual",
      contextType: "work-item",
      type: "change-page",
      page: "update-work-item-cycle",
      onSelect: (data) => {
        const cycleId = (data as ICycle)?.id;
        if (!workspaceSlug || !entityDetails || !entityDetails.project_id) return;
        if (entityDetails.cycle_id === cycleId) return;
        // handlers
        const addCycleToEntity = entityDetails.is_epic ? addCycleToEpic : addCycleToIssue;
        const removeCycleFromEntity = entityDetails.is_epic ? removeEpicFromCycle : removeIssueFromCycle;

        try {
          if (cycleId) {
            addCycleToEntity(workspaceSlug.toString(), entityDetails.project_id, cycleId, entityDetails.id);
          } else {
            removeCycleFromEntity(
              workspaceSlug.toString(),
              entityDetails.project_id,
              entityDetails.cycle_id ?? "",
              entityDetails.id
            );
          }
        } catch {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: `${entityDetails.is_epic ? "Epic" : "Work item"} could not be updated. Please try again.`,
          });
        }
      },
      modifierShortcut: "shift+c",
      isEnabled: () => Boolean(projectDetails?.cycle_view && isEditingAllowed),
      isVisible: () => Boolean(projectDetails?.cycle_view && isEditingAllowed),
      closeOnSelect: true,
    },
    {
      id: "add_work_item_to_modules",
      i18n_title: "power_k.contextual_actions.work_item.add_to_modules",
      icon: DiceIcon,
      group: "contextual",
      contextType: "work-item",
      type: "change-page",
      page: "update-work-item-module",
      onSelect: (data) => {
        const moduleId = (data as IModule)?.id;
        if (!workspaceSlug || !entityDetails || !entityDetails.project_id) return;
        // handlers
        const changeModulesInEntity = entityDetails.is_epic ? changeModulesInEpic : changeModulesInIssue;
        try {
          if (entityDetails.module_ids?.includes(moduleId)) {
            changeModulesInEntity(workspaceSlug.toString(), entityDetails.project_id, entityDetails.id, [], [moduleId]);
          } else {
            changeModulesInEntity(workspaceSlug.toString(), entityDetails.project_id, entityDetails.id, [moduleId], []);
          }
        } catch {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: `${entityDetails.is_epic ? "Epic" : "Work item"} could not be updated. Please try again.`,
          });
        }
      },
      modifierShortcut: "shift+m",
      isEnabled: () => Boolean(projectDetails?.module_view && isEditingAllowed),
      isVisible: () => Boolean(projectDetails?.module_view && isEditingAllowed),
      closeOnSelect: false,
    },
    {
      id: "add_work_item_labels",
      i18n_title: "power_k.contextual_actions.work_item.add_labels",
      icon: TagIcon,
      group: "contextual",
      contextType: "work-item",
      type: "change-page",
      page: "update-work-item-labels",
      onSelect: (data) => {
        const labelId = (data as IIssueLabel)?.id;
        if (!workspaceSlug || !entityDetails || !entityDetails.project_id) return;
        const updatedLabels = [...(entityDetails.label_ids ?? [])];
        if (updatedLabels.includes(labelId)) updatedLabels.splice(updatedLabels.indexOf(labelId), 1);
        else updatedLabels.push(labelId);
        handleUpdateEntity({
          label_ids: updatedLabels,
        });
      },
      shortcut: "l",
      isEnabled: () => isEditingAllowed,
      isVisible: () => isEditingAllowed,
      closeOnSelect: false,
    },
    {
      id: "subscribe_work_item",
      i18n_title: isSubscribed
        ? "power_k.contextual_actions.work_item.unsubscribe"
        : "power_k.contextual_actions.work_item.subscribe",
      icon: isSubscribed ? BellOff : Bell,
      group: "contextual",
      contextType: "work-item",
      type: "action",
      action: handleSubscription,
      modifierShortcut: "shift+s",
      isEnabled: () => isEditingAllowed,
      isVisible: () => isEditingAllowed,
      closeOnSelect: true,
    },
    {
      id: "delete_work_item",
      i18n_title: "power_k.contextual_actions.work_item.delete",
      icon: TrashIcon,
      group: "contextual",
      contextType: "work-item",
      type: "action",
      action: handleDeleteWorkItem,
      modifierShortcut: "cmd+backspace",
      isEnabled: () => isEditingAllowed,
      isVisible: () => isEditingAllowed,
      closeOnSelect: true,
    },
    {
      id: "copy_work_item_id",
      i18n_title: "power_k.contextual_actions.work_item.copy_id",
      icon: TicketCheck,
      group: "contextual",
      contextType: "work-item",
      type: "action",
      action: copyWorkItemIdToClipboard,
      modifierShortcut: "cmd+.",
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
    {
      id: "copy_work_item_title",
      i18n_title: "power_k.contextual_actions.work_item.copy_title",
      icon: Type,
      group: "contextual",
      contextType: "work-item",
      type: "action",
      action: copyWorkItemTitleToClipboard,
      modifierShortcut: "cmd+shift+'",
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
    {
      id: "copy_work_item_url",
      i18n_title: "power_k.contextual_actions.work_item.copy_url",
      icon: LinkIcon,
      group: "contextual",
      contextType: "work-item",
      type: "action",
      action: copyWorkItemUrlToClipboard,
      modifierShortcut: "cmd+shift+,",
      isEnabled: () => true,
      isVisible: () => true,
      closeOnSelect: true,
    },
  ];
};
