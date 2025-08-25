import { TSlackConnectionDetails } from "../types/types"
import { createSlackLinkback } from "../views/issue-linkback"
import { getUserMapFromSlackWorkspaceConnection } from "./user"


type TRefreshLinkbackProps = {
  details: TSlackConnectionDetails
  issueId: string
  projectId: string
}

export const refreshLinkback = async (props: TRefreshLinkbackProps) => {
  const { details, issueId, projectId } = props;
  const { workspaceConnection, planeClient } = details;

  const issue = await planeClient.issue.getIssueWithFields(workspaceConnection.workspace_slug, projectId, issueId, [
    "state",
    "project",
    "assignees",
    "labels",
  ]);

  const userMap = getUserMapFromSlackWorkspaceConnection(workspaceConnection);

  const updatedLinkback = createSlackLinkback(workspaceConnection.workspace_slug, issue, userMap, false);

  return updatedLinkback;
}
