import set from "lodash/set";
import { action, autorun, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { IApiToken, IProject, IState, IUser, IWorkspace } from "@plane/types";
// plane web services
import externalApiTokenService from "@/plane-web/services/importers/root.service";
// plane web root store
import { RootStore } from "@/plane-web/store/root.store";
import { E_PLANE_PRIORITY, TPlanePriorityData } from "@/plane-web/types/importers";

export type TBaseLoader = "fetch-projects" | "fetch_states" | undefined;

export interface IImporterBaseStore {
  // constant variables
  priorities: TPlanePriorityData[];
  // observables
  loader: TBaseLoader;
  error: object;
  user: IUser | undefined;
  workspace: IWorkspace | undefined;
  projects: Record<string, Record<string, IProject>>; // workspaceSlug -> projectId -> project
  states: Record<string, Record<string, IState>>; // projectId -> stateId -> state
  externalApiToken: string | undefined;
  // computed functions
  projectIdsByWorkspaceSlug: (workspaceSlug: string) => string[] | undefined;
  stateIdsByProjectId: (projectId: string) => string[] | undefined;
  getProjectById: (projectId: string) => IProject | undefined;
  getStateById: (projectId: string, stateId: string) => IState | undefined;
  // helper actions
  fetchProjects: (workspaceSlug: string) => Promise<IProject[] | undefined>;
  fetchStates: (workspaceSlug: string, projectId: string) => Promise<IState[] | undefined>;
  fetchExternalApiToken: (workspaceSlug: string) => Promise<IApiToken | undefined>;
  reset: () => void;
}

export class ImporterBaseStore implements IImporterBaseStore {
  // constant variables
  priorities: TPlanePriorityData[] = [
    { key: E_PLANE_PRIORITY.URGENT, label: "Urgent" },
    { key: E_PLANE_PRIORITY.HIGH, label: "High" },
    { key: E_PLANE_PRIORITY.MEDIUM, label: "Medium" },
    { key: E_PLANE_PRIORITY.LOW, label: "Low" },
    { key: E_PLANE_PRIORITY.NONE, label: "None" },
  ];
  // observables
  loader: TBaseLoader = undefined;
  error: object = {};
  user: IUser | undefined = undefined;
  workspace: IWorkspace | undefined = undefined;
  projects: Record<string, Record<string, IProject>> = {}; // workspaceSlug -> projectId -> project
  states: Record<string, Record<string, IState>> = {}; // projectId -> stateId -> state
  externalApiToken: string | undefined = undefined;

  constructor(public store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      error: observable,
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
   * @description get state by its ID
   * @param { string } stateId
   * @returns { IState | undefined }
   */
  getStateById = computedFn((projectId: string, stateId: string): IState | undefined => {
    const projectStates = this.states[projectId];
    if (!projectStates) return undefined;

    return projectStates[stateId];
  });

  // helper actions
  /**
   * @description handle projects
   * @returns { IProject[] | undefined }
   */
  fetchProjects = async (workspaceSlug: string): Promise<IProject[] | undefined> => {
    if (!workspaceSlug) return undefined;

    this.loader = "fetch-projects";
    this.error = {};
    try {
      const projects = await this.store.projectRoot.project.fetchProjects(workspaceSlug);
      if (projects) {
        runInAction(() => {
          projects.forEach((project) => {
            set(this.projects, [workspaceSlug, project.id], project);
          });
        });
      }
      return projects;
    } catch (error) {
      runInAction(() => {
        this.error = error as unknown as object;
        this.loader = undefined;
      });
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

    this.loader = "fetch_states";
    this.error = {};
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
      runInAction(() => {
        this.error = error as unknown as object;
        this.loader = undefined;
      });
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
      if (externalApiToken) {
        runInAction(() => {
          set(this, "externalApiToken", externalApiToken.token);
        });
      }
      return externalApiToken;
    } catch (error) {
      runInAction(() => {
        this.error = error as unknown as object;
      });
    }
  };

  /**
   * @description reset the store
   * @returns { void }
   */
  reset = (): void => {
    this.workspace = undefined;
    this.user = undefined;
  };
}
