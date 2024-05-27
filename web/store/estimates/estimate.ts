import set from "lodash/set";
import unset from "lodash/unset";
import update from "lodash/update";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import {
  IEstimate as IEstimateType,
  IEstimatePoint as IEstimatePointType,
  IProject,
  IWorkspace,
  TEstimateSystemKeys,
  IEstimateFormData,
} from "@plane/types";
// services
import { EstimateService } from "@/services/project/estimate.service";
// store
import { IEstimatePoint, EstimatePoint } from "@/store/estimates/estimate-point";
import { RootStore } from "@/store/root.store";

type TErrorCodes = {
  status: string;
  message?: string;
};

export interface IEstimate extends IEstimateType {
  // observables
  error: TErrorCodes | undefined;
  estimatePoints: Record<string, IEstimatePoint>;
  // computed
  asJson: IEstimateType;
  estimatePointIds: string[] | undefined;
  estimatePointById: (estimateId: string) => IEstimatePointType | undefined;
  // actions
  updateEstimate: (payload: IEstimateFormData) => Promise<void>;
  deleteEstimate: (estimatePointId: string | undefined) => Promise<void>;
}

export class Estimate implements IEstimate {
  // data model observables
  id: string | undefined = undefined;
  name: string | undefined = undefined;
  description: string | undefined = undefined;
  type: TEstimateSystemKeys | undefined = undefined;
  points: IEstimatePointType[] | undefined = undefined;
  workspace: string | undefined = undefined;
  workspace_detail: IWorkspace | undefined = undefined;
  project: string | undefined = undefined;
  project_detail: IProject | undefined = undefined;
  created_at: Date | undefined = undefined;
  updated_at: Date | undefined = undefined;
  created_by: string | undefined = undefined;
  updated_by: string | undefined = undefined;
  // observables
  error: TErrorCodes | undefined = undefined;
  estimatePoints: Record<string, IEstimatePoint> = {};
  // service
  service: EstimateService;

  constructor(
    private store: RootStore,
    private data: IEstimateType
  ) {
    makeObservable(this, {
      // data model observables
      id: observable.ref,
      name: observable.ref,
      description: observable.ref,
      type: observable.ref,
      points: observable,
      workspace: observable.ref,
      workspace_detail: observable,
      project: observable.ref,
      project_detail: observable,
      created_at: observable.ref,
      updated_at: observable.ref,
      created_by: observable.ref,
      updated_by: observable.ref,
      // observables
      error: observable.ref,
      estimatePoints: observable,
      // computed
      asJson: computed,
      estimatePointIds: computed,
      // actions
      updateEstimate: action,
      deleteEstimate: action,
    });
    this.id = this.data.id;
    this.name = this.data.name;
    this.description = this.data.description;
    this.type = this.data.type;
    this.points = this.data.points;
    this.workspace = this.data.workspace;
    this.workspace_detail = this.data.workspace_detail;
    this.project = this.data.project;
    this.project_detail = this.data.project_detail;
    this.created_at = this.data.created_at;
    this.updated_at = this.data.updated_at;
    this.created_by = this.data.created_by;
    this.updated_by = this.data.updated_by;

    this.data.points?.forEach((estimationPoint) => {
      if (estimationPoint.id)
        set(this.estimatePoints, [estimationPoint.id], new EstimatePoint(this.store, this.data, estimationPoint));
    });
    // service
    this.service = new EstimateService();
  }

  // computed
  get asJson() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      points: this.points,
      workspace: this.workspace,
      workspace_detail: this.workspace_detail,
      project: this.project,
      project_detail: this.project_detail,
      created_at: this.created_at,
      updated_at: this.updated_at,
      created_by: this.created_by,
      updated_by: this.updated_by,
    };
  }

  get estimatePointIds() {
    const { estimatePoints } = this;
    if (!estimatePoints) return undefined;

    const estimatePointIds = Object.values(estimatePoints)
      .map((point) => point.estimate && this.id)
      .filter((id) => id) as string[];

    return estimatePointIds ?? undefined;
  }

  estimatePointById = computedFn((estimatePointId: string) => {
    if (!estimatePointId) return undefined;
    return this.estimatePoints[estimatePointId] ?? undefined;
  });

  // actions
  updateEstimate = async (payload: IEstimateFormData) => {
    try {
      const { workspaceSlug, projectId } = this.store.router;
      if (!workspaceSlug || !projectId || !this.id || !payload) return;

      await this.service.updateEstimate(workspaceSlug, projectId, this.id, payload);

      // runInAction(() => {
      //   this.points = payload.estimate_points;
      //   this.data.points = payload.estimate_points;
      // });
    } catch (error) {
      throw error;
    }
  };

  deleteEstimate = async (estimatePointId: string | undefined) => {
    try {
      const { workspaceSlug, projectId } = this.store.router;
      if (!workspaceSlug || !projectId || !estimatePointId) return;

      // make delete estimation request

      runInAction(() => {
        update(this, "points", (estimationPoints = []) =>
          estimationPoints.filter((point: IEstimatePointType) => point.id !== estimatePointId)
        );
        unset(this.estimatePoints, [estimatePointId]);
      });
    } catch (error) {
      throw error;
    }
  };
}
