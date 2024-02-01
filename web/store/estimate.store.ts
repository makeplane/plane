import { observable, action, makeObservable, runInAction, computed } from "mobx";
import set from "lodash/set";
// services
import { ProjectEstimateService } from "services/project";
// types
import { RootStore } from "store/root.store";
import { IEstimate, IEstimateFormData } from "@plane/types";
import { computedFn } from "mobx-utils";

export interface IEstimateStore {
  //Loaders
  fetchedMap: Record<string, boolean>;
  // observables
  estimateMap: Record<string, IEstimate>;
  // computed
  areEstimatesEnabledForCurrentProject: boolean;
  projectEstimates: IEstimate[] | null;
  activeEstimateDetails: IEstimate | null;
  // computed actions
  areEstimatesEnabledForProject: (projectId: string) => boolean;
  getEstimatePointValue: (estimateKey: number | null, projectId: string | null) => string;
  getProjectEstimateById: (estimateId: string) => IEstimate | null;
  getProjectActiveEstimateDetails: (projectId: string) => IEstimate | null;
  // fetch actions
  fetchProjectEstimates: (workspaceSlug: string, projectId: string) => Promise<IEstimate[]>;
  fetchWorkspaceEstimates: (workspaceSlug: string) => Promise<IEstimate[]>;
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
  estimateMap: Record<string, IEstimate> = {};
  //loaders
  fetchedMap: Record<string, boolean> = {};
  // root store
  rootStore;
  // services
  estimateService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      estimateMap: observable,
      fetchedMap: observable,
      // computed
      areEstimatesEnabledForCurrentProject: computed,
      projectEstimates: computed,
      activeEstimateDetails: computed,
      // actions
      fetchProjectEstimates: action,
      fetchWorkspaceEstimates: action,
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
    const worksapceSlug = this.rootStore.app.router.workspaceSlug || "";
    if (!projectId || !(this.fetchedMap[projectId] || this.fetchedMap[worksapceSlug])) return null;
    return Object.values(this.estimateMap).filter((estimate) => estimate.project === projectId);
  }

  /**
   * @description returns the active estimate details for current project
   */
  get activeEstimateDetails() {
    const currentProjectDetails = this.rootStore.projectRoot.project.currentProjectDetails;
    if (!currentProjectDetails || !currentProjectDetails?.estimate) return null;
    return this.estimateMap?.[currentProjectDetails?.estimate || ""] || null;
  }

  /**
   * @description returns true if estimates are enabled for a project using project id
   * @param projectId
   */
  areEstimatesEnabledForProject = computedFn((projectId: string) => {
    const projectDetails = this.rootStore.projectRoot.project.getProjectById(projectId);
    if (!projectDetails) return false;
    return Boolean(projectDetails.estimate) ?? false;
  });

  /**
   * @description returns the point value for the given estimate key to display in the UI
   */
  getEstimatePointValue = computedFn((estimateKey: number | null, projectId: string | null) => {
    if (estimateKey === null) return "None";
    const activeEstimate = projectId ? this.getProjectActiveEstimateDetails(projectId) : this.activeEstimateDetails;
    return activeEstimate?.points?.find((point) => point.key === estimateKey)?.value || "None";
  });

  /**
   * @description returns the estimate details for the given estimate id
   * @param estimateId
   */
  getProjectEstimateById = computedFn((estimateId: string) => {
    if (!this.projectEstimates) return null;
    const estimateInfo = this.estimateMap?.[estimateId] || null;
    return estimateInfo;
  });

  /**
   * @description returns the estimate details for the given estimate id
   * @param projectId
   */
  getProjectActiveEstimateDetails = computedFn((projectId: string) => {
    const projectDetails = this.rootStore.projectRoot.project?.getProjectById(projectId);
    const worksapceSlug = this.rootStore.app.router.workspaceSlug || "";
    if (!projectDetails || !projectDetails?.estimate || !(this.fetchedMap[projectId] || this.fetchedMap[worksapceSlug]))
      return null;
    return this.estimateMap?.[projectDetails?.estimate || ""] || null;
  });

  /**
   * @description fetches the list of estimates for the given project
   * @param workspaceSlug
   * @param projectId
   */
  fetchProjectEstimates = async (workspaceSlug: string, projectId: string) =>
    await this.estimateService.getEstimatesList(workspaceSlug, projectId).then((response) => {
      runInAction(() => {
        response.forEach((estimate) => {
          set(this.estimateMap, estimate.id, estimate);
        });
        this.fetchedMap[projectId] = true;
      });
      return response;
    });

  /**
   * @description fetches the list of estimates for the given project
   * @param workspaceSlug
   * @param projectId
   */
  fetchWorkspaceEstimates = async (workspaceSlug: string) =>
    await this.estimateService.getWorkspaceEstimatesList(workspaceSlug).then((response) => {
      runInAction(() => {
        response.forEach((estimate) => {
          set(this.estimateMap, estimate.id, estimate);
        });
        this.fetchedMap[workspaceSlug] = true;
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
        set(this.estimateMap, [responseEstimate.id], responseEstimate);
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
      runInAction(() => {
        set(this.estimateMap, estimateId, {
          ...this.estimateMap[estimateId],
          ...data.estimate,
          points: [...data.estimate_points],
        });
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
      runInAction(() => {
        delete this.estimateMap[estimateId];
      });
    });
}
