import { observable, action, makeObservable, runInAction, computed } from "mobx";
import { set } from "lodash";
// services
import { ProjectEstimateService } from "services/project";
// types
import { RootStore } from "store/root.store";
import { IEstimate, IEstimateFormData } from "types";

export interface IProjectEstimateStore {
  // states
  loader: boolean;
  error: any | null;
  // observables
  estimates: Record<string, IEstimate[] | null>;
  // computed
  areEstimatesEnabledForCurrentProject: boolean;
  projectEstimates: IEstimate[] | null;
  activeEstimateDetails: IEstimate | null;
  // computed actions
  getEstimatePointValue: (estimateKey: number | null) => string;
  getProjectEstimateById: (estimateId: string) => IEstimate | null;
  // actions
  fetchProjectEstimates: (workspaceSlug: string, projectId: string) => Promise<IEstimate[]>;
  createEstimate: (workspaceSlug: string, projectId: string, data: IEstimateFormData) => Promise<IEstimate>;
  updateEstimate: (
    workspaceSlug: string,
    projectId: string,
    estimateId: string,
    data: IEstimateFormData
  ) => Promise<IEstimate>;
  deleteEstimate: (workspaceSlug: string, projectId: string, estimateId: string) => Promise<void>;
}

export class ProjectEstimatesStore implements IProjectEstimateStore {
  // states
  loader: boolean = false;
  error: any | null = null;
  // observables
  estimates: Record<string, IEstimate[] | null> = {};
  // root store
  rootStore;
  // services
  estimateService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // states
      loader: observable,
      error: observable,
      // observables
      estimates: observable,
      // computed
      areEstimatesEnabledForCurrentProject: computed,
      projectEstimates: computed,
      activeEstimateDetails: computed,
      // computed actions
      getProjectEstimateById: action,
      getEstimatePointValue: action,
      // actions
      fetchProjectEstimates: action,
      createEstimate: action,
      updateEstimate: action,
      deleteEstimate: action,
    });

    // root store
    this.rootStore = _rootStore;
    // services
    this.estimateService = new ProjectEstimateService();
  }

  /**
   * @description returns true if estimates are enabled for current project, false otherwise
   */
  get areEstimatesEnabledForCurrentProject() {
    const currentProjectDetails = this.rootStore.projectRoot.project.currentProjectDetails;

    if (!currentProjectDetails) return false;

    return Boolean(currentProjectDetails?.estimate);
  }

  /**
   * @description returns the list of estimates for current project
   */
  get projectEstimates() {
    const projectId = this.rootStore.app.router.projectId;

    if (!projectId) return null;
    return this.estimates?.[projectId] || null;
  }

  /**
   * @description returns the active estimate details for current project
   */
  get activeEstimateDetails() {
    const currentProjectDetails = this.rootStore.projectRoot.project.currentProjectDetails;

    if (!currentProjectDetails || !currentProjectDetails?.estimate) return null;

    return this.projectEstimates?.find((estimate) => estimate.id === currentProjectDetails?.estimate) || null;
  }

  /**
   * @description returns the point value for the given estimate key to display in the UI
   */
  getEstimatePointValue = (estimateKey: number | null) => {
    if (estimateKey === null) return "None";

    const activeEstimate = this.activeEstimateDetails;

    return activeEstimate?.points?.find((point) => point.key === estimateKey)?.value || "None";
  };

  /**
   * @description returns the estimate details for the given estimate id
   */
  getProjectEstimateById = (estimateId: string) => {
    if (!this.projectEstimates) return null;

    const estimateInfo = this.projectEstimates?.find((estimate) => estimate.id === estimateId) || null;
    return estimateInfo;
  };

  /**
   * @description fetches the list of estimates for the given project
   * @param workspaceSlug
   * @param projectId
   */
  fetchProjectEstimates = async (workspaceSlug: string, projectId: string) => {
    try {
      this.loader = true;
      this.error = null;

      const estimatesResponse = await this.estimateService.getEstimatesList(workspaceSlug, projectId);

      runInAction(() => {
        set(this.estimates, projectId, estimatesResponse);
        this.loader = false;
        this.error = null;
      });

      return estimatesResponse;
    } catch (error) {
      this.loader = false;
      this.error = error;

      throw error;
    }
  };

  /**
   * @description creates a new estimate for the given project
   * @param workspaceSlug
   * @param projectId
   * @param data
   */
  createEstimate = async (workspaceSlug: string, projectId: string, data: IEstimateFormData) => {
    try {
      const response = await this.estimateService.createEstimate(workspaceSlug, projectId, data);

      const responseEstimate = {
        ...response.estimate,
        points: response.estimate_points,
      };

      runInAction(() => {
        set(this.estimates, projectId, [responseEstimate, ...(this.estimates?.[projectId] || [])]);
      });

      return response.estimate;
    } catch (error) {
      console.log("Failed to create estimate from project store");
      throw error;
    }
  };

  /**
   * @description updates the given estimate for the given project
   * @param workspaceSlug
   * @param projectId
   * @param estimateId
   * @param data
   */
  updateEstimate = async (workspaceSlug: string, projectId: string, estimateId: string, data: IEstimateFormData) => {
    try {
      const updatedEstimates = (this.estimates?.[projectId] ?? []).map((estimate) =>
        estimate.id === estimateId ? { ...estimate, ...data.estimate } : estimate
      );

      runInAction(() => {
        set(this.estimates, projectId, updatedEstimates);
      });

      const response = await this.estimateService.patchEstimate(workspaceSlug, projectId, estimateId, data);

      return response;
    } catch (error) {
      console.log("Failed to update estimate from project store");

      this.fetchProjectEstimates(workspaceSlug, projectId);

      throw error;
    }
  };

  /**
   * @description deletes the given estimate for the given project
   * @param workspaceSlug
   * @param projectId
   * @param estimateId
   */
  deleteEstimate = async (workspaceSlug: string, projectId: string, estimateId: string) => {
    try {
      const updatedEstimates = (this.estimates?.[projectId] ?? []).filter((estimate) => estimate.id !== estimateId);

      runInAction(() => {
        set(this.estimates, projectId, updatedEstimates);
      });

      await this.estimateService.deleteEstimate(workspaceSlug, projectId, estimateId);
    } catch (error) {
      console.log("Failed to delete estimate from project store");

      this.fetchProjectEstimates(workspaceSlug, projectId);
    }
  };
}
