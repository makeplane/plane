import { unset, set } from "lodash-es";
import { action, makeObservable, runInAction } from "mobx";
// types
import {
  IEstimate as IEstimateType,
  IEstimatePoint as IEstimatePointType,
  IEstimateFormData,
  TEstimatePointsObject,
} from "@plane/types";
// plane web store
import { IEstimate as ICeEstimate, Estimate as CeEstimate } from "@/ce/store/estimates/estimate";
// plane web service
import estimateService from "@/plane-web/services/project/estimate.service";
// store
import { EstimatePoint } from "@/store/estimates/estimate-point";
import type { CoreRootStore } from "@/store/root.store";

export interface IEstimate extends ICeEstimate {
  // actions
  updateEstimateSortOrder: (
    workspaceSlug: string,
    projectId: string,
    payload: TEstimatePointsObject[]
  ) => Promise<IEstimateType | undefined>;
  updateEstimateSwitch: (
    workspaceSlug: string,
    projectId: string,
    payload: IEstimateFormData
  ) => Promise<IEstimateType | undefined>;
  deleteEstimatePoint: (
    workspaceSlug: string,
    projectId: string,
    estimatePointId: string,
    newEstimatePointId: string | undefined
  ) => Promise<IEstimatePointType[] | undefined>;
}

export class Estimate extends CeEstimate implements IEstimate {
  constructor(
    public store: CoreRootStore,
    public data: IEstimateType
  ) {
    super(store, data);
    makeObservable(this, {
      // actions
      updateEstimateSortOrder: action,
      updateEstimateSwitch: action,
      deleteEstimatePoint: action,
    });
  }

  // actions
  /**
   * @description update an estimate sort order
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @param { TEstimatePointsObject[] } payload
   * @returns { IEstimateType | undefined }
   */
  updateEstimateSortOrder = async (
    workspaceSlug: string,
    projectId: string,
    payload: TEstimatePointsObject[]
  ): Promise<IEstimateType | undefined> => {
    if (!this.id || !payload) return;

    const estimate = await estimateService.updateEstimate(workspaceSlug, projectId, this.id, {
      estimate_points: payload,
    });
    runInAction(() => {
      if (estimate?.points) {
        estimate?.points.map((estimatePoint) => {
          if (estimatePoint.id)
            set(this.estimatePoints, [estimatePoint.id], new EstimatePoint(this.store, this.data, estimatePoint));
        });
      }
    });

    return estimate;
  };

  /**
   * @description update an estimate sort order
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @param { IEstimateFormData} payload
   * @returns { IEstimateType | undefined }
   */
  updateEstimateSwitch = async (
    workspaceSlug: string,
    projectId: string,
    payload: IEstimateFormData
  ): Promise<IEstimateType | undefined> => {
    if (!this.id || !payload) return;

    const estimate = await estimateService.updateEstimate(workspaceSlug, projectId, this.id, payload);
    if (estimate) {
      runInAction(() => {
        this.name = estimate?.name;
        this.type = estimate?.type;
        if (estimate?.points) {
          estimate?.points.map((estimatePoint) => {
            if (estimatePoint.id)
              this.estimatePoints?.[estimatePoint.id]?.updateEstimatePointObject({
                key: estimatePoint.key,
                value: estimatePoint.value,
              });
          });
        }
      });
    }

    return estimate;
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
  ): Promise<IEstimatePointType[] | undefined> => {
    if (!this.id) return;

    const deleteEstimatePoint = await estimateService.removeEstimatePoint(
      workspaceSlug,
      projectId,
      this.id,
      estimatePointId,
      newEstimatePointId ? { new_estimate_id: newEstimatePointId } : undefined
    );

    const currentIssues = Object.values(this.store.issue.issues.issuesMap || {});
    if (currentIssues) {
      currentIssues.map((issue) => {
        if (issue.estimate_point === estimatePointId) {
          this.store.issue.issues.updateIssue(issue.id, { estimate_point: newEstimatePointId });
        }
      });
    }

    runInAction(() => {
      unset(this.estimatePoints, [estimatePointId]);
    });
    if (deleteEstimatePoint) {
      runInAction(() => {
        deleteEstimatePoint.map((estimatePoint) => {
          if (estimatePoint.id)
            set(this.estimatePoints, [estimatePoint.id], new EstimatePoint(this.store, this.data, estimatePoint));
        });
      });
    }

    return deleteEstimatePoint;
  };
}
