"use client";

import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { LinkIcon, Signal, Trash2, UserMinus2, UserPlus2, Users } from "lucide-react";
// plane constants
import { EIssuesStoreType } from "@plane/constants";
// plane types
import { TIssue, TPowerKPageKeys } from "@plane/types";
// hooks
import { DoubleCircleIcon, TOAST_TYPE, setToast } from "@plane/ui";
// helpers
import { copyTextToClipboard } from "@/helpers/string.helper";
// hooks
import { useCommandPalette, useIssueDetail, useIssues, useUser } from "@/hooks/store";
// local components
import { PowerKCommandItem } from "../../command-item";
import { PowerKMembersMenu } from "../members-menu";
import { PowerKPrioritiesMenu } from "./priorities-menu";
import { PowerKProjectStatesMenu } from "./states-menu";

type Props = {
  activePage: TPowerKPageKeys | undefined;
  handleClose: () => void;
  handleUpdateSearchTerm: (searchTerm: string) => void;
  handleUpdatePage: (page: TPowerKPageKeys) => void;
  issueId: string;
};

export const PowerKIssueActionsMenu: React.FC<Props> = observer((props) => {
  const { activePage, handleClose, handleUpdateSearchTerm, handleUpdatePage, issueId } = props;
  // navigation
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const {
    issues: { updateIssue },
  } = useIssues(EIssuesStoreType.PROJECT);
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  const { toggleDeleteIssueModal } = useCommandPalette();
  const { data: currentUser } = useUser();
  // derived values
  const issueDetails = getIssueById(issueId);
  const isCurrentUserAssigned = issueDetails?.assignee_ids.includes(currentUser?.id ?? "");

  const handleUpdateIssue = async (formData: Partial<TIssue>) => {
    if (!workspaceSlug || !projectId || !issueDetails) return;
    await updateIssue(workspaceSlug.toString(), projectId.toString(), issueDetails.id, formData).catch((error) => {
      console.error("Error in updating issue from Power K:", error);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Issue could not be updated. Please try again.",
      });
    });
  };

  const handleUpdateAssignee = (assigneeId: string) => {
    if (!issueDetails) return;

    const updatedAssignees = issueDetails.assignee_ids ?? [];
    if (updatedAssignees.includes(assigneeId)) updatedAssignees.splice(updatedAssignees.indexOf(assigneeId), 1);
    else updatedAssignees.push(assigneeId);

    handleUpdateIssue({ assignee_ids: updatedAssignees });
    handleClose();
  };

  const handleDeleteIssue = () => {
    toggleDeleteIssueModal(true);
    handleClose();
  };

  const copyIssueUrlToClipboard = () => {
    if (!issueId) return;

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

  return (
    <>
      {!activePage && (
        <Command.Group heading="Work item actions">
          <PowerKCommandItem
            icon={DoubleCircleIcon}
            label="Change state"
            onSelect={() => {
              handleUpdateSearchTerm("");
              handleUpdatePage("change-issue-state");
            }}
          />
          <PowerKCommandItem
            icon={Signal}
            label="Change priority"
            onSelect={() => {
              handleUpdateSearchTerm("");
              handleUpdatePage("change-issue-priority");
            }}
          />
          <PowerKCommandItem
            icon={Users}
            label="Assign to"
            onSelect={() => {
              handleUpdateSearchTerm("");
              handleUpdatePage("change-issue-assignee");
            }}
          />
          <PowerKCommandItem
            icon={isCurrentUserAssigned ? UserMinus2 : UserPlus2}
            label={isCurrentUserAssigned ? "Un-assign from me" : "Assign to me"}
            onSelect={() => {
              if (!currentUser) return;
              handleUpdateAssignee(currentUser?.id);
              handleClose();
            }}
          />
          <PowerKCommandItem icon={Trash2} label="Delete work item" onSelect={handleDeleteIssue} />
          <PowerKCommandItem
            icon={LinkIcon}
            label="Copy work item URL"
            onSelect={() => {
              copyIssueUrlToClipboard();
              handleClose();
            }}
          />
        </Command.Group>
      )}
      {/* states menu */}
      {activePage === "change-issue-state" && issueDetails && (
        <PowerKProjectStatesMenu handleClose={handleClose} handleUpdateIssue={handleUpdateIssue} issue={issueDetails} />
      )}
      {/* priority menu */}
      {activePage === "change-issue-priority" && issueDetails && (
        <PowerKPrioritiesMenu handleClose={handleClose} handleUpdateIssue={handleUpdateIssue} issue={issueDetails} />
      )}
      {/* members menu */}
      {activePage === "change-issue-assignee" && issueDetails && (
        <PowerKMembersMenu handleUpdateMember={handleUpdateAssignee} value={issueDetails.assignee_ids} />
      )}
    </>
  );
});
