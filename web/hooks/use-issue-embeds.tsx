import { TIssue } from "@plane/types";
import { PROJECT_ISSUES_LIST, STATES_LIST } from "constants/fetch-keys";
import { StoreContext } from "contexts/store-context";
import { toJS } from "mobx";
import { useRouter } from "next/router";
import { useContext } from "react";
import { IssueService } from "services/issue";
import useSWR from "swr";
import { useIssueDetail, useMember, useProject, useProjectState } from "./store";

const issueService = new IssueService();

export const useIssueEmbeds = () => {
  const workspaceSlug = useContext(StoreContext).app.router.workspaceSlug;
  const projectId = useContext(StoreContext).app.router.projectId;

  const { getProjectById, fetchProjects } = useProject();
  const { setPeekIssue } = useIssueDetail();
  const { getStateById, fetchProjectStates } = useProjectState();
  const { getUserDetails } = useMember();
  const router = useRouter();

  const { data: issuesResponse, isLoading: issuesLoading } = useSWR(
    workspaceSlug && projectId ? PROJECT_ISSUES_LIST(workspaceSlug as string, projectId as string) : null,
    workspaceSlug && projectId ? () => issueService.getIssues(workspaceSlug as string, projectId as string) : null
  );

  const { isLoading: projectsLoading } = useSWR(
    workspaceSlug ? `WORKSPACE_PROJECTS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchProjects(workspaceSlug as string) : null
  );

  const { isLoading: statesLoading } = useSWR(
    workspaceSlug && projectId ? STATES_LIST(projectId.toString()) : null,
    workspaceSlug && projectId ? () => fetchProjectStates(workspaceSlug.toString(), projectId.toString()) : null
  );

  const issues = Object.values(issuesResponse ?? {});
  const issuesWithStateAndProject = issues.map((issue) => ({
    ...issue,
    state_detail: toJS(getStateById(issue.state_id)),
    project_detail: toJS(getProjectById(issue.project_id)),
  }));

  const fetchIssue = async (issueId: string) => {
    const issue = await issueService.retrieve(workspaceSlug as string, projectId as string, issueId as string);
    return {
      ...issue,
      state_detail: toJS(getStateById(issue.state_id)),
      project_detail: toJS(getProjectById(issue.project_id)),
      assignee_details: issue.assignee_ids.map((assigneeId) => toJS(getUserDetails(assigneeId))),
    };
  };

  const issueWidgetClickAction = (issueId: string) => {
    if (!workspaceSlug || !projectId) return;

    setPeekIssue({ workspaceSlug, projectId: projectId, issueId });
  };

  return {
    issues: issuesWithStateAndProject,
    isLoading: issuesLoading || projectsLoading || statesLoading,
    fetchIssue,
    issueWidgetClickAction,
  };
};
