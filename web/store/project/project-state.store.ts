import { observable, action, makeObservable, runInAction, computed } from "mobx";
// types
import { RootStore } from "../root";
import { IState } from "types";
// services
import { ProjectService, ProjectStateService } from "services/project";
import { groupByField } from "helpers/array.helper";

export interface IProjectStateStore {
  loader: boolean;
  error: any | null;

  states: {
    [projectId: string]: IState[]; // projectId: states
  };
  groupedProjectStates: { [groupId: string]: IState[] } | null;
  projectStates: IState[] | null;

  projectStateIds: () => string[];

  fetchProjectStates: (workspaceSlug: string, projectId: string) => Promise<IState[]>;
  createState: (workspaceSlug: string, projectId: string, data: Partial<IState>) => Promise<IState>;
  updateState: (workspaceSlug: string, projectId: string, stateId: string, data: Partial<IState>) => Promise<IState>;
  deleteState: (workspaceSlug: string, projectId: string, stateId: string) => Promise<void>;
  markStateAsDefault: (workspaceSlug: string, projectId: string, stateId: string) => Promise<void>;
  moveStatePosition: (
    workspaceSlug: string,
    projectId: string,
    stateId: string,
    direction: "up" | "down",
    groupIndex: number
  ) => Promise<void>;
}

export class ProjectStateStore implements IProjectStateStore {
  loader: boolean = false;
  error: any | null = null;
  states: {
    [projectId: string]: IState[]; // projectId: states
  } = {};
  // root store
  rootStore;
  // service
  projectService;
  stateService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable.ref,
      error: observable.ref,
      states: observable.ref,
      // computed
      projectStates: computed,
      groupedProjectStates: computed,
      // actions
      createState: action,
      updateState: action,
      deleteState: action,
      markStateAsDefault: action,
      moveStatePosition: action,
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectService();
    this.stateService = new ProjectStateService();
  }

  get groupedProjectStates() {
    if (!this.rootStore.project.projectId) return null;
    const states = this.states[this.rootStore.project.projectId];
    if (!states) return null;
    return groupByField(states, "group");
  }

  get projectStates() {
    if (!this.rootStore.project.projectId) return null;
    const states = this.states[this.rootStore.project.projectId];
    if (!states) return null;
    return states;
  }

  projectStateIds = () => {
    if (!this.projectStates) return [];
    return (this.projectStates ?? []).map((state) => state.id);
  };

  fetchProjectStates = async (workspaceSlug: string, projectId: string) => {
    try {
      const states = await this.stateService.getStates(workspaceSlug, projectId);
      runInAction(() => {
        this.states = {
          ...this.states,
          [projectId]: states,
        };
      });
      return states;
    } catch (error) {
      throw error;
    }
  };

  getProjectStateById = (stateId: string) => {
    if (!this.rootStore.project.projectId) return null;
    const states = this.states[this.rootStore.project.projectId];
    if (!states) return null;
    const stateInfo: IState | null = states.find((state) => state.id === stateId) || null;
    return stateInfo;
  };

  createState = async (workspaceSlug: string, projectId: string, data: Partial<IState>) => {
    try {
      const response = await this.stateService.createState(workspaceSlug, projectId, data);

      runInAction(() => {
        this.states = {
          ...this.states,
          [projectId]: [...this.states?.[projectId], response],
        };
      });

      return response;
    } catch (error) {
      console.log("Failed to create state from project store");
      throw error;
    }
  };

  updateState = async (workspaceSlug: string, projectId: string, stateId: string, data: Partial<IState>) => {
    const originalStates = this.states;

    try {
      runInAction(() => {
        this.states = {
          ...this.states,
          [projectId]: [
            ...this.states?.[projectId].map((state) => {
              if (state.id === stateId) {
                return { ...state, ...data };
              }
              return state;
            }),
          ],
        };
      });

      const response = await this.stateService.patchState(workspaceSlug, projectId, stateId, data);

      return response;
    } catch (error) {
      console.log("Failed to update state from project store");
      runInAction(() => {
        this.states = originalStates;
      });
      throw error;
    }
  };

  deleteState = async (workspaceSlug: string, projectId: string, stateId: string) => {
    const originalStates = this.states;

    try {
      runInAction(() => {
        this.states = {
          ...this.states,
          [projectId]: [
            ...this.states?.[projectId].filter((state) => {
              if (state.id !== stateId) {
                return stateId;
              }
            }),
          ],
        };
      });

      // deleting using api
      await this.stateService.deleteState(workspaceSlug, projectId, stateId);
    } catch (error) {
      console.log("Failed to delete state from project store");
      // reverting back to original label list
      runInAction(() => {
        this.states = originalStates;
      });
      throw error;
    }
  };

  markStateAsDefault = async (workspaceSlug: string, projectId: string, stateId: string) => {
    const originalStates = this.states;
    try {
      const currentDefaultStateIds = this.projectStates?.filter((s) => s.default).map((state) => state.id);

      runInAction(() => {
        this.states = {
          ...this.states,
          [projectId]: [
            ...this.states[projectId].map((state) => {
              if (currentDefaultStateIds?.includes(state.id)) {
                return { ...state, default: false };
              } else if (state.id === stateId) {
                return { ...state, default: true };
              }
              return state;
            }),
          ],
        };
      });

      // updating using api
      await this.stateService.markDefault(workspaceSlug, projectId, stateId);
    } catch (error) {
      console.log("Failed to mark state as default");
      runInAction(() => {
        this.states = originalStates;
      });
      throw error;
    }
  };

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

      const newStateList = states?.map((state) => {
        if (state.id === stateId) return { ...state, sequence: newSequence };
        return state;
      });

      // updating using api
      runInAction(() => {
        this.states = {
          ...this.states,
          [projectId]: newStateList,
        };
      });

      await this.stateService.patchState(workspaceSlug, projectId, stateId, { sequence: newSequence });
    } catch (err) {
      console.log("Failed to move state position");
      // reverting back to old state group if api fails
      runInAction(() => {
        this.states = originalStates;
      });
    }
  };
}
