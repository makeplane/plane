"use client";

import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { LinkIcon, Signal, Trash2, UserMinus2, UserPlus2, Users } from "lucide-react";
// plane imports
import { DoubleCircleIcon } from "@plane/propel/icons";
import { EIssueServiceType, type TIssue } from "@plane/types";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { copyTextToClipboard } from "@plane/utils";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useUser } from "@/hooks/store/user";
// local imports
import { PowerKModalCommandItem } from "../../../modal/command-item";
import type { TPowerKPageKeys } from "../../../types";
import { PowerKMembersMenu } from "../members-menu";
import { PowerKPrioritiesMenu } from "./priorities-menu";
import { PowerKProjectStatesMenu } from "./states-menu";
import { useCallback } from "react";
import { useMember } from "@/hooks/store/use-member";

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
  const {
    issue: { getIssueById: getEpicById, getIssueIdByIdentifier: getEpicIdByIdentifier },
    updateIssue: updateEpic,
  } = useIssueDetail(EIssueServiceType.EPICS);
  const {
    project: { getProjectMemberIds },
  } = useMember();
  const { toggleDeleteIssueModal } = useCommandPalette();
  const { data: currentUser } = useUser();
  // derived values
  const workItemId = entityIdentifier ? getIssueIdByIdentifier(entityIdentifier.toString()) : null;
  const epicId = entityIdentifier ? getEpicIdByIdentifier(entityIdentifier.toString()) : null;
  const entityDetails = workItemId ? getIssueById(workItemId) : epicId ? getEpicById(epicId) : null;
  const isCurrentUserAssigned = entityDetails?.assignee_ids.includes(currentUser?.id ?? "");
  const projectMemberIds = entityDetails?.project_id ? getProjectMemberIds(entityDetails.project_id, false) : [];
  // handlers
  const updateEntity = workItemId ? updateIssue : updateEpic;

  const handleUpdateEntity = useCallback(
    async (formData: Partial<TIssue>) => {
      if (!workspaceSlug || !entityDetails || !entityDetails.project_id) return;
      await updateEntity(workspaceSlug.toString(), entityDetails.project_id, entityDetails.id, formData).catch(
        (error) => {
          console.error("Error in updating issue from Power K:", error);
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Issue could not be updated. Please try again.",
          });
        }
      );
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

  const handleDeleteIssue = useCallback(() => {
    toggleDeleteIssueModal(true);
    handleClose();
  }, [handleClose, toggleDeleteIssueModal]);

  const copyIssueUrlToClipboard = useCallback(() => {
    if (!workItemId) return;

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
  }, [workItemId]);

  if (!entityDetails) return null;

  return (
    <>
      {!activePage && (
        <Command.Group heading="Work item actions">
          <PowerKModalCommandItem
            icon={DoubleCircleIcon}
            label="Change state"
            onSelect={() => {
              handleUpdateSearchTerm("");
              handleUpdatePage("change-work-item-state");
            }}
          />
          <PowerKModalCommandItem
            icon={Signal}
            label="Change priority"
            onSelect={() => {
              handleUpdateSearchTerm("");
              handleUpdatePage("change-work-item-priority");
            }}
          />
          <PowerKModalCommandItem
            icon={Users}
            label="Assign to"
            onSelect={() => {
              handleUpdateSearchTerm("");
              handleUpdatePage("change-work-item-assignee");
            }}
          />
          <PowerKModalCommandItem
            icon={isCurrentUserAssigned ? UserMinus2 : UserPlus2}
            label={isCurrentUserAssigned ? "Un-assign from me" : "Assign to me"}
            onSelect={() => {
              if (!currentUser) return;
              handleUpdateAssignee(currentUser?.id);
              handleClose();
            }}
          />
          <PowerKModalCommandItem icon={Trash2} label="Delete" onSelect={handleDeleteIssue} />
          <PowerKModalCommandItem
            icon={LinkIcon}
            label="Copy URL"
            onSelect={() => {
              copyIssueUrlToClipboard();
              handleClose();
            }}
          />
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
