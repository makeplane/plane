"use client";

import { useCallback } from "react";
import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { EIssueServiceType, type TIssue } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMember } from "@/hooks/store/use-member";
// local imports
import { PowerKMembersMenu } from "../../../menus/members";
import { PowerKModalCommandItem } from "../../../modal/command-item";
import type { TPowerKPageKeys } from "../../../types";
import { getPowerKWorkItemContextBasedActions } from "./actions";
import { PowerKWorkItemCyclesMenu } from "./cycles-menu";
import { PowerKWorkItemEstimatesMenu } from "./estimates-menu";
import { PowerKWorkItemLabelsMenu } from "./labels-menu";
import { PowerKWorkItemModulesMenu } from "./modules-menu";
import { PowerKWorkItemPrioritiesMenu } from "./priorities-menu";
import { PowerKProjectStatesMenu } from "./states-menu";

type Props = {
  activePage: TPowerKPageKeys | undefined;
  handleClose: () => void;
  handleUpdateSearchTerm: (searchTerm: string) => void;
  handleUpdatePage: (page: TPowerKPageKeys) => void;
};

export const PowerKWorkItemActionsMenu: React.FC<Props> = observer((props) => {
  const { activePage, handleClose, handleUpdateSearchTerm, handleUpdatePage } = props;
  // navigation
  const { workspaceSlug, workItem: entityIdentifier } = useParams();
  // store hooks
  const {
    issue: { getIssueById, getIssueIdByIdentifier },
    subscription: { getSubscriptionByIssueId, createSubscription, removeSubscription },
    updateIssue,
  } = useIssueDetail(EIssueServiceType.ISSUES);
  const {
    updateIssue: updateEpic,
    subscription: { createSubscription: createEpicSubscription, removeSubscription: removeEpicSubscription },
  } = useIssueDetail(EIssueServiceType.EPICS);
  const {
    project: { getProjectMemberIds },
  } = useMember();
  // derived values
  const entityId = entityIdentifier ? getIssueIdByIdentifier(entityIdentifier.toString()) : null;
  const entityDetails = entityId ? getIssueById(entityId) : null;
  const projectMemberIds = entityDetails?.project_id ? getProjectMemberIds(entityDetails.project_id, false) : [];
  const isEpic = !!entityDetails?.is_epic;
  const isSubscribed = Boolean(entityId ? getSubscriptionByIssueId(entityId) : false);
  // handlers
  const updateEntity = isEpic ? updateEpic : updateIssue;
  const createEntitySubscription = isEpic ? createEpicSubscription : createSubscription;
  const removeEntitySubscription = isEpic ? removeEpicSubscription : removeSubscription;
  // translation
  const { t } = useTranslation();

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

      const updatedAssignees = entityDetails.assignee_ids ?? [];
      if (updatedAssignees.includes(assigneeId)) updatedAssignees.splice(updatedAssignees.indexOf(assigneeId), 1);
      else updatedAssignees.push(assigneeId);

      handleUpdateEntity({ assignee_ids: updatedAssignees });
      handleClose();
    },
    [entityDetails, handleClose, handleUpdateEntity]
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

  const ACTIONS_LIST = getPowerKWorkItemContextBasedActions({
    handleClose,
    handleSubscription,
    handleUpdateAssignee,
    handleUpdatePage,
    handleUpdateSearchTerm,
    isSubscribed,
    workItemDetails: entityDetails,
  });

  if (!entityDetails) return null;

  return (
    <>
      {!activePage && (
        <Command.Group heading={t("power_k.contextual_actions.work_item.title")}>
          {ACTIONS_LIST.map((action) => {
            if (action.shouldRender === false) return null;

            return (
              <PowerKModalCommandItem
                key={action.key}
                icon={action.icon}
                label={t(action.i18n_label)}
                onSelect={action.action}
              />
            );
          })}
        </Command.Group>
      )}
      {/* states menu */}
      {activePage === "change-work-item-state" && (
        <PowerKProjectStatesMenu
          handleClose={handleClose}
          handleUpdateWorkItem={handleUpdateEntity}
          workItemDetails={entityDetails}
        />
      )}
      {/* priority menu */}
      {activePage === "change-work-item-priority" && (
        <PowerKWorkItemPrioritiesMenu
          handleClose={handleClose}
          handleUpdateWorkItem={handleUpdateEntity}
          workItemDetails={entityDetails}
        />
      )}
      {/* members menu */}
      {activePage === "change-work-item-assignee" && (
        <PowerKMembersMenu
          handleSelect={handleUpdateAssignee}
          userIds={projectMemberIds ?? undefined}
          value={entityDetails.assignee_ids}
        />
      )}
      {/* estimates menu */}
      {activePage === "change-work-item-estimate" && (
        <PowerKWorkItemEstimatesMenu
          handleClose={handleClose}
          handleUpdateWorkItem={handleUpdateEntity}
          workItemDetails={entityDetails}
        />
      )}
      {/* cycles menu */}
      {activePage === "change-work-item-cycle" && (
        <PowerKWorkItemCyclesMenu handleClose={handleClose} workItemDetails={entityDetails} />
      )}
      {/* modules menu */}
      {activePage === "change-work-item-module" && (
        <PowerKWorkItemModulesMenu handleClose={handleClose} workItemDetails={entityDetails} />
      )}
      {/* labels menu */}
      {activePage === "change-work-item-label" && (
        <PowerKWorkItemLabelsMenu
          handleClose={handleClose}
          handleUpdateWorkItem={handleUpdateEntity}
          workItemDetails={entityDetails}
        />
      )}
    </>
  );
});
