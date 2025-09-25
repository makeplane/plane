/* eslint-disable no-useless-catch */

import set from "lodash/set";
import { action, autorun, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { SILO_BASE_URL } from "@plane/constants";
import { IApiToken, IProject, IState, IUser, IWebhook, IWorkspace } from "@plane/types";
// plane web services
import externalApiTokenService from "@/plane-web/services/importers/root.service";
import internalWebhookService from "@/plane-web/services/internal-webhook.service";
// plane web root store
import { RootStore } from "@/plane-web/store/root.store";

export interface IIntegrationBaseStore {
  // observables
  user: IUser | undefined;
  workspace: IWorkspace | undefined;
  externalApiToken: string | undefined;
  projects: Record<string, Record<string, IProject>>; // workspaceSlug -> projectId -> project
  states: Record<string, Record<string, IState>>; // projectId -> stateId -> state
  // computed functions
  projectIdsByWorkspaceSlug: (workspaceSlug: string) => string[] | undefined;
  stateIdsByProjectId: (projectId: string) => string[] | undefined;
  getProjectById: (projectId: string) => IProject | undefined;
  getStateById: (projectId: string, stateId: string) => IState | undefined;
  // actions
  fetchProjects: (workspaceSlug: string) => Promise<IProject[] | undefined>;
  fetchStates: (workspaceSlug: string, projectId: string) => Promise<IState[] | undefined>;
  fetchExternalApiToken: (workspaceSlug: string) => Promise<IApiToken | undefined>;
  fetchWebhookConnection: (url: string) => Promise<{ is_connected: boolean } | undefined>;
  removeWebhookConnection: () => Promise<void>;
}

export class IntegrationBaseStore implements IIntegrationBaseStore {
  // observables
  user: IUser | undefined = undefined;
  workspace: IWorkspace | undefined = undefined;
  projects: Record<string, Record<string, IProject>> = {}; // workspaceSlug -> projectId -> project
  states: Record<string, Record<string, IState>> = {}; // projectId -> stateId -> state
  externalApiToken: string | undefined = undefined;
  webhookConnection: Record<string, boolean> = {};
  webhookConnectionId: Record<string, string> = {};

  constructor(protected store: RootStore) {
    makeObservable(this, {
      // observables
      user: observable,
      workspace: observable,
      projects: observable,
      states: observable,
      externalApiToken: observable.ref,
      // actions
      fetchProjects: action,
      fetchStates: action,
      fetchExternalApiToken: action,
    });

    autorun(() => {
      const {
        workspaceRoot: { currentWorkspace },
        user: { data: currentUser },
      } = this.store;

      if (
        currentWorkspace &&
        currentUser &&
        (!this.workspace ||
          !this.user ||
          this.workspace?.id !== currentWorkspace?.id ||
          this.user?.id !== currentUser?.id)
      ) {
        this.user = currentUser;
        this.workspace = currentWorkspace;
      }
    });
  }

  // computed functions
  /**
   * @description get project ids by workspace slug
   * @param { string } workspaceSlug
   * @returns { string[] | undefined }
   */
  projectIdsByWorkspaceSlug = computedFn((workspaceSlug: string): string[] | undefined => {
    const workspaceProjects = this.projects[workspaceSlug];
    if (!workspaceProjects) return undefined;
    return Object.keys(workspaceProjects);
  });

  /**
   * @description get project by its ID
   * @param { string } projectId
   * @returns { IProject | undefined }
   */
  getProjectById = computedFn((projectId: string): IProject | undefined => {
    const workspaceSlug = this.workspace?.slug;
    if (!workspaceSlug) return undefined;

    const workspaceProjects = this.projects[workspaceSlug];
    if (!workspaceProjects) return undefined;

    return workspaceProjects[projectId];
  });

  /**
   * @description get state ids by project id
   * @param { string } projectId
   * @returns { string[] | undefined }
   */
  stateIdsByProjectId = computedFn((projectId: string): string[] | undefined => {
    const projectStates = this.states[projectId];
    if (!projectStates) return undefined;
    return Object.keys(projectStates);
  });

  /**
   * @description get state by its ID
   * @param { string } stateId
   * @returns { IState | undefined }
   */
  getStateById = computedFn((projectId: string, stateId: string): IState | undefined => {
    const projectStates = this.states[projectId];
    if (!projectStates) return undefined;

    return projectStates[stateId];
  });

  // actions
  /**
   * @description handle projects
   * @returns { IProject[] | undefined }
   */
  fetchProjects = async (workspaceSlug: string): Promise<IProject[] | undefined> => {
    if (!workspaceSlug) return undefined;

    try {
      const joinedProjectIds = this.store.projectRoot.project.joinedProjectIds;
      const getProjectById = this.store.projectRoot.project.getProjectById;
      const projects = joinedProjectIds
        .map((projectId) => getProjectById(projectId))
        .filter((project) => project !== undefined);
      if (projects) {
        runInAction(() => {
          projects.forEach((project) => {
            set(this.projects, [workspaceSlug, project.id], project);
          });
        });
      }
      return projects;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description handle states
   * @param { string } projectId
   * @returns { IState[] | undefined }
   */
  fetchStates = async (workspaceSlug: string, projectId: string): Promise<IState[] | undefined> => {
    if (!workspaceSlug || !projectId) return undefined;

    try {
      const projectStates = await this.store.state.fetchProjectStates(workspaceSlug, projectId);
      if (projectStates) {
        runInAction(() => {
          projectStates.forEach((state) => {
            set(this.states, [projectId, state.id], state);
          });
        });
      }
      return projectStates;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description handle external api token
   * @param { string } workspaceSlug
   * @returns { Promise<IApiToken | undefined> }
   */
  fetchExternalApiToken = async (workspaceSlug: string): Promise<IApiToken | undefined> => {
    if (!workspaceSlug) return;

    try {
      const externalApiToken = await externalApiTokenService.externalServiceApiToken(workspaceSlug);
      if (externalApiToken && externalApiToken.token) {
        runInAction(() => {
          set(this, "externalApiToken", externalApiToken.token);
        });
      }
      return externalApiToken;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description fetch the webhook connection status
   * @returns { Promise<{ is_connected: boolean } | undefined> }
   */
  fetchWebhookConnection = async (url: string): Promise<{ is_connected: boolean } | undefined> => {
    const workspaceId = this.store.workspaceRoot.currentWorkspace?.id;
    const workspaceSlug = this.store.workspaceRoot.currentWorkspace?.slug;
    if (!workspaceId || !workspaceSlug) return;

    const BASE_URL = SILO_BASE_URL?.trim() || window.location.origin;
    const CURRENT_SILO_BASE_URL = new URL(BASE_URL);
    CURRENT_SILO_BASE_URL.pathname = url;

    const payload: Partial<IWebhook> = {
      url: CURRENT_SILO_BASE_URL.toString(),
      is_active: true,
      project: true,
      issue: true,
      module: true,
      cycle: true,
      issue_comment: true,
    };

    const response = await internalWebhookService.getOrCreateInternalWebhook(workspaceSlug, payload);

    if (response)
      runInAction(() => {
        set(this.webhookConnection, workspaceId, response?.is_connected || false);
        set(this.webhookConnectionId, workspaceId, response?.id || "");
      });

    return response;
  };

  /**
   * @description remove the webhook connection
   * @returns { Promise<void> }
   */
  removeWebhookConnection = async (): Promise<void> => {
    const workspaceId = this.store.workspaceRoot.currentWorkspace?.id;
    const workspaceSlug = this.store.workspaceRoot.currentWorkspace?.slug;
    if (!workspaceId || !workspaceSlug) return;

    const webhookConnectionId = this.webhookConnectionId[workspaceId];
    if (!webhookConnectionId) return;

    await internalWebhookService.deleteInternalWebhook(workspaceSlug, webhookConnectionId);
  };
}
