import set from "lodash/set";
import unset from "lodash/unset";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import {
  IEstimate as IEstimateType,
  IEstimatePoint as IEstimatePointType,
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
  updateEstimate: (
    workspaceSlug: string,
    projectId: string,
    payload: Partial<IEstimateFormData>
  ) => Promise<IEstimateType | undefined>;
  creteEstimatePoint: (
    workspaceSlug: string,
    projectId: string,
    payload: Partial<IEstimatePointType>
  ) => Promise<IEstimatePointType | undefined>;
  deleteEstimatePoint: (
    workspaceSlug: string,
    projectId: string,
    estimatePointId: string,
    newEstimatePointId: string | undefined
  ) => Promise<void>;
}

export class Estimate implements IEstimate {
  // data model observables
  id: string | undefined = undefined;
  name: string | undefined = undefined;
  description: string | undefined = undefined;
  type: TEstimateSystemKeys | undefined = undefined;
  points: IEstimatePointType[] | undefined = undefined;
  workspace: string | undefined = undefined;
  project: string | undefined = undefined;
  last_used: boolean | undefined = undefined;
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
      project: observable.ref,
      last_used: observable.ref,
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
      creteEstimatePoint: action,
      deleteEstimatePoint: action,
    });
    this.id = this.data.id;
    this.name = this.data.name;
    this.description = this.data.description;
    this.type = this.data.type;
    this.points = this.data.points;
    this.workspace = this.data.workspace;
    this.project = this.data.project;
    this.last_used = this.data.last_used;
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
      project: this.project,
      last_used: this.last_used,
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
  /**
   * @description update an estimate
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @param { Partial<IEstimateFormData> } payload
   * @returns { IEstimateType | undefined }
   */
  updateEstimate = async (
    workspaceSlug: string,
    projectId: string,
    payload: Partial<IEstimateFormData>
  ): Promise<IEstimateType | undefined> => {
    try {
      if (!this.id || !payload) return;

      const estimate = await this.service.updateEstimate(workspaceSlug, projectId, this.id, payload);
      if (estimate) {
        runInAction(() => {
          Object.keys(payload).map((key) => {
            const estimateKey = key as keyof IEstimateType;
            set(this, estimateKey, estimate[estimateKey]);
          });
        });
      }

      return estimate;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description create an estimate point
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @param { Partial<IEstimatePointType> } payload
   * @returns { IEstimatePointType | undefined }
   */
  creteEstimatePoint = async (
    workspaceSlug: string,
    projectId: string,
    payload: Partial<IEstimatePointType>
  ): Promise<IEstimatePointType | undefined> => {
    try {
      if (!this.id || !payload) return;

      const estimatePoint = await this.service.createEstimatePoint(workspaceSlug, projectId, this.id, payload);
      if (estimatePoint) {
        runInAction(() => {
          if (estimatePoint.id) {
            set(this.estimatePoints, [estimatePoint.id], new EstimatePoint(this.store, this.data, estimatePoint));
          }
        });
      }
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description delete an estimate point
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @param { string } estimatePointId
   * @param { string | undefined } newEstimatePointId
   * @returns { void }
   */
  deleteEstimatePoint = async (
    workspaceSlug: string,
    projectId: string,
    estimatePointId: string,
    newEstimatePointId: string | undefined
  ) => {
    try {
      if (!this.id) return;

      const deleteEstimatePoint = await this.service.removeEstimatePoint(
        workspaceSlug,
        projectId,
        this.id,
        estimatePointId,
        newEstimatePointId ? { new_estimate_id: newEstimatePointId } : undefined
      );

      runInAction(() => {
        unset(this.estimatePoints, [estimatePointId]);
      });

      return deleteEstimatePoint;
    } catch (error) {
      throw error;
    }
  };
}
