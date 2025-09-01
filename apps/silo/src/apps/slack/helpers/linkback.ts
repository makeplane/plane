import { TSlackConnectionDetails } from "../types/types";
import { createSlackLinkback } from "../views/issue-linkback";
import { enhanceUserMapWithSlackLookup, getUserMapFromSlackWorkspaceConnection } from "./user";

type TRefreshLinkbackProps = {
  details: TSlackConnectionDetails;
  issueId: string;
  projectId: string;
};

export const refreshLinkback = async (props: TRefreshLinkbackProps) => {
  const { details, issueId, projectId } = props;
  const { workspaceConnection, planeClient, slackService } = details;

  const issue = await planeClient.issue.getIssueWithFields(workspaceConnection.workspace_slug, projectId, issueId, [
    "state",
    "project",
    "assignees",
    "labels",
    "created_by",
    "updated_by",
  ]);

  const userMap = getUserMapFromSlackWorkspaceConnection(workspaceConnection);
  const enhancedUserMap = await enhanceUserMapWithSlackLookup({
    planeUsers: issue.assignees,
    currentUserMap: userMap,
    slackService,
  });

  const updatedLinkback = createSlackLinkback(workspaceConnection.workspace_slug, issue, enhancedUserMap, false);

  return updatedLinkback;
};
