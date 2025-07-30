import orderBy from "lodash/orderBy";
import set from "lodash/set";
import unset from "lodash/unset";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { IEstimate as IEstimateType, IEstimateFormData, TEstimateSystemKeys } from "@plane/types";
// plane web services
import estimateService from "@/plane-web/services/project/estimate.service";
// plane web store
import { IEstimate, Estimate } from "@/plane-web/store/estimates/estimate";
// store
import { CoreRootStore } from "../root.store";

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
  currentActiveEstimate: IEstimate | undefined;
  archivedEstimateIds: string[] | undefined;
  currentProjectEstimateType: TEstimateSystemKeys | undefined;
  areEstimateEnabledByProjectId: (projectId: string) => boolean;
  estimateIdsByProjectId: (projectId: string) => string[] | undefined;
  currentActiveEstimateIdByProjectId: (projectId: string) => string | undefined;
  estimateById: (estimateId: string) => IEstimate | undefined;
  // actions
  getWorkspaceEstimates: (workspaceSlug: string, loader?: TEstimateLoader) => Promise<IEstimateType[] | undefined>;
  getProjectEstimates: (
    workspaceSlug: string,
    projectId: string,
    loader?: TEstimateLoader
  ) => Promise<IEstimateType[] | undefined>;
  getEstimateById: (estimateId: string) => IEstimate | undefined;
  createEstimate: (
    workspaceSlug: string,
    projectId: string,
    data: IEstimateFormData
  ) => Promise<IEstimateType | undefined>;
  deleteEstimate: (workspaceSlug: string, projectId: string, estimateId: string) => Promise<void>;
}

export class ProjectEstimateStore implements IProjectEstimateStore {
  // observables
  loader: TEstimateLoader = undefined;
  estimates: Record<string, IEstimate> = {}; // estimate_id -> estimate
  error: TErrorCodes | undefined = undefined;

  constructor(private store: CoreRootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      estimates: observable,
      error: observable,
      // computed
      currentActiveEstimateId: computed,
      currentActiveEstimate: computed,
      archivedEstimateIds: computed,
      currentProjectEstimateType: computed,
      // actions
      getWorkspaceEstimates: action,
      getProjectEstimates: action,
      getEstimateById: action,
      createEstimate: action,
      deleteEstimate: action,
    });
  }

  // computed

  get currentProjectEstimateType(): TEstimateSystemKeys | undefined {
    return this.currentActiveEstimateId ? this.estimates[this.currentActiveEstimateId]?.type : undefined;
  }

  /**
   * @description get current active estimate id for a project
   * @returns { string | undefined }
   */
  get currentActiveEstimateId(): string | undefined {
    const { projectId } = this.store.router;
    if (!projectId) return undefined;
    const currentActiveEstimateId = Object.values(this.estimates || {}).find(
      (p) => p.project === projectId && p.last_used
    );
    return currentActiveEstimateId?.id ?? undefined;
  }

  // computed
  /**
   * @description get current active estimate for a project
   * @returns { string | undefined }
   */
  get currentActiveEstimate(): IEstimate | undefined {
    const { projectId } = this.store.router;
    if (!projectId) return undefined;
    const currentActiveEstimate = Object.values(this.estimates || {}).find(
      (p) => p.project === projectId && p.last_used
    );
    return currentActiveEstimate ?? undefined;
  }

  /**
   * @description get all archived estimate ids for a project
   * @returns { string[] | undefined }
   */
  get archivedEstimateIds(): string[] | undefined {
    const { projectId } = this.store.router;
    if (!projectId) return undefined;
    const archivedEstimates = orderBy(
      Object.values(this.estimates || {}).filter((p) => p.project === projectId && !p.last_used),
      ["created_at"],
      "desc"
    );
    const archivedEstimateIds = archivedEstimates.map((p) => p.id) as string[];
    return archivedEstimateIds ?? undefined;
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
   * @description get current active estimate id for a project
   * @returns { string | undefined }
   */
  currentActiveEstimateIdByProjectId = computedFn((projectId: string): string | undefined => {
    if (!projectId) return undefined;
    const currentActiveEstimateId = Object.values(this.estimates || {}).find(
      (p) => p.project === projectId && p.last_used
    );
    return currentActiveEstimateId?.id ?? undefined;
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
   * @param { string } workspaceSlug
   * @returns { IEstimateType[] | undefined }
   */
  getWorkspaceEstimates = async (
    workspaceSlug: string,
    loader: TEstimateLoader = "mutation-loader"
  ): Promise<IEstimateType[] | undefined> => {
    try {
      this.error = undefined;
      if (Object.keys(this.estimates || {}).length <= 0) this.loader = loader ? loader : "init-loader";

      const estimates = await estimateService.fetchWorkspaceEstimates(workspaceSlug);
      if (estimates && estimates.length > 0) {
        runInAction(() => {
          estimates.forEach((estimate) => {
            if (estimate.id)
              set(
                this.estimates,
                [estimate.id],
                new Estimate(this.store, { ...estimate, type: estimate.type?.toLowerCase() as TEstimateSystemKeys })
              );
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
      throw error;
    }
  };

  /**
   * @description fetch all estimates for a project
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @returns { IEstimateType[] | undefined }
   */
  getProjectEstimates = async (
    workspaceSlug: string,
    projectId: string,
    loader: TEstimateLoader = "mutation-loader"
  ): Promise<IEstimateType[] | undefined> => {
    try {
      this.error = undefined;
      if (!this.estimateIdsByProjectId(projectId)) this.loader = loader ? loader : "init-loader";

      const estimates = await estimateService.fetchProjectEstimates(workspaceSlug, projectId);
      if (estimates && estimates.length > 0) {
        runInAction(() => {
          estimates.forEach((estimate) => {
            if (estimate.id)
              set(
                this.estimates,
                [estimate.id],
                new Estimate(this.store, { ...estimate, type: estimate.type?.toLowerCase() as TEstimateSystemKeys })
              );
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
      throw error;
    }
  };

  /**
   * @param { string } estimateId
   * @returns IEstimateType | undefined
   */
  getEstimateById = (estimateId: string): IEstimate | undefined => this.estimates[estimateId];

  /**
   * @description create an estimate for a project
   * @param { string } workspaceSlug
   * @param { string } projectId
   * @param { Partial<IEstimateFormData> } payload
   * @returns
   */
  createEstimate = async (
    workspaceSlug: string,
    projectId: string,
    payload: IEstimateFormData
  ): Promise<IEstimateType | undefined> => {
    try {
      this.error = undefined;

      const estimate = await estimateService.createEstimate(workspaceSlug, projectId, payload);
      if (estimate) {
        // update estimate_id in current project
        // await this.store.projectRoot.project.updateProject(workspaceSlug, projectId, {
        //   estimate: estimate.id,
        // });
        runInAction(() => {
          if (estimate.id)
            set(
              this.estimates,
              [estimate.id],
              new Estimate(this.store, { ...estimate, type: estimate.type?.toLowerCase() as TEstimateSystemKeys })
            );
        });
      }

      return estimate;
    } catch (error) {
      this.error = {
        status: "error",
        message: "Error creating estimate",
      };
      throw error;
    }
  };

  /**
   * @description delete the estimate for a project
   * @param workspaceSlug
   * @param projectId
   * @param estimateId
   */
  deleteEstimate = async (workspaceSlug: string, projectId: string, estimateId: string) => {
    try {
      await estimateService.deleteEstimate(workspaceSlug, projectId, estimateId);
      runInAction(() => estimateId && unset(this.estimates, [estimateId]));
    } catch (error) {
      this.error = {
        status: "error",
        message: "Error deleting estimate",
      };
      throw error;
    }
  };
}
