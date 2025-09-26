import { orderBy, get, set, update, uniq, concat } from "lodash-es";
import { action, autorun, makeObservable, observable, reaction, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { E_FEATURE_FLAGS, E_SORT_ORDER } from "@plane/constants";
import {
  TLoader,
  IStateTransition,
  IStateWorkFlow,
  IStateWorkFlowResponse,
  TWorkflowChangeHistory,
} from "@plane/types";
// helpers
import { convertStringArrayToBooleanObject } from "@plane/utils";
// store
import { IStateStore as ICoreStateStore, StateStore as CoreStateStore } from "@/store/state.store";
// local imports
import { RootStore } from "./root.store";

export interface IStateStore extends ICoreStateStore {
  // observables
  stateTransitionMap: Record<string, IStateWorkFlow>;
  stateWorkItemCreationAllowedMap: Record<string, boolean>;
  workflowChangeHistorySortOrder: E_SORT_ORDER | undefined;
  workflowChangeHistoryLoader: Record<string, TLoader>; // projectId => loader
  workflowChangeHistoryMap: Record<string, TWorkflowChangeHistory[]>; // projectId => workflowChangeHistory
  // computed functions
  getIsWorkflowEnabled: (workspaceSlug: string, projectId?: string | null | undefined) => boolean;
  getIsWorkItemCreationAllowedForState: (parentStateId: string) => boolean;
  getTransitionById: (parentStateId: string, transitionId: string) => IStateTransition;
  getAvailableStateTransitionIds: (
    projectId: string,
    parentStateId: string,
    currStateId: string | undefined
  ) => string[];
  getAvailableProjectStateIdMap: (
    projectId: string | null | undefined,
    currStateId: string | null | undefined
  ) => { [key: string]: boolean };
  getNextAvailableTransitionStateId: (projectId: string, parentStateId: string) => string | undefined;
  getAvailableWorkItemCreationStateIdMap: (projectId: string | null | undefined) => Record<string, boolean>;
  getAvailableWorkItemCreationStateIds: (projectId: string | null | undefined) => string[];
  getWorkflowChangeHistorySortOrder: () => E_SORT_ORDER;
  getWorkflowChangeHistoryLoader: (projectId: string) => TLoader | undefined;
  getWorkflowChangeHistory: (projectId: string) => TWorkflowChangeHistory[] | undefined;
  // helper actions
  toggleWorkflowChangeHistorySortOrder: () => void;
  // actions
  fetchWorkflowStates: (workspaceSlug: string, projectId?: string) => void;
  fetchWorkflowChangeHistory: (workspaceSlug: string, projectId: string) => Promise<void>;
  toggleAllowWorkItemCreationLogic: (workspaceSlug: string, stateId: string) => Promise<void>;
  addStateTransition: (
    workspaceSlug: string,
    projectId: string,
    parentStateId: string,
    transitionStateId?: string,
    memberIds?: string[]
  ) => Promise<void>;
  removeStateTransition: (
    workspaceSlug: string,
    projectId: string,
    parentStateId: string,
    transitionId: string
  ) => Promise<void>;
  changeStateTransition: (
    workspaceSlug: string,
    projectId: string,
    parentStateId: string,
    transitionId: string,
    stateId: string
  ) => Promise<void>;
  modifyStateTransitionMemberPermission: (
    workspaceSlug: string,
    projectId: string,
    parentStateId: string,
    transitionId: string,
    actorIds: string[]
  ) => Promise<void>;
  resetWorkflowStates: (workspaceSlug: string, projectId: string) => Promise<void>;
}

export class StateStore extends CoreStateStore implements IStateStore {
  stateTransitionMap: IStateStore["stateTransitionMap"] = {};
  stateWorkItemCreationAllowedMap: IStateStore["stateWorkItemCreationAllowedMap"] = {};
  workflowChangeHistorySortOrder: IStateStore["workflowChangeHistorySortOrder"] = undefined;
  workflowChangeHistoryLoader: IStateStore["workflowChangeHistoryLoader"] = {};
  workflowChangeHistoryMap: IStateStore["workflowChangeHistoryMap"] = {};

  constructor(_rootStore: RootStore) {
    super(_rootStore);
    makeObservable(this, {
      // observables
      stateTransitionMap: observable,
      stateWorkItemCreationAllowedMap: observable,
      workflowChangeHistorySortOrder: observable,
      workflowChangeHistoryLoader: observable,
      workflowChangeHistoryMap: observable,
      // actions
      fetchWorkflowStates: action,
      fetchWorkflowChangeHistory: action,
      addStateTransition: action,
      removeStateTransition: action,
      changeStateTransition: action,
      modifyStateTransitionMemberPermission: action,
      resetWorkflowStates: action,
    });

    // autorun to get or set workflow change history sort order to local storage
    autorun(() => {
      if (typeof localStorage === "undefined") return;
      if (this.workflowChangeHistorySortOrder === undefined) {
        // Initialize sort order if not set
        const storedSortOrder =
          (localStorage.getItem(`workflow-change-history-sort-order`) as E_SORT_ORDER | undefined) ?? E_SORT_ORDER.DESC;
        this.workflowChangeHistorySortOrder = storedSortOrder;
      } else {
        // Update local storage if sort order is set
        localStorage.setItem(`workflow-change-history-sort-order`, this.workflowChangeHistorySortOrder);
      }
    });

    // reaction to sync state transition map and work item creation allowed map with stateMap
    reaction(
      () => ({
        stateIds: Object.keys(this.stateMap),
      }),
      ({ stateIds }) => {
        for (const stateId of stateIds) {
          if (!this.stateTransitionMap[stateId]) {
            this.stateTransitionMap[stateId] = {};
          }
          if (!this.stateWorkItemCreationAllowedMap[stateId]) {
            this.stateWorkItemCreationAllowedMap[stateId] = true;
          }
        }
      }
    );
  }

  /**
   * Returns true if workflow is enabled.
   * Checks the feature flag if projectId is not provided.
   * If projectId is provided, it checks the project feature along with the feature flag.
   * @param workspaceSlug
   * @param projectId
   * @returns
   */
  getIsWorkflowEnabled = computedFn((workspaceSlug: string, projectId?: string | null | undefined) => {
    const isFeatureFlagEnabled = this.rootStore.featureFlags.getFeatureFlag(
      workspaceSlug,
      E_FEATURE_FLAGS.WORKFLOWS,
      false
    );
    if (!projectId) return isFeatureFlagEnabled;
    const isWorkflowEnabledForProject = this.rootStore.projectDetails.isProjectFeatureEnabled(
      projectId,
      "is_workflow_enabled"
    );
    return isFeatureFlagEnabled && isWorkflowEnabledForProject;
  });

  /**
   * Returns true if work item creation is allowed for the state
   */
  getIsWorkItemCreationAllowedForState = computedFn((parentStateId: string) => {
    const stateDetails = this.getStateById(parentStateId);
    if (stateDetails?.default) return true;
    return !!this.stateWorkItemCreationAllowedMap[parentStateId];
  });

  /**
   * Gets transition by ID
   */
  getTransitionById = computedFn(
    (parentStateId: string, transitionId: string) => this.stateTransitionMap[parentStateId]?.[transitionId]
  );

  /**
   * Returns available transition ids for the state transition that are not yet added to the state transition
   */
  getAvailableStateTransitionIds = computedFn(
    (projectId: string, parentStateId: string, currStateId: string | undefined) => {
      const projectStates = this.getProjectStates(projectId);

      if (!projectStates) return [];

      // get current transition Ids of the state transition
      const currentTransitionIds = Object.values(this.stateTransitionMap[parentStateId] ?? {}).map(
        (stateTransition) => stateTransition.transition_state_id
      );
      currentTransitionIds.push(parentStateId);

      // return back stateIds that currently do not exist on the state transition
      return projectStates
        .map((projectState) => projectState.id)
        .filter((projectStateId) => !currentTransitionIds.includes(projectStateId) || projectStateId === currStateId);
    }
  );

  /**
   * Returns the next available transition state Id that is not yet part of the state transition
   */
  getNextAvailableTransitionStateId = computedFn((projectId: string, parentStateId: string) => {
    const availableStateTransitionIds = this.getAvailableStateTransitionIds(projectId, parentStateId, undefined);

    return availableStateTransitionIds &&
      Array.isArray(availableStateTransitionIds) &&
      availableStateTransitionIds.length
      ? availableStateTransitionIds[0]
      : undefined;
  });

  /**
   * Returns back a map that contains stateId as key and boolean indicating if the user has permission to edit currently
   */
  getAvailableProjectStateIdMap = computedFn(
    (projectId: string | null | undefined, currStateId: string | null | undefined) => {
      const workspaceSlug = this.rootStore.router.workspaceSlug;
      const projectStates = this.getProjectStates(projectId);
      const isWorkFlowEnabled = workspaceSlug ? this.getIsWorkflowEnabled(workspaceSlug, projectId) : false;

      const currentUserId = this.rootStore.user.data?.id;

      // If project States are undefined then return empty object
      if (!projectStates) return {};

      const projectStateIds = projectStates.map((projectState) => projectState.id);

      // return all states as true if there is no transitionMap ot workflow is not enabled.
      if (
        !isWorkFlowEnabled ||
        !currStateId ||
        !this.stateTransitionMap[currStateId] ||
        Object.keys(this.stateTransitionMap[currStateId]).length === 0 ||
        !currentUserId
      )
        return convertStringArrayToBooleanObject(projectStateIds);

      // get current transitionIds to which you have access
      const currentTransitionStateIds = Object.values(this.stateTransitionMap[currStateId] ?? {})
        .filter(
          (transitionState) =>
            transitionState.approvers.length === 0 || transitionState.approvers.includes(currentUserId)
        )
        .map((transitionState) => transitionState.transition_state_id);
      currentTransitionStateIds.push(currStateId);

      // return all the states as true if the user has permission for them
      return convertStringArrayToBooleanObject(
        projectStateIds.filter((projectStateId) => currentTransitionStateIds.includes(projectStateId))
      );
    }
  );

  /**
   * Returns an object linking work item creation state permissions as boolean values
   * @param projectId
   */
  getAvailableWorkItemCreationStateIdMap = computedFn((projectId: string | null | undefined) => {
    const workspaceSlug = this.rootStore.router.workspaceSlug;
    const projectStates = this.getProjectStates(projectId);
    const isWorkFlowEnabled = workspaceSlug ? this.getIsWorkflowEnabled(workspaceSlug, projectId) : false;
    // If project States are undefined then return empty object
    if (!projectStates) return {};
    const projectStateIds = projectStates.map((projectState) => projectState.id);

    // return all states as true if workflow is not enabled.
    if (!isWorkFlowEnabled) return convertStringArrayToBooleanObject(projectStateIds);

    // return all the states as true if the user has permission for them
    return convertStringArrayToBooleanObject(
      projectStateIds.filter((projectStateId) => this.getIsWorkItemCreationAllowedForState(projectStateId))
    );
  });

  /**
   * Returns the available project state ids based on the workflows
   */
  getAvailableWorkItemCreationStateIds = computedFn((projectId: string | null | undefined): string[] => {
    const stateIdMap = this.getAvailableWorkItemCreationStateIdMap(projectId);
    return Object.entries(stateIdMap).reduce<string[]>((allowedStateIds, [stateId, isCreationAllowed]) => {
      if (isCreationAllowed) {
        allowedStateIds.push(stateId);
      }
      return allowedStateIds;
    }, []);
  });

  /**
   * Get workflow change history sort order
   */
  getWorkflowChangeHistorySortOrder = computedFn(() => this.workflowChangeHistorySortOrder ?? E_SORT_ORDER.DESC);

  /**
   * Get workflow change history loader
   * @param projectId
   */
  getWorkflowChangeHistoryLoader = computedFn((projectId: string) => this.workflowChangeHistoryLoader[projectId]);

  /**
   * Get workflow change history
   * @param projectId
   */
  getWorkflowChangeHistory = computedFn((projectId: string) =>
    orderBy(this.workflowChangeHistoryMap[projectId], "created_at", this.workflowChangeHistorySortOrder)
  );

  // helper actions
  /**
   * Toggle workflow change history sort order
   */
  toggleWorkflowChangeHistorySortOrder = () => {
    this.workflowChangeHistorySortOrder =
      this.workflowChangeHistorySortOrder === E_SORT_ORDER.ASC ? E_SORT_ORDER.DESC : E_SORT_ORDER.ASC;
  };

  /**
   * Merge workflow change history
   * @param currentWorkflowChangeHistory
   * @param newWorkflowChangeHistory
   */
  mergeWorkflowChangeHistory = (
    currentWorkflowChangeHistory: TWorkflowChangeHistory[],
    newWorkflowChangeHistory: TWorkflowChangeHistory[]
  ) => {
    // Create a map for lookups of new workflow change history
    const newWorkflowChangeHistoryMap = new Map(newWorkflowChangeHistory.map((change) => [change.id, change]));

    // Update existing workflow change history if they exist in new workflow change history
    const updatedWorkflowChangeHistory = currentWorkflowChangeHistory.map((change) => {
      const matchingNewChange = newWorkflowChangeHistoryMap.get(change.id);
      return matchingNewChange
        ? {
            ...change,
            created_at: matchingNewChange.created_at,
          }
        : change;
    });

    // Find workflow change history that don't exist in current workflow change history
    const existingIdsSet = new Set(currentWorkflowChangeHistory.map((change) => change.id));
    const workflowChangeHistoryToAdd = newWorkflowChangeHistory.filter((change) => !existingIdsSet.has(change.id));

    // Combine and deduplicate
    return uniq(concat(updatedWorkflowChangeHistory, workflowChangeHistoryToAdd));
  };

  // actions
  /**
   * Fetch workflow states for the given project if projectId is provided, else fetch all workflows
   * @param workspaceSlug
   * @param projectId
   * @returns
   */
  fetchWorkflowStates = async (workspaceSlug: string, projectId?: string) => {
    try {
      const projectStateTransitions: IStateWorkFlowResponse = await this.stateService.fetchWorkflowStates(
        workspaceSlug,
        projectId
      );
      runInAction(() => {
        if (projectStateTransitions) {
          Object.entries(projectStateTransitions).forEach(([stateId, workflow]) => {
            if (workflow.transitions && Object.keys(workflow.transitions).length > 0) {
              set(this.stateTransitionMap, [stateId], workflow.transitions);
            }
            set(this.stateWorkItemCreationAllowedMap, [stateId], workflow.allow_issue_creation);
          });
        }
      });
    } catch (e) {
      console.log("error while fetching state transitions", e);
    }
  };

  /**
   * Fetch workflow change history
   * @param workspaceSlug
   * @param projectId
   */
  fetchWorkflowChangeHistory = async (workspaceSlug: string, projectId: string) => {
    try {
      // Generate props
      let props = {};
      // Get the current project workflow change history
      const currentWorkflowChangeHistory = this.workflowChangeHistoryMap[projectId];
      // If there is a current workflow change history, set the props to the last created_at date
      if (currentWorkflowChangeHistory && currentWorkflowChangeHistory.length > 0) {
        // set the loader
        set(this.workflowChangeHistoryLoader, projectId, "mutation");
        // Get the last workflow change history
        const currentActivity = currentWorkflowChangeHistory[currentWorkflowChangeHistory.length - 1];
        if (currentActivity) props = { created_at__gt: currentActivity.created_at };
      } else {
        set(this.workflowChangeHistoryLoader, projectId, "init-loader");
      }
      // Fetch the workflow change history
      const workflowChangeHistory = await this.stateService.fetchWorkflowChangeHistory(workspaceSlug, projectId, props);
      runInAction(() => {
        update(this.workflowChangeHistoryMap, projectId, (currentWorkflowChangeHistory) => {
          if (!currentWorkflowChangeHistory) return workflowChangeHistory;
          return this.mergeWorkflowChangeHistory(currentWorkflowChangeHistory, workflowChangeHistory);
        });
      });
    } catch (e) {
      console.log("error while fetching workflow change history", e);
    } finally {
      set(this.workflowChangeHistoryLoader, projectId, "loaded");
    }
  };

  /**
   * Toggle Work item Creation for a state
   * @param workspaceSlug
   * @param stateId
   */
  toggleAllowWorkItemCreationLogic = async (workspaceSlug: string, stateId: string) => {
    const isCurrentWorkItemCreationAllowedForState = this.getIsWorkItemCreationAllowedForState(stateId);
    try {
      runInAction(() => {
        set(this.stateWorkItemCreationAllowedMap, [stateId], !isCurrentWorkItemCreationAllowedForState);
      });
      await this.stateService.updateWorkflowState(workspaceSlug, stateId, {
        allow_issue_creation: !isCurrentWorkItemCreationAllowedForState,
      });
    } catch {
      runInAction(() => {
        set(this.stateWorkItemCreationAllowedMap, [stateId], isCurrentWorkItemCreationAllowedForState);
      });
    }
  };

  /**
   * Create state transition
   * @param workspaceSlug
   * @param projectId
   * @param parentStateId
   * @param transitionStateId
   * @param memberIds
   */
  addStateTransition = async (
    workspaceSlug: string,
    projectId: string,
    parentStateId: string,
    transitionStateId?: string,
    memberIds: string[] = []
  ) => {
    try {
      const availableTransitionId =
        transitionStateId ?? this.getNextAvailableTransitionStateId(projectId, parentStateId);

      if (!availableTransitionId) throw new Error("state transitionId not available");

      const transitionId = await this.stateService.createStateTransition(
        workspaceSlug,
        projectId,
        parentStateId,
        availableTransitionId
      );

      runInAction(() => {
        set(this.stateTransitionMap, [parentStateId, transitionId], {
          transition_state_id: availableTransitionId,
          approvers: memberIds,
        });
      });
    } catch (e) {
      console.log("error while adding state transitions", e);
      throw e;
    }
  };

  /**
   * Delete state transition
   * @param workspaceSlug
   * @param projectId
   * @param parentStateId
   * @param transitionId
   */
  removeStateTransition = async (
    workspaceSlug: string,
    projectId: string,
    parentStateId: string,
    transitionId: string
  ) => {
    try {
      await this.stateService.deleteStateTransition(workspaceSlug, projectId, transitionId);

      runInAction(() => {
        if (this.stateTransitionMap[parentStateId][transitionId]) {
          delete this.stateTransitionMap[parentStateId][transitionId];
        }
      });
    } catch (e) {
      console.log("error while deleting state transitions", e);
      throw e;
    }
  };

  /**
   * Modify Member permissions for a state transition
   * @param workspaceSlug
   * @param projectId
   * @param parentStateId
   * @param transitionId
   * @param actorIds
   */
  modifyStateTransitionMemberPermission = async (
    workspaceSlug: string,
    projectId: string,
    parentStateId: string,
    transitionId: string,
    actorIds: string[]
  ) => {
    const prevActorIds = get(this.stateTransitionMap, [parentStateId, transitionId, "approvers"]);
    try {
      runInAction(() => {
        if (this.stateTransitionMap[parentStateId][transitionId]) {
          set(this.stateTransitionMap, [parentStateId, transitionId, "approvers"], actorIds);
        }
      });

      await this.stateService.updateStateTransitionApprovers(workspaceSlug, projectId, transitionId, actorIds);
    } catch (e) {
      console.log("error while modifying state transition permissions", e);
      runInAction(() => {
        if (this.stateTransitionMap[parentStateId][transitionId]) {
          set(this.stateTransitionMap, [parentStateId, transitionId, "approvers"], prevActorIds);
        }
      });
      throw e;
    }
  };

  /**
   * Change transition state of the state
   * @param workspaceSlug
   * @param projectId
   * @param parentStateId
   * @param transitionId
   * @param stateId
   */
  changeStateTransition = async (
    workspaceSlug: string,
    projectId: string,
    parentStateId: string,
    transitionId: string,
    stateId: string
  ) => {
    const prevTransitionStateId = get(this.stateTransitionMap, [parentStateId, transitionId, "transition_state_id"]);
    try {
      runInAction(() => {
        if (this.stateTransitionMap[parentStateId][transitionId]) {
          set(this.stateTransitionMap, [parentStateId, transitionId, "transition_state_id"], stateId);
        }
      });

      await this.stateService.updateStateTransitionState(workspaceSlug, projectId, transitionId, stateId);
    } catch (e) {
      console.log("error while modifying state Id of transition", e);
      runInAction(() => {
        if (this.stateTransitionMap[parentStateId][transitionId]) {
          set(this.stateTransitionMap, [parentStateId, transitionId, "transition_state_id"], prevTransitionStateId);
        }
      });
      throw e;
    }
  };

  /**
   * Reset workflow states
   * @param workspaceSlug
   * @param projectId
   */
  resetWorkflowStates = async (workspaceSlug: string, projectId: string) => {
    try {
      await this.stateService.resetWorkflowStates(workspaceSlug, projectId).then(() => {
        // Reset the state transition map and work item creation allowed map for the project states
        runInAction(() => {
          this.projectStates?.forEach((projectState) => {
            this.stateTransitionMap[projectState.id] = {};
            this.stateWorkItemCreationAllowedMap[projectState.id] = true;
          });
        });
      });
    } catch (e) {
      console.log("error while resetting workflow states", e);
    }
  };
}
