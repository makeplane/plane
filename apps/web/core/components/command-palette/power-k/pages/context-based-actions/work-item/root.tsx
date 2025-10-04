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
import { PowerKModalCommandItem } from "../../../modal/command-item";
import type { TPowerKPageKeys } from "../../../types";
import { PowerKMembersMenu } from "../members-menu";
import { getPowerKWorkItemContextBasedActions } from "./actions";
import { PowerKPrioritiesMenu } from "./priorities-menu";
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
    updateIssue,
  } = useIssueDetail(EIssueServiceType.ISSUES);
  const { updateIssue: updateEpic } = useIssueDetail(EIssueServiceType.EPICS);
  const {
    project: { getProjectMemberIds },
  } = useMember();
  // derived values
  const entityId = entityIdentifier ? getIssueIdByIdentifier(entityIdentifier.toString()) : null;
  const entityDetails = entityId ? getIssueById(entityId) : null;
  const projectMemberIds = entityDetails?.project_id ? getProjectMemberIds(entityDetails.project_id, false) : [];
  const isEpic = !!entityDetails?.is_epic;
  // handlers
  const updateEntity = isEpic ? updateEpic : updateIssue;
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
    [entityDetails, updateEntity, workspaceSlug]
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

  const ACTIONS_LIST = getPowerKWorkItemContextBasedActions({
    handleClose,
    handleUpdateAssignee,
    handleUpdatePage,
    handleUpdateSearchTerm,
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
      {activePage === "change-work-item-state" && entityDetails && (
        <PowerKProjectStatesMenu
          handleClose={handleClose}
          handleUpdateIssue={handleUpdateEntity}
          issue={entityDetails}
        />
      )}
      {/* priority menu */}
      {activePage === "change-work-item-priority" && entityDetails && (
        <PowerKPrioritiesMenu handleClose={handleClose} handleUpdateIssue={handleUpdateEntity} issue={entityDetails} />
      )}
      {/* members menu */}
      {activePage === "change-work-item-assignee" && entityDetails && (
        <PowerKMembersMenu
          handleUpdateMember={handleUpdateAssignee}
          userIds={projectMemberIds ?? undefined}
          value={entityDetails.assignee_ids}
        />
      )}
    </>
  );
});
