import set from "lodash/set";
import unset from "lodash/unset";
import update from "lodash/update";
import { action, computed, makeObservable, observable } from "mobx";
import { computedFn } from "mobx-utils";
import { IEstimate as IEstimateType } from "@plane/types";
// services
import { EstimateService } from "@/services/project/estimate.service";
// store
import { IEstimate, Estimate } from "@/store/estimates/estimate";
import { RootStore } from "@/store/root.store";

type TEstimateLoader = "init-loader" | "mutation-loader" | undefined;
type TErrorCodes = {
  status: string;
  message?: string;
};

export interface IProjectEstimateStore {
  // observables
  loader: TEstimateLoader;
  estimates: Record<string, IEstimate>;
  error: TErrorCodes | undefined;
  // computed
  projectEstimateIds: string[] | undefined;
  estimateById: (estimateId: string) => IEstimate | undefined;
  // actions
  getWorkspaceAllEstimates: () => Promise<IEstimateType[] | undefined>;
  getAllEstimates: () => Promise<IEstimateType[] | undefined>;
  getEstimateById: (estimateId: string) => Promise<IEstimateType | undefined>;
  createEstimate: (data: Partial<IEstimateType>) => Promise<IEstimateType | undefined>;
  deleteEstimate: (estimateId: string) => Promise<void>;
}

export class ProjectEstimateStore implements IProjectEstimateStore {
  // observables
  loader: TEstimateLoader = undefined;
  estimates: Record<string, IEstimate> = {}; // estimate_id -> estimate
  error: TErrorCodes | undefined = undefined;
  // service
  service: EstimateService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      estimates: observable,
      error: observable,
      // computed
      projectEstimateIds: computed,
      // actions
      getWorkspaceAllEstimates: action,
      getAllEstimates: action,
      getEstimateById: action,
      createEstimate: action,
      deleteEstimate: action,
    });
    // service
    this.service = new EstimateService();
  }

  // computed
  get projectEstimateIds() {
    const { projectId } = this.store.router;
    if (!projectId) return undefined;

    const projectEstimatesIds = Object.values(this.estimates || {})
      .filter((p) => p.project === projectId)
      .map((p) => p.id && p != undefined) as string[];

    return projectEstimatesIds ?? undefined;
  }

  estimateById = computedFn((estimateId: string) => {
    if (!estimateId) return undefined;
    return this.estimates[estimateId] ?? undefined;
  });

  // actions
  /**
   * @description fetch all estimates for a project
   * @returns { IEstimateType[] | undefined }
   */
  getWorkspaceAllEstimates = async (): Promise<IEstimateType[] | undefined> => {
    try {
      const { workspaceSlug } = this.store.router;
      if (!workspaceSlug) return;

      this.error = undefined;
      const estimates = await this.service.fetchWorkspacesList(workspaceSlug);

      if (estimates && estimates.length > 0)
        estimates.forEach((estimate) => {
          if (estimate.id) set(this.estimates, [estimate.id], new Estimate(this.store, estimate));
        });

      return estimates;
    } catch (error) {
      this.error = {
        status: "error",
        message: "Error fetching estimates",
      };
    }
  };

  getAllEstimates = async (): Promise<IEstimateType[] | undefined> => {
    try {
      const { workspaceSlug, projectId } = this.store.router;
      if (!workspaceSlug || !projectId) return;

      this.error = undefined;
      const estimates = await this.service.fetchAll(workspaceSlug, projectId);

      if (estimates && estimates.length > 0)
        estimates.forEach((estimate) => {
          if (estimate.id) set(this.estimates, [estimate.id], new Estimate(this.store, estimate));
        });

      return estimates;
    } catch (error) {
      this.error = {
        status: "error",
        message: "Error fetching estimates",
      };
    }
  };

  /**
   * @description update an estimate for a project
   * @param { string } estimateId
   * @returns IEstimateType | undefined
   */
  getEstimateById = async (estimateId: string): Promise<IEstimateType | undefined> => {
    try {
      const { workspaceSlug, projectId } = this.store.router;
      if (!workspaceSlug || !projectId) return;

      this.error = undefined;
      const estimate = await this.service.fetchById(workspaceSlug, projectId, estimateId);

      if (estimate && estimate.id)
        update(this.estimates, [estimate.id], (estimateStore) => {
          if (estimateStore) estimateStore.updateEstimate(estimate);
          else return new Estimate(this.store, estimate);
        });

      return estimate;
    } catch (error) {
      this.error = {
        status: "error",
        message: "Error fetching estimate by id",
      };
    }
  };

  /**
   * @description create an estimate for a project
   * @param { Partial<IEstimateType> } data
   * @returns
   */
  createEstimate = async (data: Partial<IEstimateType>): Promise<IEstimateType | undefined> => {
    try {
      const { workspaceSlug, projectId } = this.store.router;
      if (!workspaceSlug || !projectId) return;

      this.error = undefined;
      const estimate = await this.service.create(workspaceSlug, projectId, data);

      if (estimate && estimate.id) set(this.estimates, [estimate.id], new Estimate(this.store, estimate));

      return estimate;
    } catch (error) {
      console.error("Error creating estimate");
      this.error = {
        status: "error",
        message: "Error creating estimate",
      };
    }
  };

  /**
   * @description delete an estimate for a project
   * @param { string } estimateId
   * @returns void
   */
  deleteEstimate = async (estimateId: string): Promise<void> => {
    try {
      const { workspaceSlug, projectId } = this.store.router;
      if (!workspaceSlug || !projectId) return;

      this.error = undefined;
      await this.service.remove(workspaceSlug, projectId, estimateId);
      unset(this.estimates, [estimateId]);
    } catch (error) {
      console.error("Error deleting estimate");
      this.error = {
        status: "error",
        message: "Error deleting estimate",
      };
    }
  };
}
