import { cloneDeep, orderBy, set, unset } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { E_FEATURE_FLAGS } from "@plane/constants";
// plane web constants
import { WORKSPACE_PROJECT_STATE_GROUPS } from "@/plane-web/constants/workspace-project-states";
// plane web services
import projectStateService from "@/plane-web/services/workspace-project-states.service";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
import { IProjectState, ProjectState } from "@/plane-web/store/workspace-project-states";
// plane web types
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";
import {
  EProjectStateGroup,
  EProjectStateLoader,
  TProjectState,
  TProjectStateGroupKey,
  TProjectStateLoader,
  TProjectStateIdsByGroup,
} from "@/plane-web/types/workspace-project-states";

export interface IWorkspaceProjectStatesStore {
  // constants
  // observables
  loader: TProjectStateLoader;
  projectStates: Record<string, IProjectState>; // projectStateId -> IProjectState
  // computed
  isFeatureFlagged: boolean;
  isSettingsEnabled: boolean;
  defaultState: string | undefined;

  // computed methods
  getProjectStatesByWorkspaceId: (workspaceId: string) => TProjectState[] | undefined;
  getProjectStateIdsByWorkspaceId: (workspaceId: string) => string[] | undefined;
  getProjectStatedByStateGroupKey: (
    workspaceId: string,
    groupKey: TProjectStateGroupKey
  ) => TProjectState[] | undefined;
  getProjectStateIdsWithGroupingByWorkspaceId: (workspaceId: string) => TProjectStateIdsByGroup | undefined;
  getProjectStateById: (projectStateId: string) => TProjectState | undefined;
  // helpers actions
  mutateProjectStates: (projectStates: TProjectState[]) => void;
  // actions
  fetchProjectStates: (workspaceSlug: string, loader?: TProjectStateLoader) => Promise<TProjectState[] | undefined>;
  createProjectState: (workspaceSlug: string, payload: Partial<TProjectState>) => Promise<TProjectState | undefined>;
  removeProjectState: (workspaceSlug: string, projectStateId: string) => Promise<void | undefined>;
  markAsDefault: (workspaceSlug: string, projectStateId: string) => Promise<void>;
}

export class WorkspaceProjectStatesStore implements IWorkspaceProjectStatesStore {
  // constants
  // observables
  loader: TProjectStateLoader = EProjectStateLoader.INIT_LOADER;
  projectStates: Record<string, IProjectState> = {};
  workspaceStore;

  constructor(public store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      projectStates: observable,
      // computed
      isFeatureFlagged: computed,
      isSettingsEnabled: computed,
      defaultState: computed,
      // actions
      fetchProjectStates: action,
      createProjectState: action,
      removeProjectState: action,
      markAsDefault: action,
    });
    this.workspaceStore = store.workspaceRoot;
  }

  // computed
  /**
   * @description check if project grouping feature is enabled
   * @returns { boolean }
   */
  get isFeatureFlagged(): boolean {
    const workspaceSlug = this.workspaceStore.currentWorkspace?.slug.toString();
    if (!workspaceSlug || !this.store.featureFlags.flags[workspaceSlug]) return false;
    return this.store.featureFlags.flags[workspaceSlug][E_FEATURE_FLAGS.PROJECT_GROUPING] ?? false;
  }

  /**
   * @description check if project grouping settings is enabled
   * @returns { boolean }
   */
  get isSettingsEnabled(): boolean {
    return (
      (this.isFeatureFlagged &&
        this.store.workspaceFeatures.isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED)) ??
      false
    );
  }

  /**
   * @description get default project state
   * @returns { string | undefined }
   */
  get defaultState(): string {
    let computedDefault = Object.keys(this.projectStates).find((key) => this.projectStates[key].default);
    if (!computedDefault)
      computedDefault =
        computedDefault || Object.keys(this.projectStates).find((key) => this.projectStates[key].name === "Planning");
    // Return 'planning's id if no default state is set
    return computedDefault || "";
  }

  // computed methods
  /**
   * @description get project states by workspace id
   * @param { string } workspaceId
   * @returns { TProjectState[] | undefined }
   */
  getProjectStatesByWorkspaceId = (workspaceId: string): TProjectState[] | undefined => {
    if (!workspaceId) return undefined;

    const projectStates = this.projectStates;
    if (!projectStates) return undefined;

    return Object.values(projectStates).filter(
      (projectState) => projectState.workspace_id === workspaceId
    ) as TProjectState[];
  };

  /**
   * @description get project state ids
   * @returns { string[] | undefined }
   */
  getProjectStateIdsByWorkspaceId = (workspaceId: string): string[] | undefined => {
    if (!workspaceId) return undefined;

    const projectStates = this.projectStates;
    if (!projectStates) return undefined;

    return Object.values(projectStates)
      .filter((projectState) => projectState.workspace_id === workspaceId)
      .map((projectState) => projectState.id) as string[];
  };

  /**
   * @description get project states by state group key
   * @param { string } workspaceId
   * @param { TProjectStateGroupKey } groupKey
   * @returns { TProjectState[] | undefined }
   */
  getProjectStatedByStateGroupKey = (
    workspaceId: string,
    groupKey: TProjectStateGroupKey
  ): TProjectState[] | undefined => {
    if (!workspaceId) return undefined;

    const projectStates = this.projectStates;
    if (!projectStates) return undefined;
    const currentProjectStatesByGroup = Object.values(projectStates).filter(
      (projectState) => projectState.workspace_id === workspaceId && projectState.group === groupKey
    ) as TProjectState[];

    return orderBy(currentProjectStatesByGroup, "sequence", "asc");
  };

  /**
   * @description get project state ids with grouping by workspace id
   * @param { string } workspaceId
   * @returns { TProjectStateIdsByGroup | undefined }
   */
  getProjectStateIdsWithGroupingByWorkspaceId = (workspaceId: string): TProjectStateIdsByGroup | undefined => {
    if (!workspaceId) return undefined;

    const projectStates = this.projectStates;
    if (!projectStates) return undefined;

    const projectStateIds: TProjectStateIdsByGroup = {
      [EProjectStateGroup.DRAFT]: [],
      [EProjectStateGroup.PLANNING]: [],
      [EProjectStateGroup.EXECUTION]: [],
      [EProjectStateGroup.MONITORING]: [],
      [EProjectStateGroup.COMPLETED]: [],
      [EProjectStateGroup.CANCELLED]: [],
    };

    Object.entries(WORKSPACE_PROJECT_STATE_GROUPS).forEach(([key]) => {
      const groupKey = key as TProjectStateGroupKey;
      const currentGroupProjectStates = this.getProjectStatedByStateGroupKey(workspaceId, groupKey);
      projectStateIds[groupKey] = (currentGroupProjectStates || []).map((projectState) => projectState.id) as string[];
    });

    return projectStateIds;
  };

  /**
   * @description get project state by id
   * @param { string } projectStateId
   * @returns { TProjectState | undefined }
   */
  getProjectStateById = (projectStateId: string): TProjectState | undefined => {
    if (!projectStateId) return undefined;
    return this.projectStates[projectStateId] || undefined;
  };

  // helpers actions
  /**
   * @description mutate project states
   * @param { TProjectState[] } projectStates
   */
  mutateProjectStates = (projectStates: TProjectState[]): void => {
    (projectStates || []).forEach((projectState) => {
      if (!projectState.id) return;
      if (this.projectStates[projectState.id]) {
        this.projectStates[projectState.id].mutateProjectState(projectState);
      } else {
        set(this.projectStates, projectState.id, new ProjectState(this.store, projectState));
      }
    });
  };

  // actions
  /**
   * @description fetching workspace project states
   * @param { string } workspaceSlug
   * @returns { TProjectState[] | undefined }
   */
  fetchProjectStates = async (
    workspaceSlug: string,
    loader: TProjectStateLoader = EProjectStateLoader.INIT_LOADER
  ): Promise<TProjectState[] | undefined> => {
    // if (!this.isSettingsEnabled) return undefined;
    this.loader = loader;

    try {
      const projectStates = await projectStateService.fetchProjectStates(workspaceSlug);
      if (projectStates) {
        runInAction(() => {
          this.mutateProjectStates(projectStates);
        });
      }
      return projectStates;
    } catch (error) {
      console.error("project states --> fetchProjectStates", error);
      throw error;
    } finally {
      runInAction(() => (this.loader = undefined));
    }
  };

  /**
   * @description create project state
   * @param { string } workspaceSlug
   * @param { Partial<TProjectState> } payload
   * @returns { TProjectState | undefined }
   */
  createProjectState = async (
    workspaceSlug: string,
    payload: Partial<TProjectState>
  ): Promise<TProjectState | undefined> => {
    // if (!this.isSettingsEnabled) return undefined;

    try {
      const projectState = await projectStateService.createProjectState(workspaceSlug, payload);
      if (projectState) {
        this.mutateProjectStates([projectState]);
      }
      return projectState;
    } catch (error) {
      console.error("project states --> createProjectState", error);
      throw error;
    }
  };

  /**
   * @description delete project state
   * @param { string } workspaceSlug
   * @param { string } projectStateId
   * @returns { void | undefined }
   */
  removeProjectState = async (workspaceSlug: string, projectStateId: string): Promise<void | undefined> => {
    // if (!this.isSettingsEnabled) return undefined;
    const currentProjectState = this.projectStates[projectStateId];
    try {
      unset(this.projectStates, projectStateId);
      await projectStateService.removeProjectState(workspaceSlug, projectStateId);
    } catch (error) {
      set(this.projectStates, projectStateId, currentProjectState);
      console.error("project states --> removeProjectState", error);
      throw error;
    }
  };

  /**
   * @description mark project state as default
   * @param { string } workspaceSlug
   * @returns { TProjectState | undefined }
   */
  markAsDefault = async (workspaceSlug: string, projectStateId: string): Promise<void> => {
    if (!workspaceSlug || !projectStateId) return undefined;
    const currentProjectStates = cloneDeep(this.projectStates);
    console.log("currentProjectStates", projectStateId);
    try {
      runInAction(() => {
        Object.entries(this.projectStates).forEach(([key]) => {
          this.projectStates[key].mutateProjectState({ default: projectStateId === key ? true : false });
        });
      });
      await projectStateService.markAsDefault(workspaceSlug, projectStateId);
    } catch (error) {
      console.error("project state -> markAsDefault -> error", error);
      runInAction(() => {
        Object.entries(currentProjectStates).forEach(([key, value]) => {
          this.projectStates[key].mutateProjectState(value);
        });
      });
      throw error;
    }
  };
}
