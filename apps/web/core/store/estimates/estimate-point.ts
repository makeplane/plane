/* eslint-disable no-useless-catch */

import { set } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
// types
import type { IEstimate, IEstimatePoint as IEstimatePointType } from "@plane/types";
// plane web services
import estimateService from "@/plane-web/services/project/estimate.service";
// store
import type { CoreRootStore } from "@/store/root.store";

type TErrorCodes = {
  status: string;
  message?: string;
};

export interface IEstimatePoint extends IEstimatePointType {
  // observables
  error: TErrorCodes | undefined;
  // computed
  asJson: IEstimatePointType;
  // helper actions
  updateEstimatePointObject: (estimatePoint: Partial<IEstimatePointType>) => void;
  // actions
  updateEstimatePoint: (
    workspaceSlug: string,
    projectId: string,
    payload: Partial<IEstimatePointType>
  ) => Promise<IEstimatePointType | undefined>;
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

  constructor(
    private store: CoreRootStore,
    private projectEstimate: IEstimate,
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

  // helper actions
  /**
   * @description updating an estimate point object in local store
   * @param { Partial<IEstimatePointType> } estimatePoint
   * @returns { void }
   */
  updateEstimatePointObject = (estimatePoint: Partial<IEstimatePointType>) => {
    Object.keys(estimatePoint).map((key) => {
      const estimatePointKey = key as keyof IEstimatePointType;
      set(this, estimatePointKey, estimatePoint[estimatePointKey]);
    });
  };

  // actions
  /**
   * @description updating an estimate point
   * @param { Partial<IEstimatePointType> } payload
   * @returns { IEstimatePointType | undefined }
   */
  updateEstimatePoint = async (
    workspaceSlug: string,
    projectId: string,
    payload: Partial<IEstimatePointType>
  ): Promise<IEstimatePointType | undefined> => {
    try {
      if (!this.projectEstimate?.id || !this.id || !payload) return undefined;

      const estimatePoint = await estimateService.updateEstimatePoint(
        workspaceSlug,
        projectId,
        this.projectEstimate?.id,
        this.id,
        payload
      );
      if (estimatePoint) {
        runInAction(() => {
          Object.keys(payload).map((key) => {
            const estimatePointKey = key as keyof IEstimatePointType;
            set(this, estimatePointKey, estimatePoint[estimatePointKey]);
          });
        });
      }

      return estimatePoint;
    } catch (error) {
      throw error;
    }
  };
}
