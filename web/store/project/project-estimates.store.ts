import { observable, action, makeObservable, runInAction, computed } from "mobx";
// types
import { RootStore } from "../root";
import { IEstimate, IEstimateFormData } from "types";
// services
import { ProjectService, ProjectEstimateService } from "services/project";

export interface IProjectEstimateStore {
  loader: boolean;
  error: any | null;

  // observables
  estimates: {
    [projectId: string]: IEstimate[] | null; // project_id: members
  } | null;

  // actions
  getProjectEstimateById: (estimateId: string) => IEstimate | null;
  fetchProjectEstimates: (workspaceSlug: string, projectId: string) => Promise<void>;
  createEstimate: (workspaceSlug: string, projectId: string, data: IEstimateFormData) => Promise<IEstimate>;
  updateEstimate: (
    workspaceSlug: string,
    projectId: string,
    estimateId: string,
    data: IEstimateFormData
  ) => Promise<IEstimate>;
  deleteEstimate: (workspaceSlug: string, projectId: string, estimateId: string) => Promise<void>;

  // computed
  projectEstimates: IEstimate[] | undefined;
}

export class ProjectEstimatesStore implements IProjectEstimateStore {
  loader: boolean = false;
  error: any | null = null;

  // observables
  estimates: {
    [projectId: string]: IEstimate[]; // projectId: estimates
  } | null = {};

  // root store
  rootStore;

  // service
  projectService;
  estimateService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable,
      error: observable,

      estimates: observable.ref,

      // actions
      getProjectEstimateById: action,
      fetchProjectEstimates: action,
      createEstimate: action,
      updateEstimate: action,
      deleteEstimate: action,

      // computed
      projectEstimates: computed,
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectService();
    this.estimateService = new ProjectEstimateService();
  }

  get projectEstimates() {
    const projectId = this.rootStore.project.projectId;

    if (!projectId) return undefined;
    return this.estimates?.[projectId] || undefined;
  }

  getProjectEstimateById = (estimateId: string) => {
    const estimates = this.projectEstimates;
    if (!estimates) return null;
    const estimateInfo: IEstimate | null = estimates.find((estimate) => estimate.id === estimateId) || null;
    return estimateInfo;
  };

  fetchProjectEstimates = async (workspaceSlug: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const estimatesResponse = await this.estimateService.getEstimatesList(workspaceSlug, projectId);
      const _estimates = {
        ...this.estimates,
        [projectId]: estimatesResponse,
      };

      runInAction(() => {
        this.estimates = _estimates;
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.error(error);
      this.loader = false;
      this.error = error;
    }
  };

  createEstimate = async (workspaceSlug: string, projectId: string, data: IEstimateFormData) => {
    try {
      const response = await this.estimateService.createEstimate(workspaceSlug, projectId, data);

      const responseEstimate = {
        ...response.estimate,
        points: response.estimate_points,
      };

      runInAction(() => {
        this.estimates = {
          ...this.estimates,
          [projectId]: [responseEstimate, ...(this.estimates?.[projectId] || [])],
        };
      });

      return response;
    } catch (error) {
      console.log("Failed to create estimate from project store");
      throw error;
    }
  };

  updateEstimate = async (workspaceSlug: string, projectId: string, estimateId: string, data: IEstimateFormData) => {
    const originalEstimates = this.getProjectEstimateById(estimateId);

    runInAction(() => {
      this.estimates = {
        ...this.estimates,
        [projectId]: (this.estimates?.[projectId] || [])?.map((estimate) =>
          estimate.id === estimateId ? { ...estimate, ...data.estimate } : estimate
        ),
      };
    });

    try {
      const response = await this.estimateService.patchEstimate(workspaceSlug, projectId, estimateId, data);
      await this.fetchProjectEstimates(workspaceSlug, projectId);

      return response;
    } catch (error) {
      console.log("Failed to update estimate from project store");
      runInAction(() => {
        this.estimates = {
          ...this.estimates,
          [projectId]: (this.estimates?.[projectId] || [])?.map((estimate) =>
            estimate.id === estimateId ? { ...estimate, ...originalEstimates } : estimate
          ),
        };
      });
      throw error;
    }
  };

  deleteEstimate = async (workspaceSlug: string, projectId: string, estimateId: string) => {
    const originalEstimateList = this.projectEstimates || [];

    runInAction(() => {
      this.estimates = {
        ...this.estimates,
        [projectId]: (this.estimates?.[projectId] || [])?.filter((estimate) => estimate.id !== estimateId),
      };
    });

    try {
      // deleting using api
      await this.estimateService.deleteEstimate(workspaceSlug, projectId, estimateId);
    } catch (error) {
      console.log("Failed to delete estimate from project store");
      // reverting back to original estimate list
      runInAction(() => {
        this.estimates = {
          ...this.estimates,
          [projectId]: originalEstimateList,
        };
      });
    }
  };
}
