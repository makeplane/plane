import { observable, action, makeObservable, runInAction, computed } from "mobx";
import set from "lodash/set";
// services
import { ProjectEstimateService } from "services/project";
// types
import { RootStore } from "store/root.store";
import { IEstimate, IEstimateFormData } from "@plane/types";

export interface IEstimateStore {
  // observables
  estimates: Record<string, IEstimate[] | null>;
  // computed
  areEstimatesEnabledForCurrentProject: boolean;
  projectEstimates: IEstimate[] | null;
  activeEstimateDetails: IEstimate | null;
  // computed actions
  areEstimatesActiveForProject: (projectId: string) => boolean;
  getEstimatePointValue: (estimateKey: number | null) => string;
  getProjectEstimateById: (estimateId: string) => IEstimate | null;
  getProjectActiveEstimateDetails: (projectId: string) => IEstimate | null;
  // fetch actions
  fetchProjectEstimates: (workspaceSlug: string, projectId: string) => Promise<IEstimate[]>;
  // crud actions
  createEstimate: (workspaceSlug: string, projectId: string, data: IEstimateFormData) => Promise<IEstimate>;
  updateEstimate: (
    workspaceSlug: string,
    projectId: string,
    estimateId: string,
    data: IEstimateFormData
  ) => Promise<IEstimate>;
  deleteEstimate: (workspaceSlug: string, projectId: string, estimateId: string) => Promise<void>;
}

export class EstimateStore implements IEstimateStore {
  // observables
  estimates: Record<string, IEstimate[] | null> = {};
  // root store
  rootStore;
  // services
  estimateService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      estimates: observable,
      // computed
      areEstimatesEnabledForCurrentProject: computed,
      projectEstimates: computed,
      activeEstimateDetails: computed,
      // computed actions
      areEstimatesActiveForProject: action,
      getProjectEstimateById: action,
      getEstimatePointValue: action,
      getProjectActiveEstimateDetails: action,
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
   * @description returns true if estimates are enabled for a project using project id
   * @param projectId
   */
  areEstimatesActiveForProject = (projectId: string) => {
    const projectDetails = this.rootStore.projectRoot.project.getProjectById(projectId);
    if (!projectDetails) return false;
    return Boolean(projectDetails.estimate) ?? false;
  };

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
   * @param estimateId
   */
  getProjectEstimateById = (estimateId: string) => {
    if (!this.projectEstimates) return null;
    const estimateInfo = this.projectEstimates?.find((estimate) => estimate.id === estimateId) || null;
    return estimateInfo;
  };

  /**
   * @description returns the estimate details for the given estimate id
   * @param projectId
   */
  getProjectActiveEstimateDetails = (projectId: string) => {
    const projectDetails = this.rootStore.projectRoot.project.getProjectById(projectId);
    if (!projectDetails || !projectDetails?.estimate) return null;
    return this.projectEstimates?.find((estimate) => estimate.id === projectDetails?.estimate) || null;
  };

  /**
   * @description fetches the list of estimates for the given project
   * @param workspaceSlug
   * @param projectId
   */
  fetchProjectEstimates = async (workspaceSlug: string, projectId: string) =>
    await this.estimateService.getEstimatesList(workspaceSlug, projectId).then((response) => {
      runInAction(() => {
        set(this.estimates, projectId, response);
      });
      return response;
    });

  /**
   * @description creates a new estimate for the given project
   * @param workspaceSlug
   * @param projectId
   * @param data
   */
  createEstimate = async (workspaceSlug: string, projectId: string, data: IEstimateFormData) =>
    await this.estimateService.createEstimate(workspaceSlug, projectId, data).then((response) => {
      const responseEstimate = {
        ...response.estimate,
        points: response.estimate_points,
      };
      runInAction(() => {
        set(this.estimates, projectId, [responseEstimate, ...(this.estimates?.[projectId] || [])]);
      });
      return response.estimate;
    });

  /**
   * @description updates the given estimate for the given project
   * @param workspaceSlug
   * @param projectId
   * @param estimateId
   * @param data
   */
  updateEstimate = async (workspaceSlug: string, projectId: string, estimateId: string, data: IEstimateFormData) =>
    await this.estimateService.patchEstimate(workspaceSlug, projectId, estimateId, data).then((response) => {
      const updatedEstimates = (this.estimates?.[projectId] ?? []).map((estimate) =>
        estimate.id === estimateId ? { ...estimate, ...data.estimate } : estimate
      );
      runInAction(() => {
        set(this.estimates, projectId, updatedEstimates);
      });
      return response;
    });

  /**
   * @description deletes the given estimate for the given project
   * @param workspaceSlug
   * @param projectId
   * @param estimateId
   */
  deleteEstimate = async (workspaceSlug: string, projectId: string, estimateId: string) =>
    await this.estimateService.deleteEstimate(workspaceSlug, projectId, estimateId).then(() => {
      const updatedEstimates = (this.estimates?.[projectId] ?? []).filter((estimate) => estimate.id !== estimateId);
      runInAction(() => {
        set(this.estimates, projectId, updatedEstimates);
      });
    });
}
