import groupBy from "lodash/groupBy";
import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { IState } from "@plane/types";
// helpers
import { convertStringArrayToBooleanObject } from "@/helpers/array.helper";
import { sortStates } from "@/helpers/state.helper";
// plane web
import { syncIssuesWithDeletedStates } from "@/local-db/utils/load-workspace";
import { ProjectStateService } from "@/plane-web/services/project/project-state.service";
import { RootStore } from "@/plane-web/store/root.store";

export interface IStateStore {
  //Loaders
  fetchedMap: Record<string, boolean>;
  // observables
  stateMap: Record<string, IState>;
  // computed
  workspaceStates: IState[] | undefined;
  projectStates: IState[] | undefined;
  groupedProjectStates: Record<string, IState[]> | undefined;
  // computed actions
  getStateById: (stateId: string | null | undefined) => IState | undefined;
  getProjectStates: (projectId: string | null | undefined) => IState[] | undefined;
  getAvailableProjectStateIdMap: (
    projectId: string | null | undefined,
    currStateId: string | null | undefined
  ) => { [key: string]: boolean };
  // fetch actions
  fetchProjectStates: (workspaceSlug: string, projectId: string) => Promise<IState[]>;
  fetchWorkspaceStates: (workspaceSlug: string) => Promise<IState[]>;
  // crud actions
  createState: (workspaceSlug: string, projectId: string, data: Partial<IState>) => Promise<IState>;
  updateState: (
    workspaceSlug: string,
    projectId: string,
    stateId: string,
    data: Partial<IState>
  ) => Promise<IState | undefined>;
  deleteState: (workspaceSlug: string, projectId: string, stateId: string) => Promise<void>;
  markStateAsDefault: (workspaceSlug: string, projectId: string, stateId: string) => Promise<void>;
  moveStatePosition: (
    workspaceSlug: string,
    projectId: string,
    stateId: string,
    payload: Partial<IState>
  ) => Promise<void>;
  //Dummy method
  fetchProjectStateTransitions: (workspaceSlug: string, projectId: string) => void;
}

export class StateStore implements IStateStore {
  stateMap: Record<string, IState> = {};
  //loaders
  fetchedMap: Record<string, boolean> = {};
  rootStore: RootStore;
  router;
  stateService: ProjectStateService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      stateMap: observable,
      fetchedMap: observable,
      // computed
      projectStates: computed,
      groupedProjectStates: computed,
      // fetch action
      fetchProjectStates: action,
      // CRUD actions
      createState: action,
      updateState: action,
      deleteState: action,
      // state actions
      markStateAsDefault: action,
      moveStatePosition: action,
    });
    this.stateService = new ProjectStateService();
    this.router = _rootStore.router;
    this.rootStore = _rootStore;
  }

  /**
   * Returns the stateMap belongs to a specific workspace
   */
  get workspaceStates() {
    const workspaceSlug = this.router.workspaceSlug || "";
    if (!workspaceSlug || !this.fetchedMap[workspaceSlug]) return;
    return sortStates(Object.values(this.stateMap));
  }

  /**
   * Returns the stateMap belongs to a specific project
   */
  get projectStates() {
    const projectId = this.router.projectId;
    const workspaceSlug = this.router.workspaceSlug || "";
    if (!projectId || !(this.fetchedMap[projectId] || this.fetchedMap[workspaceSlug])) return;
    return sortStates(Object.values(this.stateMap).filter((state) => state.project_id === projectId));
  }

  /**
   * Returns the stateMap belongs to a specific project grouped by group
   */
  get groupedProjectStates() {
    if (!this.router.projectId) return;
    return groupBy(this.projectStates, "group") as Record<string, IState[]>;
  }

  /**
   * @description returns state details using state id
   * @param stateId
   */
  getStateById = computedFn((stateId: string | null | undefined) => {
    if (!this.stateMap || !stateId) return;
    return this.stateMap[stateId] ?? undefined;
  });

  /**
   * Returns the stateMap belongs to a project by projectId
   * @param projectId
   * @returns IState[]
   */
  getProjectStates = computedFn((projectId: string | null | undefined) => {
    const workspaceSlug = this.router.workspaceSlug || "";
    if (!projectId || !(this.fetchedMap[projectId] || this.fetchedMap[workspaceSlug])) return;
    return sortStates(Object.values(this.stateMap).filter((state) => state.project_id === projectId));
  });

  /**
   * Returns an object linking state permissions as boolean values
   * @param projectId
   */
  getAvailableProjectStateIdMap = computedFn(
    (projectId: string | null | undefined, currStateId: string | null | undefined) => {
      const projectStates = this.getProjectStates(projectId);

      if (!projectStates) return {};

      return convertStringArrayToBooleanObject(projectStates.map((projectState) => projectState.id));
    }
  );

  /**
   * fetches the stateMap of a project
   * @param workspaceSlug
   * @param projectId
   * @returns
   */
  fetchProjectStates = async (workspaceSlug: string, projectId: string) => {
    const statesResponse = await this.stateService.getStates(workspaceSlug, projectId);
    runInAction(() => {
      statesResponse.forEach((state) => {
        set(this.stateMap, [state.id], state);
      });
      set(this.fetchedMap, projectId, true);
    });
    return statesResponse;
  };

  /**
   * fetches the stateMap of all the states in workspace
   * @param workspaceSlug
   * @returns
   */
  fetchWorkspaceStates = async (workspaceSlug: string) => {
    const statesResponse = await this.stateService.getWorkspaceStates(workspaceSlug);
    runInAction(() => {
      statesResponse.forEach((state) => {
        set(this.stateMap, [state.id], state);
      });
      set(this.fetchedMap, workspaceSlug, true);
    });
    return statesResponse;
  };

  /**
   * creates a new state in a project and adds it to the store
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @returns
   */
  createState = async (workspaceSlug: string, projectId: string, data: Partial<IState>) =>
    await this.stateService.createState(workspaceSlug, projectId, data).then((response) => {
      runInAction(() => {
        set(this.stateMap, [response?.id], response);
      });
      return response;
    });

  /**
   * Updates the state details in the store, in case of failure reverts back to original state
   * @param workspaceSlug
   * @param projectId
   * @param stateId
   * @param data
   * @returns
   */
  updateState = async (workspaceSlug: string, projectId: string, stateId: string, data: Partial<IState>) => {
    const originalState = this.stateMap[stateId];
    try {
      runInAction(() => {
        set(this.stateMap, [stateId], { ...this.stateMap?.[stateId], ...data });
      });
      const response = await this.stateService.patchState(workspaceSlug, projectId, stateId, data);
      return response;
    } catch (error) {
      runInAction(() => {
        this.stateMap = {
          ...this.stateMap,
          [stateId]: originalState,
        };
      });
      throw error;
    }
  };

  /**
   * deletes the state from the store, incase of failure reverts back to original state
   * @param workspaceSlug
   * @param projectId
   * @param stateId
   */
  deleteState = async (workspaceSlug: string, projectId: string, stateId: string) => {
    if (!this.stateMap?.[stateId]) return;
    await this.stateService.deleteState(workspaceSlug, projectId, stateId).then(() => {
      runInAction(() => {
        delete this.stateMap[stateId];
        syncIssuesWithDeletedStates([stateId]);
      });
    });
  };

  /**
   * marks a state as default in a project
   * @param workspaceSlug
   * @param projectId
   * @param stateId
   */
  markStateAsDefault = async (workspaceSlug: string, projectId: string, stateId: string) => {
    const originalStates = this.stateMap;
    const currentDefaultState = Object.values(this.stateMap).find(
      (state) => state.project_id === projectId && state.default
    );
    try {
      runInAction(() => {
        if (currentDefaultState) set(this.stateMap, [currentDefaultState.id, "default"], false);
        set(this.stateMap, [stateId, "default"], true);
      });
      await this.stateService.markDefault(workspaceSlug, projectId, stateId);
    } catch (error) {
      // reverting back to old state group if api fails
      runInAction(() => {
        this.stateMap = originalStates;
      });
      throw error;
    }
  };

  /**
   * updates the sort order of a state and updates the state information using API, in case of failure reverts back to original state
   * @param workspaceSlug
   * @param projectId
   * @param stateId
   * @param direction
   * @param groupIndex
   */
  moveStatePosition = async (workspaceSlug: string, projectId: string, stateId: string, payload: Partial<IState>) => {
    const originalStates = this.stateMap;
    try {
      Object.entries(payload).forEach(([key, value]) => {
        runInAction(() => {
          set(this.stateMap, [stateId, key], value);
        });
      });
      // updating using api
      await this.stateService.patchState(workspaceSlug, projectId, stateId, payload);
    } catch (err) {
      // reverting back to old state group if api fails
      runInAction(() => {
        this.stateMap = originalStates;
      });
    }
  };

  // Dummy method
  fetchProjectStateTransitions = (workspaceSlug: string, projectId: string) => {};
}
