import React, { createContext, ReactElement, useEffect, useState, useCallback } from "react";
// next
import Router from "next/router";
import { useRouter } from "next/router";
// swr
import useSWR from "swr";
// services
import userService from "lib/services/user.service";
import issuesServices from "lib/services/issues.services";
import stateServices from "lib/services/state.services";
import sprintsServices from "lib/services/cycles.services";
import projectServices from "lib/services/project.service";
import workspaceService from "lib/services/workspace.service";
// constants
import {
  CURRENT_USER,
  PROJECTS_LIST,
  USER_WORKSPACES,
  USER_WORKSPACE_INVITATIONS,
  PROJECT_ISSUES_LIST,
  STATE_LIST,
  CYCLE_LIST,
} from "constants/fetch-keys";

// types
import type { KeyedMutator } from "swr";
import type { IUser, IWorkspace, IProject, IIssue, IssueResponse, ICycle, IState } from "types";
interface IUserContextProps {
  user?: IUser;
  isUserLoading: boolean;
  mutateUser: KeyedMutator<IUser>;
  activeWorkspace?: IWorkspace;
  mutateWorkspaces: KeyedMutator<IWorkspace[]>;
  workspaces?: IWorkspace[];
  projects?: IProject[];
  setActiveProject: React.Dispatch<React.SetStateAction<IProject | undefined>>;
  mutateProjects: KeyedMutator<IProject[]>;
  activeProject?: IProject;
  issues?: IssueResponse;
  mutateIssues: KeyedMutator<IssueResponse>;
  sprints?: ICycle[];
  mutateSprints: KeyedMutator<ICycle[]>;
  states?: IState[];
  mutateStates: KeyedMutator<IState[]>;
}

export const UserContext = createContext<IUserContextProps>({} as IUserContextProps);

export const UserProvider = ({ children }: { children: ReactElement }) => {
  const router = useRouter();

  const { projectId } = router.query;

  const [activeWorkspace, setActiveWorkspace] = useState<IWorkspace | undefined>();
  const [activeProject, setActiveProject] = useState<IProject | undefined>();

  // API to fetch user information
  const { data, error, mutate } = useSWR<IUser>(CURRENT_USER, () => userService.currentUser(), {
    shouldRetryOnError: false,
  });

  const {
    data: workspaces,
    error: workspaceError,
    mutate: mutateWorkspaces,
  } = useSWR<IWorkspace[]>(
    data ? USER_WORKSPACES : null,
    data ? () => workspaceService.userWorkspaces() : null,
    {
      shouldRetryOnError: false,
    }
  );

  const { data: projects, mutate: mutateProjects } = useSWR<IProject[]>(
    activeWorkspace ? PROJECTS_LIST(activeWorkspace.slug) : null,
    activeWorkspace ? () => projectServices.getProjects(activeWorkspace.slug) : null
  );

  const { data: issues, mutate: mutateIssues } = useSWR<IssueResponse>(
    activeWorkspace && activeProject
      ? PROJECT_ISSUES_LIST(activeWorkspace.slug, activeProject.id)
      : null,
    activeWorkspace && activeProject
      ? () => issuesServices.getIssues(activeWorkspace.slug, activeProject.id)
      : null
  );

  const { data: states, mutate: mutateStates } = useSWR<IState[]>(
    activeWorkspace && activeProject ? STATE_LIST(activeProject.id) : null,
    activeWorkspace && activeProject
      ? () => stateServices.getStates(activeWorkspace.slug, activeProject.id)
      : null
  );

  const { data: sprints, mutate: mutateSprints } = useSWR<ICycle[]>(
    activeWorkspace && activeProject ? CYCLE_LIST(activeProject.id) : null,
    activeWorkspace && activeProject
      ? () => sprintsServices.getCycles(activeWorkspace.slug, activeProject.id)
      : null
  );

  useEffect(() => {
    if (!projects) return;
    const activeProject = projects.find((project) => project.id === projectId);
    setActiveProject(activeProject ?? projects[0]);
  }, [projectId, projects]);

  useEffect(() => {
    if (data?.last_workspace_id) {
      const workspace = workspaces?.find((item) => item.id === data?.last_workspace_id);
      if (workspace) {
        setActiveWorkspace(workspace);
      } else {
        const workspace = workspaces?.[0];
        setActiveWorkspace(workspace);
        userService.updateUser({ last_workspace_id: workspace?.id });
      }
    } else if (data) {
      const workspace = workspaces?.[0];
      setActiveWorkspace(workspace);
      userService.updateUser({ last_workspace_id: workspace?.id });
    }
  }, [data, workspaces]);

  useEffect(() => {
    if (!workspaces) return;
    if (workspaces.length === 0) Router.push("/invitations");
  }, [workspaces]);

  return (
    <UserContext.Provider
      value={{
        user: error ? undefined : data,
        isUserLoading: Boolean(data === undefined && error === undefined),
        mutateUser: mutate,
        activeWorkspace: workspaceError ? undefined : activeWorkspace,
        mutateWorkspaces: mutateWorkspaces,
        workspaces: workspaceError ? undefined : workspaces,
        projects,
        mutateProjects: mutateProjects,
        activeProject,
        issues,
        mutateIssues,
        sprints,
        mutateSprints,
        states,
        mutateStates,
        setActiveProject,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
