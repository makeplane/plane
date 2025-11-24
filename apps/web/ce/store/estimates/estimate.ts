import { orderBy, set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import type {
  IEstimate as IEstimateType,
  IEstimatePoint as IEstimatePointType,
  TEstimateSystemKeys,
} from "@plane/types";
// plane web services
import estimateService from "@/plane-web/services/project/estimate.service";
// store
import type { IEstimatePoint } from "@/store/estimates/estimate-point";
import { EstimatePoint } from "@/store/estimates/estimate-point";
import type { CoreRootStore } from "@/store/root.store";

type TErrorCodes = {
  status: string;
  message?: string;
};

export interface IEstimate extends Omit<IEstimateType, "points"> {
  // observables
  error: TErrorCodes | undefined;
  estimatePoints: Record<string, IEstimatePoint>;
  // computed
  asJson: Omit<IEstimateType, "points">;
  estimatePointIds: string[] | undefined;
  estimatePointById: (estimatePointId: string) => IEstimatePointType | undefined;
  // actions
  creteEstimatePoint: (
    workspaceSlug: string,
    projectId: string,
    payload: Partial<IEstimatePointType>
  ) => Promise<IEstimatePointType | undefined>;
}

export class Estimate implements IEstimate {
  // data model observables
  id: string | undefined = undefined;
  name: string | undefined = undefined;
  description: string | undefined = undefined;
  type: TEstimateSystemKeys | undefined = undefined;
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

  constructor(
    public store: CoreRootStore,
    public data: IEstimateType
  ) {
    makeObservable(this, {
      // data model observables
      id: observable.ref,
      name: observable.ref,
      description: observable.ref,
      type: observable.ref,
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
      creteEstimatePoint: action,
    });
    this.id = this.data.id;
    this.name = this.data.name;
    this.description = this.data.description;
    this.type = this.data.type;
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
  }

  // computed
  get asJson() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
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
    let currentEstimatePoints = Object.values(estimatePoints).filter(
      (estimatePoint) => estimatePoint?.estimate === this.id
    );
    currentEstimatePoints = orderBy(currentEstimatePoints, ["key"], "asc");
    const estimatePointIds = currentEstimatePoints.map((estimatePoint) => estimatePoint.id) as string[];
    return estimatePointIds ?? undefined;
  }

  estimatePointById = computedFn((estimatePointId: string) => {
    if (!estimatePointId) return undefined;
    return this.estimatePoints[estimatePointId] ?? undefined;
  });

  // actions
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
    if (!this.id || !payload) return;

    const estimatePoint = await estimateService.createEstimatePoint(workspaceSlug, projectId, this.id, payload);
    if (estimatePoint) {
      runInAction(() => {
        if (estimatePoint.id) {
          set(this.estimatePoints, [estimatePoint.id], new EstimatePoint(this.store, this.data, estimatePoint));
        }
      });
    }
  };
}
