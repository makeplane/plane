import { TIssue } from "@plane/types";
import { PROJECT_ISSUES_LIST, STATES_LIST } from "constants/fetch-keys";
import { EIssuesStoreType } from "constants/issue";
import { StoreContext } from "contexts/store-context";
import { autorun, toJS } from "mobx";
import { useContext } from "react";
import { IssueService } from "services/issue";
import useSWR from "swr";
import { useIssueDetail, useIssues, useMember, useProject, useProjectState } from "./store";

const issueService = new IssueService();

export const useIssueEmbeds = () => {
  const workspaceSlug = useContext(StoreContext).app.router.workspaceSlug;
  const projectId = useContext(StoreContext).app.router.projectId;

  const { getProjectById } = useProject();
  const { setPeekIssue } = useIssueDetail();
  const { getStateById } = useProjectState();
  const { getUserDetails } = useMember();

  const { data: issuesResponse } = useSWR(
    workspaceSlug && projectId ? PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string) : null,
    workspaceSlug && projectId ? () => issueService.getIssues(workspaceSlug as string, projectId as string) : null
  );

  const issues = Object.values(issuesResponse ?? {});
  const issuesWithStateAndProject = issues.map((issue) => ({
    ...issue,
    state_detail: toJS(getStateById(issue.state_id)),
    project_detail: toJS(getProjectById(issue.project_id)),
    assignee_details: issue.assignee_ids.map((assigneeid) => toJS(getUserDetails(assigneeid))),
  }));

  const fetchIssue = async (issueId: string) => issuesWithStateAndProject.find((issue) => issue.id === issueId);

  const issueWidgetClickAction = (issueId: string) => {
    if (!workspaceSlug || !projectId) return;

    setPeekIssue({ workspaceSlug, projectId: projectId, issueId });
  };

  return {
    issues: issuesWithStateAndProject,
    fetchIssue,
    issueWidgetClickAction,
  };
};
