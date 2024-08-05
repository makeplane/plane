import { set } from "lodash";
import { action, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { TLoader } from "@plane/types";
// plane web services
import {
  IssuePropertiesService,
  IssuePropertyOptionsService,
  IssueTypesService,
} from "@/plane-web/services/issue-types";
// plane web stores
import { IIssueType, IssueType } from "@/plane-web/store/issue-types";
import { RootStore } from "@/plane-web/store/root.store";
// plane web types
import { EIssuePropertyType, TIssueProperty, TIssuePropertyOptionsPayload, TIssueType } from "@/plane-web/types";

type TIssueTypesPropertiesOptions = {
  issueTypes: TIssueType[];
  issueProperties: TIssueProperty<EIssuePropertyType>[];
  issuePropertyOptions: TIssuePropertyOptionsPayload;
};

export interface IIssueTypesStore {
  // observables
  loader: Record<string, TLoader>; // project id -> TLoader
  fetchedMap: Record<string, boolean>; // project id -> boolean
  data: Record<string, IIssueType>; // issue type id -> issue type
  // computed functions
  getProjectIssueTypeLoader: (projectId: string) => TLoader;
  getProjectIssueTypeIds: (projectId: string) => string[];
  getProjectActiveIssueTypes: (projectId: string) => Record<string, IIssueType>; // issue type id -> issue type
  getProjectDefaultIssueTypeId: (projectId: string) => string | undefined;
  // helper actions
  fetchAllData: (workspaceSlug: string, projectId: string) => Promise<TIssueTypesPropertiesOptions>;
  // actions
  enableIssueTypes: (workspaceSlug: string, projectId: string) => Promise<void>;
  getAllTypesPropertiesOptions: (workspaceSlug: string, projectId: string) => Promise<TIssueType[] | undefined>;
  createType: (typeData: Partial<TIssueType>) => Promise<TIssueType | undefined>;
  deleteType: (typeId: string) => Promise<void>;
}

export class IssueTypes implements IIssueTypesStore {
  // observables
  loader: Record<string, TLoader> = {};
  fetchedMap: Record<string, boolean> = {};
  data: Record<string, IIssueType> = {};
  // service
  service: IssueTypesService;
  issuePropertyService: IssuePropertiesService;
  issuePropertyOptionService: IssuePropertyOptionsService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable,
      fetchedMap: observable,
      data: observable,
      // helper actions
      fetchAllData: action,
      // actions
      enableIssueTypes: action,
      getAllTypesPropertiesOptions: action,
      createType: action,
      deleteType: action,
    });
    // service
    this.service = new IssueTypesService();
    this.issuePropertyService = new IssuePropertiesService();
    this.issuePropertyOptionService = new IssuePropertyOptionsService();
  }

  // computed functions
  /**
   * @description Get project issue type loader
   * @param projectId
   * @returns {TLoader}
   */
  getProjectIssueTypeLoader = computedFn((projectId: string) => this.loader[projectId] ?? "init-loader");

  /**
   * @description Get project issue type ids
   * @param projectId
   * @returns {string[]}
   */
  getProjectIssueTypeIds = computedFn((projectId: string) => {
    const projectIssueTypeIds = Object.keys(this.data).filter(
      (issueTypeId) => this.data[issueTypeId]?.project === projectId
    );
    return projectIssueTypeIds;
  });

  /**
   * @description Get current project issue types
   * @returns {Record<string, IIssueType>}
   */
  getProjectActiveIssueTypes = computedFn((projectId: string) => {
    const projectIssueTypes = Object.entries(this.data).reduce(
      (acc, [issueTypeId, issueType]) => {
        if (issueType.project === projectId && issueType.is_active) {
          acc[issueTypeId] = issueType;
        }
        return acc;
      },
      {} as Record<string, IIssueType>
    );
    return projectIssueTypes;
  });

  getProjectDefaultIssueTypeId = computedFn((projectId: string) => {
    const projectIssueTypes = this.getProjectActiveIssueTypes(projectId);

    const defaultIssueType = Object.values(projectIssueTypes).find((issueType) => issueType.is_default);
    return defaultIssueType?.id ?? undefined;
  });

  // helper actions
  /**
   * @description Fetch all data
   * @param workspaceSlug
   * @param projectId
   */
  fetchAllData = async (workspaceSlug: string, projectId: string) => {
    const [issueTypes, issueProperties, issuePropertyOptions] = await Promise.all([
      this.service.fetchAll(workspaceSlug, projectId),
      this.issuePropertyService.fetchAll(workspaceSlug, projectId),
      this.issuePropertyOptionService.fetchAll(workspaceSlug, projectId),
    ]).catch((error) => {
      throw error;
    });
    return { issueTypes, issueProperties, issuePropertyOptions };
  };

  // actions
  /**
   * @description Enable issue type feature
   * @param workspaceSlug
   * @param projectId
   */
  enableIssueTypes = async (workspaceSlug: string, projectId: string) => {
    if (!workspaceSlug || !projectId) return;

    try {
      this.loader[projectId] = "init-loader";
      await this.service.enableIssueTypes(workspaceSlug, projectId);
      await this.store.projectRoot.project.fetchProjectDetails(workspaceSlug, projectId);
      await this.getAllTypesPropertiesOptions(workspaceSlug, projectId);
    } catch (error) {
      this.loader[projectId] = "loaded";
      throw error;
    }
  };

  /**
   * @description Get all types and properties
   * @param workspaceSlug
   * @param projectId
   */
  getAllTypesPropertiesOptions = async (workspaceSlug: string, projectId: string) => {
    if (!workspaceSlug || !projectId) return;

    try {
      // Do not fetch if issue type is not enabled
      const currentProjectDetails = this.store.projectRoot.project.getProjectById(projectId);
      if (!currentProjectDetails?.is_issue_type_enabled) return;
      // Do not fetch if issue types are already fetched and issue type ids are available
      const currentProjectIssueTypeIds = this.getProjectIssueTypeIds(projectId);
      if (this.fetchedMap[projectId] && currentProjectIssueTypeIds.length) return;
      // Fetch issue types and properties
      this.loader[projectId] = "init-loader";
      const { issueTypes, issueProperties, issuePropertyOptions } = await this.fetchAllData(workspaceSlug, projectId);
      runInAction(() => {
        if (issueTypes && issueProperties) {
          for (const issueType of issueTypes) {
            if (issueType.id) set(this.data, issueType.id, new IssueType(this.store, issueType));
          }
          for (const issueProperty of issueProperties) {
            if (issueProperty.id && issueProperty.issue_type) {
              const issueType = this.data[issueProperty.issue_type];
              if (issueType) {
                issueType.addProperty(issueProperty, issuePropertyOptions[issueProperty.id]);
              }
            }
          }
        }
        this.loader[projectId] = "loaded";
        this.fetchedMap[projectId] = true;
      });
      return issueTypes;
    } catch (error) {
      this.loader[projectId] = "loaded";
      this.fetchedMap[projectId] = false;
      throw error;
    }
  };

  /**
   * @description Create a new issue type
   * @param typeData
   */
  createType = async (typeData: Partial<TIssueType>) => {
    const { workspaceSlug, projectId } = this.store.router;
    if (!workspaceSlug || !projectId) return;

    try {
      this.loader[projectId] = "mutation";
      const issueType = await this.service.create(workspaceSlug, projectId, typeData);
      if (issueType.id) set(this.data, issueType.id, new IssueType(this.store, issueType));
      this.loader[projectId] = "loaded";
      return issueType;
    } catch (error) {
      this.loader[projectId] = "loaded";
      throw error;
    }
  };

  /**
   * @description Delete an issue type
   * @param typeId
   */
  deleteType = async (typeId: string) => {
    const { workspaceSlug, projectId } = this.store.router;
    if (!workspaceSlug || !projectId) return;

    try {
      this.loader[projectId] = "mutation";
      await this.service.deleteType(workspaceSlug, projectId, typeId);
      set(this.data, typeId, undefined);
      this.loader[projectId] = "loaded";
    } catch (error) {
      this.loader[projectId] = "loaded";
      throw error;
    }
  };
}
