/* eslint-disable no-useless-catch */

import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// plane web services
import projectStateService from "@/plane-web/services/workspace-project-states.service";
// store
import { RootStore } from "@/plane-web/store/root.store";
// types
import { TProjectState, TProjectStateGroupKey } from "@/plane-web/types/workspace-project-states";

export interface IProjectState extends TProjectState {
  // constants
  // observables
  // computed
  asJson: TProjectState;
  // computed methods
  // helpers actions
  mutateProjectState: (projectState: Partial<TProjectState>) => void;
  // actions
  updateProjectState: (workspaceSlug: string, payload: Partial<TProjectState>) => Promise<TProjectState | undefined>;
}

export class ProjectState implements IProjectState {
  // constants
  // observables
  id: string | undefined = undefined;
  name: string | undefined = undefined;
  description: string | undefined = undefined;
  color: string | undefined = undefined;
  sequence: number | undefined = undefined;
  group: TProjectStateGroupKey | undefined = undefined;
  default: boolean | undefined = undefined;
  external_source: string | undefined = undefined;
  external_id: string | undefined = undefined;
  workspace_id: string | undefined = undefined;
  created_by: string | undefined = undefined;
  updated_by: string | undefined = undefined;
  created_at: string | undefined = undefined;
  updated_at: string | undefined = undefined;

  constructor(
    public store: RootStore,
    public projectState: TProjectState
  ) {
    makeObservable(this, {
      // observables
      id: observable.ref,
      name: observable.ref,
      description: observable.ref,
      color: observable.ref,
      sequence: observable.ref,
      group: observable.ref,
      default: observable.ref,
      external_source: observable.ref,
      external_id: observable.ref,
      workspace_id: observable.ref,
      created_by: observable.ref,
      updated_by: observable.ref,
      created_at: observable.ref,
      updated_at: observable.ref,
      // computed
      asJson: computed,
      // actions
      updateProjectState: action,
    });

    this.id = projectState.id;
    this.name = projectState.name;
    this.description = projectState.description;
    this.color = projectState.color;
    this.sequence = projectState.sequence;
    this.group = projectState.group;
    this.default = projectState.default;
    this.external_source = projectState.external_source;
    this.external_id = projectState.external_id;
    this.workspace_id = projectState.workspace_id;
    this.created_by = projectState.created_by;
    this.updated_by = projectState.updated_by;
    this.created_at = projectState.created_at;
    this.updated_at = projectState.updated_at;
  }

  // computed
  get asJson() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      color: this.color,
      sequence: this.sequence,
      group: this.group,
      default: this.default,
      external_source: this.external_source,
      external_id: this.external_id,
      workspace_id: this.workspace_id,
      created_by: this.created_by,
      updated_by: this.updated_by,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  // computed methods

  // helpers actions
  /**
   * @description mutate project state
   * @param { Partial<TProjectState> } projectState
   */
  mutateProjectState = (projectState: Partial<TProjectState>) => {
    runInAction(() => {
      Object.entries(projectState).forEach(([key, value]) => {
        if (key in this) {
          set(this, key, value);
        }
      });
    });
  };

  // actions
  /**
   * @description update project state
   * @param { Partial<TProjectState> } payload
   * @returns { TProjectState | undefined }
   */
  updateProjectState = async (
    workspaceSlug: string,
    payload: Partial<TProjectState>
  ): Promise<TProjectState | undefined> => {
    if (!workspaceSlug || !this.id) return undefined;
    const projectState = this.asJson;

    try {
      runInAction(() => {
        this.mutateProjectState(payload);
      });
      const projectStateResponse = await projectStateService.updateProjectState(workspaceSlug, this.id, payload);

      return projectStateResponse;
    } catch (error) {
      console.error("project state -> updateProjectState -> error", error);
      runInAction(() => {
        this.mutateProjectState(projectState);
      });
      throw error;
    }
  };
}
