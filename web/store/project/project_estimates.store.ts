import { observable, action, makeObservable, runInAction } from "mobx";
// types
import { RootStore } from "../root";
import { IEstimate, IEstimateFormData } from "types";
// services
import { IssueLabelService } from "services/issue";
import { ProjectService, ProjectEstimateService } from "services/project";

export interface IProjectEstimateStore {
  loader: boolean;
  error: any | null;

  // estimates
  createEstimate: (workspaceSlug: string, projectId: string, data: IEstimateFormData) => Promise<IEstimate>;
  updateEstimate: (
    workspaceSlug: string,
    projectId: string,
    labelId: string,
    data: IEstimateFormData
  ) => Promise<IEstimate>;
  deleteEstimate: (workspaceSlug: string, projectId: string, estimateId: string) => Promise<void>;
}

export class ProjectEstimatesStore implements IProjectEstimateStore {
  loader: boolean = false;
  error: any | null = null;

  // root store
  rootStore;
  // service
  projectService;
  issueLabelService;
  estimateService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observable
      loader: observable,
      error: observable,

      // labels
      createEstimate: action,
      updateEstimate: action,
      deleteEstimate: action,
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectService();
    this.estimateService = new ProjectEstimateService();
    this.issueLabelService = new IssueLabelService();
  }

  createEstimate = async (workspaceSlug: string, projectId: string, data: IEstimateFormData) => {
    try {
      const response = await this.estimateService.createEstimate(
        workspaceSlug,
        projectId,
        data,
        this.rootStore.user.currentUser!
      );

      const responseEstimate = {
        ...response.estimate,
        points: response.estimate_points,
      };

      runInAction(() => {
        this.rootStore.project.estimates = {
          ...this.rootStore.project.estimates,
          [projectId]: [responseEstimate, ...(this.rootStore.project.estimates?.[projectId] || [])],
        };
      });

      return response;
    } catch (error) {
      console.log("Failed to create label from project store");
      throw error;
    }
  };

  updateEstimate = async (workspaceSlug: string, projectId: string, estimateId: string, data: IEstimateFormData) => {
    const originalEstimates = this.rootStore.project.getProjectEstimateById(estimateId);

    runInAction(() => {
      this.rootStore.project.labels = {
        ...this.rootStore.project.labels,
        [projectId]:
          this.rootStore.project.labels?.[projectId]?.map((label) =>
            label.id === estimateId ? { ...label, ...data } : label
          ) || [],
      };
    });

    try {
      const response = await this.estimateService.patchEstimate(
        workspaceSlug,
        projectId,
        estimateId,
        data,
        this.rootStore.user.currentUser!
      );

      return response;
    } catch (error) {
      console.log("Failed to update label from project store");
      runInAction(() => {
        this.rootStore.project.labels = {
          ...this.rootStore.project.labels,
          [projectId]: (this.rootStore.project.labels?.[projectId] || [])?.map((label) =>
            label.id === estimateId ? { ...label, ...originalEstimates } : label
          ),
        } as any;
      });
      throw error;
    }
  };

  deleteEstimate = async (workspaceSlug: string, projectId: string, estimateId: string) => {
    const originalEstimateList = this.rootStore.project.projectEstimates || [];

    runInAction(() => {
      this.rootStore.project.estimates = {
        ...this.rootStore.project.estimates,
        [projectId]: (this.rootStore.project.estimates?.[projectId] || [])?.filter(
          (estimate) => estimate.id !== estimateId
        ),
      };
    });

    try {
      // deleting using api
      await this.estimateService.deleteEstimate(workspaceSlug, projectId, estimateId, this.rootStore.user.currentUser!);
    } catch (error) {
      console.log("Failed to delete label from project store");
      // reverting back to original label list
      runInAction(() => {
        this.rootStore.project.estimates = {
          ...this.rootStore.project.estimates,
          [projectId]: originalEstimateList,
        };
      });
    }
  };
}
