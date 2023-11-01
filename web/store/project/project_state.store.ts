import { observable, action, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "../root";
import { IState } from "types";
// services
import { ProjectService, ProjectStateService } from "services/project";
import { groupBy, orderArrayBy } from "helpers/array.helper";
import { orderStateGroups } from "helpers/state.helper";

export interface IProjectStateStore {
  loader: boolean;
  error: any | null;

  // states
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

  // root store
  rootStore;
  // service
  projectService;
  stateService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable,
      error: observable,

      // states
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

  createState = async (workspaceSlug: string, projectId: string, data: Partial<IState>) => {
    try {
      const response = await this.stateService.createState(
        workspaceSlug,
        projectId,
        data,
        this.rootStore.user.currentUser!
      );

      runInAction(() => {
        this.rootStore.project.states = {
          ...this.rootStore.project.states,
          [projectId]: {
            ...this.rootStore.project.states?.[projectId],
            [response.group]: [...(this.rootStore.project.states?.[projectId]?.[response.group] || []), response],
          },
        };
      });

      return response;
    } catch (error) {
      console.log("Failed to create state from project store");
      throw error;
    }
  };

  updateState = async (workspaceSlug: string, projectId: string, stateId: string, data: Partial<IState>) => {
    const originalStates = this.rootStore.project.states;

    runInAction(() => {
      this.rootStore.project.states = {
        ...this.rootStore.project.states,
        [projectId]: {
          ...this.rootStore.project.states?.[projectId],
          [data.group as string]: (this.rootStore.project.states?.[projectId]?.[data.group as string] || []).map(
            (state) => (state.id === stateId ? { ...state, ...data } : state)
          ),
        },
      };
    });

    try {
      const response = await this.stateService.patchState(
        workspaceSlug,
        projectId,
        stateId,
        data,
        this.rootStore.user.currentUser!
      );

      runInAction(() => {
        this.rootStore.project.states = {
          ...this.rootStore.project.states,
          [projectId]: {
            ...this.rootStore.project.states?.[projectId],
            [response.group]: (this.rootStore.project.states?.[projectId]?.[response.group] || []).map((state) =>
              state.id === stateId ? { ...state, ...response } : state
            ),
          },
        };
      });

      return response;
    } catch (error) {
      console.log("Failed to update state from project store");
      runInAction(() => {
        this.rootStore.project.states = {
          ...this.rootStore.project.states,
          [projectId]: {
            ...this.rootStore.project.states?.[projectId],
            [data.group as string]: originalStates || [],
          },
        } as any;
      });
      throw error;
    }
  };

  deleteState = async (workspaceSlug: string, projectId: string, stateId: string) => {
    const originalStates = this.rootStore.project.projectStates;

    try {
      runInAction(() => {
        this.rootStore.project.states = {
          ...this.rootStore.project.states,
          [projectId]: {
            ...this.rootStore.project.states?.[projectId],
            [originalStates?.[0]?.group || ""]: (
              this.rootStore.project.states?.[projectId]?.[originalStates?.[0]?.group || ""] || []
            ).filter((state) => state.id !== stateId),
          },
        };
      });

      // deleting using api
      await this.stateService.deleteState(workspaceSlug, projectId, stateId, this.rootStore.user.currentUser!);
    } catch (error) {
      console.log("Failed to delete state from project store");
      // reverting back to original label list
      runInAction(() => {
        this.rootStore.project.states = {
          ...this.rootStore.project.states,
          [projectId]: {
            ...this.rootStore.project.states?.[projectId],
            [originalStates?.[0]?.group || ""]: originalStates || [],
          },
        };
      });
    }
  };

  markStateAsDefault = async (workspaceSlug: string, projectId: string, stateId: string) => {
    const states = this.rootStore.project.projectStates;
    const currentDefaultState = states?.find((state) => state.default);

    let newStateList =
      states?.map((state) => {
        if (state.id === stateId) return { ...state, default: true };
        if (state.id === currentDefaultState?.id) return { ...state, default: false };
        return state;
      }) ?? [];
    newStateList = orderArrayBy(newStateList, "sequence", "ascending");

    const newOrderedStateGroups = orderStateGroups(groupBy(newStateList, "group"));
    const oldOrderedStateGroup = this.rootStore.project.states?.[projectId] || {}; // for reverting back to old state group if api fails

    runInAction(() => {
      this.rootStore.project.states = {
        ...this.rootStore.project.states,
        [projectId]: newOrderedStateGroups || {},
      };
    });

    // updating using api
    try {
      this.stateService.patchState(
        workspaceSlug,
        projectId,
        stateId,
        { default: true },
        this.rootStore.user.currentUser!
      );

      if (currentDefaultState)
        this.stateService.patchState(
          workspaceSlug,
          projectId,
          currentDefaultState.id,
          { default: false },
          this.rootStore.user.currentUser!
        );
    } catch (err) {
      console.log("Failed to mark state as default");
      runInAction(() => {
        this.rootStore.project.states = {
          ...this.rootStore.project.states,
          [projectId]: oldOrderedStateGroup,
        };
      });
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
    let newSequence = SEQUENCE_GAP;

    const states = this.rootStore.project.projectStates || [];
    const groupedStates = groupBy(states || [], "group");

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
    const newOrderedStateGroups = orderStateGroups(
      groupBy(orderArrayBy(newStateList, "sequence", "ascending"), "group")
    );

    runInAction(() => {
      this.rootStore.project.states = {
        ...this.rootStore.project.states,
        [projectId]: newOrderedStateGroups || {},
      };
    });

    // updating using api
    try {
      await this.stateService.patchState(
        workspaceSlug,
        projectId,
        stateId,
        { sequence: newSequence },
        this.rootStore.user.currentUser!
      );
    } catch (err) {
      console.log("Failed to move state position");
      // reverting back to old state group if api fails
      runInAction(() => {
        this.rootStore.project.states = {
          ...this.rootStore.project.states,
          [projectId]: groupedStates,
        };
      });
    }
  };
}
