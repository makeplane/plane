import { makeObservable, observable, computed, action, runInAction } from "mobx";
import groupBy from "lodash/groupBy";
import keyBy from "lodash/keyBy";
import omit from "lodash/omit";
// store
import { RootStore } from "./root.store";
// types
import { IState } from "types";
// services
import { ProjectStateService } from "services/project";

export interface IStateStore {
  states: Record<string, IState>;
  projectStates: IState[] | undefined;
  groupedProjectStates: Record<string, IState[]> | undefined;
}

export class StateStore implements IStateStore {
  states: Record<string, IState> = {};
  router;
  stateService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      states: observable.ref,
      // computed
      projectStates: computed,
      groupedProjectStates: computed,
      // actions
      getProjectStates: action,
      fetchProjectStates: action,
      createState: action,
      updateState: action,
      deleteState: action,
    });
    this.stateService = new ProjectStateService();
    this.router = _rootStore.app.router;
  }

  /**
   * Returns the states belongs to a specific project
   */
  get projectStates() {
    if (!this.router.query?.projectId) return;
    return Object.values(this.states).filter((state) => state.project === this.router.query.projectId);
  }

  /**
   * Returns the states belongs to a specific project grouped by group
   */
  get groupedProjectStates() {
    if (!this.router.query?.projectId) return;
    return groupBy(this.projectStates, "group") as Record<string, IState[]>;
  }

  /**
   * Returns the states belongs to a project by projectId
   * @param projectId
   * @returns IState[]
   */
  getProjectStates(projectId: string) {
    return Object.values(this.states).filter((state) => state.project === projectId);
  }

  /**
   * fetches the states of a project
   * @param workspaceSlug
   * @param projectId
   * @returns
   */
  fetchProjectStates = async (workspaceSlug: string, projectId: string) => {
    const states = await this.stateService.getStates(workspaceSlug, projectId);
    runInAction(() => {
      this.states = {
        ...this.states,
        ...keyBy(states, "id"),
      };
    });
    return states;
  };

  /**
   * creates a new state in a project and adds it to the store
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @returns
   */
  createState = async (workspaceSlug: string, projectId: string, data: Partial<IState>) => {
    const response = await this.stateService.createState(workspaceSlug, projectId, data);
    runInAction(() => {
      this.states = {
        ...this.states,
        [response?.id]: response,
      };
    });
    return response;
  };

  /**
   * Updates the state details in the store, in case of failure reverts back to original state
   * @param workspaceSlug
   * @param projectId
   * @param stateId
   * @param data
   * @returns
   */
  updateState = async (workspaceSlug: string, projectId: string, stateId: string, data: Partial<IState>) => {
    const originalState = this.states[stateId];
    try {
      runInAction(() => {
        this.states = {
          ...this.states,
          [stateId]: { ...this.states?.[stateId], ...data },
        };
      });
      const response = await this.stateService.patchState(workspaceSlug, projectId, stateId, data);
      return response;
    } catch (error) {
      runInAction(() => {
        this.states = {
          ...this.states,
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
    const originalStates = this.states;
    try {
      runInAction(() => {
        this.states = omit(this.states, stateId);
      });
      await this.stateService.deleteState(workspaceSlug, projectId, stateId);
    } catch (error) {
      runInAction(() => {
        this.states = originalStates;
      });
      throw error;
    }
  };

  /**
   * marks a state as default in a project
   * @param workspaceSlug
   * @param projectId
   * @param stateId
   */
  markStateAsDefault = async (workspaceSlug: string, projectId: string, stateId: string) => {
    const originalStates = this.states;
    try {
      runInAction(() => {
        this.states = {
          ...this.states,
          [stateId]: { ...this.states[stateId], default: true },
        };
      });
      await this.stateService.markDefault(workspaceSlug, projectId, stateId);
    } catch (error) {
      runInAction(() => {
        this.states = originalStates;
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
  moveStatePosition = async (
    workspaceSlug: string,
    projectId: string,
    stateId: string,
    direction: "up" | "down",
    groupIndex: number
  ) => {
    const SEQUENCE_GAP = 15000;
    const originalStates = this.states;
    try {
      let newSequence = SEQUENCE_GAP;
      const states = this.projectStates || [];
      const selectedState = states?.find((state) => state.id === stateId);
      const groupStates = states?.filter((state) => state.group === selectedState?.group);
      const groupLength = groupStates.length;
      if (direction === "up") {
        if (groupIndex === 1) newSequence = groupStates[0].sequence - SEQUENCE_GAP;
        else newSequence = (groupStates[groupIndex - 2].sequence + groupStates[groupIndex - 1].sequence) / 2;
      } else {
        if (groupIndex === groupLength - 2) newSequence = groupStates[groupLength - 1].sequence + SEQUENCE_GAP;
        else newSequence = (groupStates[groupIndex + 2].sequence + groupStates[groupIndex + 1].sequence) / 2;
      }
      // updating using api
      runInAction(() => {
        this.states = {
          ...this.states,
          [stateId]: { ...this.states[stateId], sequence: newSequence },
        };
      });
      await this.stateService.patchState(workspaceSlug, projectId, stateId, { sequence: newSequence });
    } catch (err) {
      // reverting back to old state group if api fails
      runInAction(() => {
        this.states = originalStates;
      });
    }
  };
}
