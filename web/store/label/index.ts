import { computed, observable, makeObservable } from "mobx";
import { RootStore } from "../root.store";
// types
import { IIssueLabel } from "types";
import { IProjectLabelStore, ProjectLabelStore } from "./project-label.store";
import { IWorkspaceLabelStore, WorkspaceLabelStore } from "./workspace-label.store";

export interface ILabelRootStore {
  // observables
  labelMap: Record<string, IIssueLabel>;
  // computed actions
  getLabelById: (labelId: string) => IIssueLabel | null;
  // sub-stores
  project: IProjectLabelStore;
  workspace: IWorkspaceLabelStore;
}

export class LabelRootStore implements ILabelRootStore {
  // observables
  labelMap: Record<string, IIssueLabel> = {};
  // root store
  rootStore;
  // sub-stores
  project: IProjectLabelStore;
  workspace: IWorkspaceLabelStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      labelMap: observable,
      // computed actions
      getLabelById: computed,
    });

    // root store
    this.rootStore = _rootStore;
    // sub-stores
    this.project = new ProjectLabelStore(_rootStore);
    this.workspace = new WorkspaceLabelStore(_rootStore);
  }

  /**
   * get label info from the map of labels in the store using label id
   * @param labelId
   */
  getLabelById = (labelId: string): IIssueLabel | null => this.labelMap?.[labelId] || null;
}
