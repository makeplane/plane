import { set, groupBy } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { STATE_GROUPS } from "@plane/constants";
import type { IIntakeState, IState } from "@plane/types";
// helpers
import { sortStates } from "@plane/utils";
// plane web
import { ProjectStateService } from "@/plane-web/services/project/project-state.service";
import type { RootStore } from "@/plane-web/store/root.store";

export interface IStateStore {
  //Loaders
  fetchedMap: Record<string, boolean>;
  fetchedIntakeMap: Record<string, boolean>;
  // observables
  stateMap: Record<string, IState>;
  intakeStateMap: Record<string, IIntakeState>;
  // computed
  workspaceStates: IState[] | undefined;
  projectStates: IState[] | undefined;
  groupedProjectStates: Record<string, IState[]> | undefined;
  // computed actions
  getStateById: (stateId: string | null | undefined) => IState | undefined;
  getIntakeStateById: (intakeStateId: string | null | undefined) => IIntakeState | undefined;
  getProjectStates: (projectId: string | null | undefined) => IState[] | undefined;
  getProjectIntakeState: (projectId: string | null | undefined) => IIntakeState | undefined;
  getProjectStateIds: (projectId: string | null | undefined) => string[] | undefined;
  getProjectIntakeStateIds: (projectId: string | null | undefined) => string[] | undefined;
  getProjectDefaultStateId: (projectId: string | null | undefined) => string | undefined;
  // fetch actions
  fetchProjectStates: (workspaceSlug: string, projectId: string) => Promise<IState[]>;
  fetchProjectIntakeState: (workspaceSlug: string, projectId: string) => Promise<IIntakeState>;
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

  getStatePercentageInGroup: (stateId: string | null | undefined) => number | undefined;
}

export class StateStore implements IStateStore {
  stateMap: Record<string, IState> = {};
  intakeStateMap: Record<string, IIntakeState> = {};
  //loaders
  fetchedMap: Record<string, boolean> = {};
  fetchedIntakeMap: Record<string, boolean> = {};
  rootStore: RootStore;
  router;
  stateService: ProjectStateService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      stateMap: observable,
      intakeStateMap: observable,
      fetchedMap: observable,
      fetchedIntakeMap: observable,
      // computed
      projectStates: computed,
      groupedProjectStates: computed,
      // fetch action
      fetchProjectStates: action,
      fetchProjectIntakeState: action,
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

    // First group the existing states
    const groupedStates = groupBy(this.projectStates, "group") as Record<string, IState[]>;

    // Ensure all STATE_GROUPS are present
    const allGroups = Object.keys(STATE_GROUPS).reduce(
      (acc, group) => ({
        ...acc,
        [group]: groupedStates[group] || [],
      }),
      {} as Record<string, IState[]>
    );

    return allGroups;
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
   * @description returns intake state details using intake state id
   * @param intakeStateId
   */
  getIntakeStateById = computedFn((intakeStateId: string | null | undefined) => {
    if (!this.intakeStateMap || !intakeStateId) return;
    return this.intakeStateMap[intakeStateId] ?? undefined;
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
   * Returns the intake state for a project by projectId
   * @param projectId
   * @returns IIntakeState | undefined
   */
  getProjectIntakeState = computedFn((projectId: string | null | undefined) => {
    if (!projectId || !this.fetchedIntakeMap[projectId]) return;
    return Object.values(this.intakeStateMap).find((state) => state.project_id === projectId);
  });

  /**
   * Returns the state ids for a project by projectId
   * @param projectId
   * @returns string[]
   */
  getProjectStateIds = computedFn((projectId: string | null | undefined) => {
    const workspaceSlug = this.router.workspaceSlug;
    if (!workspaceSlug || !projectId || !(this.fetchedMap[projectId] || this.fetchedMap[workspaceSlug]))
      return undefined;
    const projectStates = this.getProjectStates(projectId);
    return projectStates?.map((state) => state.id) ?? [];
  });

  /**
   * Returns the intake state ids for a project by projectId
   * @param projectId
   * @returns string[]
   */
  getProjectIntakeStateIds = computedFn((projectId: string | null | undefined) => {
    const workspaceSlug = this.router.workspaceSlug;
    if (!workspaceSlug || !projectId || !this.fetchedIntakeMap[projectId]) return undefined;
    const projectIntakeState = this.getProjectIntakeState(projectId);
    return projectIntakeState?.id ? [projectIntakeState.id] : [];
  });

  /**
   * Returns the default state id for a project
   * @param projectId
   * @returns string | undefined
   */
  getProjectDefaultStateId = computedFn((projectId: string | null | undefined) => {
    const projectStates = this.getProjectStates(projectId);
    return projectStates?.find((state) => state.default)?.id;
  });

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
   * fetches the intakeStateMap of a project
   * @param workspaceSlug
   * @param projectId
   * @returns
   */
  fetchProjectIntakeState = async (workspaceSlug: string, projectId: string) => {
    const intakeStateResponse = await this.stateService.getIntakeState(workspaceSlug, projectId);
    runInAction(() => {
      set(this.intakeStateMap, [intakeStateResponse.id], intakeStateResponse);
      set(this.fetchedIntakeMap, projectId, true);
    });
    return intakeStateResponse;
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
   * deletes the state from the store, in case of failure reverts back to original state
   * @param workspaceSlug
   * @param projectId
   * @param stateId
   */
  deleteState = async (workspaceSlug: string, projectId: string, stateId: string) => {
    if (!this.stateMap?.[stateId]) return;
    await this.stateService.deleteState(workspaceSlug, projectId, stateId).then(() => {
      runInAction(() => {
        delete this.stateMap[stateId];
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
    } catch {
      // reverting back to old state group if api fails
      runInAction(() => {
        this.stateMap = originalStates;
      });
    }
  };

  /**
   * Returns the percentage position of a state within its group based on sequence
   * @param stateId The ID of the state to find the percentage for
   * @returns The percentage position of the state in its group (0-100), or -1 if not found
   */
  getStatePercentageInGroup = computedFn((stateId: string | null | undefined) => {
    if (!stateId || !this.stateMap[stateId]) return -1;

    const state = this.stateMap[stateId];
    const group = state.group;

    if (!group || !this.groupedProjectStates || !this.groupedProjectStates[group]) return -1;

    // Get all states in the same group
    const statesInGroup = this.groupedProjectStates[group];
    const stateIndex = statesInGroup.findIndex((s) => s.id === stateId);

    if (stateIndex === -1) return undefined;

    // Calculate percentage: ((index + 1) / totalLength) * 100
    return ((stateIndex + 1) / statesInGroup.length) * 100;
  });
}
