import { TIssue } from "@plane/types";
import { PROJECT_ISSUES_LIST, STATES_LIST } from "constants/fetch-keys";
import { StoreContext } from "contexts/store-context";
import { toJS } from "mobx";
import { useRouter } from "next/router";
import { useContext } from "react";
import { IssueService } from "services/issue";
import useSWR from "swr";
import { useProject, useProjectState } from "./store";

const issueService = new IssueService();

export const useIssueEmbeds = () => {
  const workspaceSlug = useContext(StoreContext).app.router.workspaceSlug;
  const projectId = useContext(StoreContext).app.router.projectId;

  const { getProjectById, fetchProjects } = useProject();
  const { getStateById, fetchProjectStates } = useProjectState();
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
    };
  };

  const issueWidgetClickAction = (issueId: string) => {
    const url = new URL(router.asPath, window.location.origin);
    const params = new URLSearchParams(url.search);

    if (params.has("peekIssueId")) {
      params.set("peekIssueId", issueId);
    } else {
      params.append("peekIssueId", issueId);
    }
    // Replace the current URL with the new one
    router.replace(`${url.pathname}?${params.toString()}`, undefined, { shallow: true });
  };

  return {
    issues: issuesWithStateAndProject,
    isLoading: issuesLoading || projectsLoading || statesLoading,
    fetchIssue,
    issueWidgetClickAction,
  };
};
