import { observable, makeObservable, action } from "mobx";
import { RootStore } from "../root.store";
// types
import { IIssueLabel } from "@plane/types";
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
  // sub-stores
  project: IProjectLabelStore;
  workspace: IWorkspaceLabelStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      labelMap: observable,
      // computed actions
      getLabelById: action,
    });
    // sub-stores
    this.project = new ProjectLabelStore(this, _rootStore);
    this.workspace = new WorkspaceLabelStore(this, _rootStore);
  }

  /**
   * get label info from the map of labels in the store using label id
   * @param labelId
   */
  getLabelById = (labelId: string): IIssueLabel | null => this.labelMap?.[labelId] || null;
}
