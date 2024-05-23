import { action, computed, makeObservable, observable } from "mobx";
import { IEstimatePoint as IEstimatePointType } from "@plane/types";
// services
import { EstimateService } from "@/services/project/estimate.service";
// store
import { RootStore } from "@/store/root.store";

type TErrorCodes = {
  status: string;
  message?: string;
};

export interface IEstimatePoint extends IEstimatePointType {
  // observables
  error: TErrorCodes | undefined;
  // computed
  asJson: IEstimatePointType;
  // actions
  updateEstimatePoint: () => Promise<void>;
  deleteEstimatePoint: () => Promise<void>;
}

export class EstimatePoint implements IEstimatePoint {
  // data model observables
  id: string | undefined = undefined;
  key: number | undefined = undefined;
  value: string | undefined = undefined;
  description: string | undefined = undefined;
  workspace: string | undefined = undefined;
  project: string | undefined = undefined;
  estimate: string | undefined = undefined;
  created_at: Date | undefined = undefined;
  updated_at: Date | undefined = undefined;
  created_by: string | undefined = undefined;
  updated_by: string | undefined = undefined;
  // observables
  error: TErrorCodes | undefined = undefined;
  // service
  service: EstimateService;

  constructor(
    private store: RootStore,
    private data: IEstimatePointType
  ) {
    makeObservable(this, {
      // data model observables
      id: observable.ref,
      key: observable.ref,
      value: observable.ref,
      description: observable.ref,
      workspace: observable.ref,
      project: observable.ref,
      estimate: observable.ref,
      created_at: observable.ref,
      updated_at: observable.ref,
      created_by: observable.ref,
      updated_by: observable.ref,
      // observables
      error: observable.ref,
      // computed
      asJson: computed,
      // actions
      updateEstimatePoint: action,
      deleteEstimatePoint: action,
    });
    this.id = this.data.id;
    this.key = this.data.key;
    this.value = this.data.value;
    this.description = this.data.description;
    this.workspace = this.data.workspace;
    this.project = this.data.project;
    this.estimate = this.data.estimate;
    this.created_at = this.data.created_at;
    this.updated_at = this.data.updated_at;
    this.created_by = this.data.created_by;
    this.updated_by = this.data.updated_by;

    // service
    this.service = new EstimateService();
  }

  // computed
  get asJson() {
    return {
      id: this.id,
      key: this.key,
      value: this.value,
      description: this.description,
      workspace: this.workspace,
      project: this.project,
      estimate: this.estimate,
      created_at: this.created_at,
      updated_at: this.updated_at,
      created_by: this.created_by,
      updated_by: this.updated_by,
    };
  }

  // actions
  updateEstimatePoint = async () => {
    try {
      const { workspaceSlug, projectId } = this.store.router;
      if (!workspaceSlug || !projectId || !this.id) return undefined;
    } catch (error) {
      throw error;
    }
  };

  deleteEstimatePoint = async () => {
    try {
      const { workspaceSlug, projectId } = this.store.router;
      if (!workspaceSlug || !projectId || !this.id) return;
    } catch (error) {
      throw error;
    }
  };
}
