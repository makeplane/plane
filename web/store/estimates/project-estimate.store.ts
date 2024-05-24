import set from "lodash/set";
import update from "lodash/update";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { IEstimate as IEstimateType, IEstimateFormData } from "@plane/types";
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
  currentActiveEstimateId: string | undefined;
  archivedEstimateIds: string[] | undefined;
  areEstimateEnabledByProjectId: (projectId: string) => boolean;
  estimateIdsByProjectId: (projectId: string) => string[] | undefined;
  estimateById: (estimateId: string) => IEstimate | undefined;
  // actions
  getWorkspaceEstimates: (workspaceSlug: string, loader?: TEstimateLoader) => Promise<IEstimateType[] | undefined>;
  getProjectEstimates: (
    workspaceSlug: string,
    projectId: string,
    loader?: TEstimateLoader
  ) => Promise<IEstimateType[] | undefined>;
  getEstimateById: (workspaceSlug: string, projectId: string, estimateId: string) => Promise<IEstimateType | undefined>;
  createEstimate: (
    workspaceSlug: string,
    projectId: string,
    data: IEstimateFormData
  ) => Promise<IEstimateType | undefined>;
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
      currentActiveEstimateId: computed,
      archivedEstimateIds: computed,
      projectEstimateIds: computed,
      // actions
      getWorkspaceEstimates: action,
      getProjectEstimates: action,
      getEstimateById: action,
      createEstimate: action,
    });
    // service
    this.service = new EstimateService();
  }

  // computed

  /**
   * @description get current active estimate id for a project
   * @returns { string | undefined }
   */
  get currentActiveEstimateId(): string | undefined {
    const { projectId } = this.store.router;
    if (!projectId) return undefined;
    const projectDetails = this.store.projectRoot.project.getProjectById(projectId);
    if (!projectDetails) return undefined;
    return projectDetails.estimate ?? undefined;
  }

  /**
   * @description get all archived estimate ids for a project
   * @returns { string[] | undefined }
   */
  get archivedEstimateIds(): string[] | undefined {
    const { projectId } = this.store.router;
    if (!projectId) return undefined;
    const archivedEstimateIds = Object.values(this.estimates || {})
      .filter((p) => p.project === projectId && p.id !== this.currentActiveEstimateId)
      .map((p) => p.id) as string[];
    return archivedEstimateIds ?? undefined;
  }

  /**
   * @description get all estimate ids for a project
   * @returns { string[] | undefined }
   */
  get projectEstimateIds(): string[] | undefined {
    const { projectId } = this.store.router;
    if (!projectId) return undefined;
    const projectEstimatesIds = Object.values(this.estimates || {})
      .filter((p) => p.project === projectId)
      .map((p) => p.id) as string[];
    return projectEstimatesIds ?? undefined;
  }

  /**
   * @description get estimates are enabled in the project or not
   * @returns { boolean }
   */
  areEstimateEnabledByProjectId = computedFn((projectId: string) => {
    if (!projectId) return false;
    const projectDetails = this.store.projectRoot.project.getProjectById(projectId);
    if (!projectDetails) return false;
    return Boolean(projectDetails.estimate) || false;
  });

  /**
   * @description get all estimate ids for a project
   * @returns { string[] | undefined }
   */
  estimateIdsByProjectId = computedFn((projectId: string) => {
    if (!projectId) return undefined;
    const projectEstimatesIds = Object.values(this.estimates || {})
      .filter((p) => p.project === projectId)
      .map((p) => p.id) as string[];
    return projectEstimatesIds ?? undefined;
  });

  /**
   * @description get estimate by id
   * @returns { IEstimate | undefined }
   */
  estimateById = computedFn((estimateId: string) => {
    if (!estimateId) return undefined;
    return this.estimates[estimateId] ?? undefined;
  });

  // actions
  /**
   * @description fetch all estimates for a workspace
   * @returns { IEstimateType[] | undefined }
   */
  getWorkspaceEstimates = async (
    workspaceSlug: string,
    loader: TEstimateLoader = "mutation-loader"
  ): Promise<IEstimateType[] | undefined> => {
    try {
      this.error = undefined;
      if (!this.projectEstimateIds) this.loader = loader ? loader : "init-loader";

      const estimates = await this.service.fetchWorkspaceEstimates(workspaceSlug);
      if (estimates && estimates.length > 0) {
        runInAction(() => {
          estimates.forEach((estimate) => {
            if (estimate.id) set(this.estimates, [estimate.id], new Estimate(this.store, estimate));
          });
        });
      }

      return estimates;
    } catch (error) {
      this.loader = undefined;
      this.error = {
        status: "error",
        message: "Error fetching estimates",
      };
    }
  };

  /**
   * @description fetch all estimates for a project
   * @returns { IEstimateType[] | undefined }
   */
  getProjectEstimates = async (
    workspaceSlug: string,
    projectId: string,
    loader: TEstimateLoader = "mutation-loader"
  ): Promise<IEstimateType[] | undefined> => {
    try {
      this.error = undefined;
      if (!this.projectEstimateIds) this.loader = loader ? loader : "init-loader";

      const estimates = await this.service.fetchProjectEstimates(workspaceSlug, projectId);
      if (estimates && estimates.length > 0) {
        runInAction(() => {
          estimates.forEach((estimate) => {
            if (estimate.id) set(this.estimates, [estimate.id], new Estimate(this.store, estimate));
          });
        });
      }

      return estimates;
    } catch (error) {
      this.loader = undefined;
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
  getEstimateById = async (
    workspaceSlug: string,
    projectId: string,
    estimateId: string
  ): Promise<IEstimateType | undefined> => {
    try {
      this.error = undefined;

      const estimate = await this.service.fetchEstimateById(workspaceSlug, projectId, estimateId);
      if (estimate) {
        runInAction(() => {
          if (estimate.id)
            update(this.estimates, [estimate.id], (estimateStore) => {
              if (estimateStore) estimateStore.updateEstimate(estimate);
              else return new Estimate(this.store, estimate);
            });
        });
      }

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
   * @param { Partial<IEstimateType> } payload
   * @returns
   */
  createEstimate = async (
    workspaceSlug: string,
    projectId: string,
    payload: IEstimateFormData
  ): Promise<IEstimateType | undefined> => {
    try {
      this.error = undefined;

      const estimate = await this.service.createEstimate(workspaceSlug, projectId, payload);
      // FIXME: i am getting different response from the server and once backend changes remove the get request and uncomment the commented code
      const estimates = await this.getProjectEstimates(workspaceSlug, projectId, "mutation-loader");
      if (estimates && estimates.length > 0)
        await this.store.projectRoot.project.updateProject(workspaceSlug, projectId, {
          estimate: estimates[estimates.length - 1].id,
        });
      // if (estimate) {
      //   await this.store.projectRoot.project.updateProject(workspaceSlug, projectId, {
      //     estimate: estimate.id,
      //   });
      //   runInAction(() => {
      //     if (estimate.id) set(this.estimates, [estimate.id], new Estimate(this.store, estimate));
      //   });
      // }

      return estimate;
    } catch (error) {
      this.error = {
        status: "error",
        message: "Error creating estimate",
      };
    }
  };
}
