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
  issueProperties: TIssueProperty<EIssuePropertyType>[];
  issuePropertyOptions: TIssuePropertyOptionsPayload;
};

export interface IIssueTypesStore {
  // observables
  loader: TLoader; // issue type loader
  issuePropertiesLoader: Record<string, TLoader>; // project id -> TLoader
  propertiesFetchedMap: Record<string, boolean>; // project id -> boolean
  data: Record<string, IIssueType>; // issue type id -> issue type
  // computed functions
  getProjectIssuePropertiesLoader: (projectId: string) => TLoader;
  getProjectIssueTypeIds: (projectId: string) => string[];
  getProjectActiveIssueTypes: (projectId: string) => Record<string, IIssueType>; // issue type id -> issue type
  getProjectDefaultIssueType: (projectId: string) => IIssueType | undefined;
  getIssueTypeProperties: (issueTypeId: string) => TIssueProperty<EIssuePropertyType>[];
  // helper actions
  addOrUpdateIssueTypes: (issueTypes: TIssueType[]) => void;
  fetchAllPropertyData: (workspaceSlug: string, projectId: string) => Promise<TIssueTypesPropertiesOptions>;
  // actions
  enableIssueTypes: (workspaceSlug: string, projectId: string) => Promise<void>;
  fetchAllIssueTypes: (workspaceSlug: string, projectId?: string) => Promise<TIssueType[] | undefined>;
  fetchAllPropertiesAndOptions: (workspaceSlug: string, projectId: string) => Promise<void | undefined>;
  createType: (typeData: Partial<TIssueType>) => Promise<TIssueType | undefined>;
  deleteType: (typeId: string) => Promise<void>;
}

export class IssueTypes implements IIssueTypesStore {
  // observables
  loader: TLoader = "init-loader";
  issuePropertiesLoader: Record<string, TLoader> = {};
  propertiesFetchedMap: Record<string, boolean> = {};
  data: Record<string, IIssueType> = {};
  // service
  service: IssueTypesService;
  issuePropertyService: IssuePropertiesService;
  issuePropertyOptionService: IssuePropertyOptionsService;

  constructor(private store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      issuePropertiesLoader: observable,
      propertiesFetchedMap: observable,
      data: observable,
      // helper actions
      fetchAllPropertyData: action,
      // actions
      enableIssueTypes: action,
      fetchAllPropertiesAndOptions: action,
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
  getProjectIssuePropertiesLoader = computedFn(
    (projectId: string) => this.issuePropertiesLoader[projectId] ?? "init-loader"
  );

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

  /**
   * @description Get project default issue type id of the project
   * @param projectId
   * @returns {string | undefined}
   */
  getProjectDefaultIssueType = computedFn((projectId: string) => {
    const projectIssueTypes = this.getProjectActiveIssueTypes(projectId);

    const defaultIssueType = Object.values(projectIssueTypes).find((issueType) => issueType.is_default);
    return defaultIssueType ?? undefined;
  });

  /**
   * @description Get issue type properties by issue type id
   * @param issueTypeId
   * @returns {TIssueProperty<EIssuePropertyType>[]}
   */
  getIssueTypeProperties = computedFn((issueTypeId: string) => {
    const issueType = this.data[issueTypeId];
    if (!issueType) return [];
    return issueType.properties;
  });

  // helper actions
  /**
   * @description Add issue types to the store
   * @param issueTypes
   * @returns void
   */
  addOrUpdateIssueTypes = (issueTypes: TIssueType[]) => {
    for (const issueType of issueTypes) {
      if (issueType.id) {
        if (this.data[issueType.id]) {
          // update the issue type
          this.data[issueType.id].updateType(issueType);
        } else {
        // create a new issue type
          set(this.data, issueType.id, new IssueType(this.store, issueType));
        }
      }
    }
  };

  /**
   * @description Fetch all data
   * @param workspaceSlug
   * @param projectId
   */
  fetchAllPropertyData = async (workspaceSlug: string, projectId: string) => {
    const [issueProperties, issuePropertyOptions] = await Promise.all([
      this.issuePropertyService.fetchAll(workspaceSlug, projectId),
      this.issuePropertyOptionService.fetchAll(workspaceSlug, projectId),
    ]).catch((error) => {
      throw error;
    });
    return { issueProperties, issuePropertyOptions };
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
      this.loader = "init-loader";
      const issueTypeId = await this.service.enableIssueTypes(workspaceSlug, projectId);
      await this.fetchAllIssueTypes(workspaceSlug, projectId);
      runInAction(() => {
        // enable `is_issue_type_enabled` in project details
        set(this.store.projectRoot.project.projectMap, [projectId, "is_issue_type_enabled"], true);
        // get all issues
        const currentProjectIssues = Object.values(this.store.issue.issues.issuesMap).filter(
          (issue) => issue.project_id === projectId
        );
        // attach issue type to all project issues
        for (const issue of currentProjectIssues) {
          this.store.issue.issues.updateIssue(issue.id, { type_id: issueTypeId });
        }
        this.loader = "loaded";
      });
    } catch (error) {
      this.loader = "loaded";
      throw error;
    }
  };

  /**
   * @description Get all issue types for the workspace or project, if project id is provided
   * @param workspaceSlug
   * @param projectId (optional)
   */
  fetchAllIssueTypes = async (workspaceSlug: string, projectId?: string) => {
    if (!workspaceSlug) return;
    try {
      this.loader = "init-loader";
      let issueTypes;
      if (projectId) {
        issueTypes = await this.service.fetchAllProjectIssueTypes(workspaceSlug, projectId);
      } else {
        issueTypes = await this.service.fetchAll(workspaceSlug);
      }
      runInAction(() => {
        this.addOrUpdateIssueTypes(issueTypes);
        this.loader = "loaded";
      });
      return issueTypes;
    } catch (error) {
      this.loader = "loaded";
      console.error("Error in fetching issue types", error);
      throw error;
    }
  };

  /**
   * @description Get all property and options
   * @param workspaceSlug
   * @param projectId
   */
  fetchAllPropertiesAndOptions = async (workspaceSlug: string, projectId: string) => {
    if (!workspaceSlug || !projectId) return;
    try {
      // Do not fetch if issue types are already fetched and issue type ids are available
      if (this.propertiesFetchedMap[projectId] === true) return;
      // Fetch issue property and options
      this.issuePropertiesLoader[projectId] = "init-loader";
      const { issueProperties, issuePropertyOptions } = await this.fetchAllPropertyData(workspaceSlug, projectId);
      runInAction(() => {
        if (issueProperties) {
          for (const issueProperty of issueProperties) {
            if (issueProperty.id && issueProperty.issue_type) {
              const issueType = this.data[issueProperty.issue_type];
              if (issueType) {
                issueType.addProperty(issueProperty, issuePropertyOptions[issueProperty.id]);
              }
            }
          }
        }
        this.issuePropertiesLoader[projectId] = "loaded";
        this.propertiesFetchedMap[projectId] = true;
      });
    } catch (error) {
      this.issuePropertiesLoader[projectId] = "loaded";
      this.propertiesFetchedMap[projectId] = false;
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
      this.loader = "mutation";
      const issueType = await this.service.create(workspaceSlug, projectId, typeData);
      if (issueType.id) set(this.data, issueType.id, new IssueType(this.store, issueType));
      this.loader = "loaded";
      return issueType;
    } catch (error) {
      this.loader = "loaded";
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
      this.loader = "mutation";
      await this.service.deleteType(workspaceSlug, projectId, typeId);
      set(this.data, typeId, undefined);
      this.loader = "loaded";
    } catch (error) {
      this.loader = "loaded";
      throw error;
    }
  };
}
