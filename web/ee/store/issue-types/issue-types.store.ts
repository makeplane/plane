import { set } from "lodash";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { TLoader } from "@plane/types";
// plane web enums
import { E_FEATURE_FLAGS } from "@/plane-web/hooks/store";
// plane web services
import {
  epicIssueTypeService,
  epicPropertyOptionService,
  epicPropertyService,
  epicService,
  issuePropertyOptionService,
  issuePropertyService,
  issueTypeService,
} from "@/plane-web/services/issue-types";
// plane web stores
import { IIssueProperty, IIssueType, IssueType } from "@/plane-web/store/issue-types";
import { RootStore } from "@/plane-web/store/root.store";
// plane web types
import {
  EIssuePropertyType,
  IEpicService,
  IIssuePropertiesService,
  IIssuePropertyOptionsService,
  IIssueTypesService,
  TEpicAnalytics,
  TEpicAnalyticsGroup,
  TIssueProperty,
  TIssuePropertyOptionsPayload,
  TIssueType,
} from "@/plane-web/types";

type TIssueTypesPromise = Promise<[TIssueType[], TIssueType[]]>;

type TIssueTypesPropertiesOptions = {
  issueProperties: TIssueProperty<EIssuePropertyType>[];
  issuePropertyOptions: TIssuePropertyOptionsPayload;
};

type IssueTypeFlagKeys = keyof {
  [K in keyof typeof E_FEATURE_FLAGS as K extends "ISSUE_TYPE_DISPLAY" | "ISSUE_TYPE_SETTINGS" ? K : never]: unknown;
};

type EpicIssueTypeFlagKeys = keyof {
  [K in keyof typeof E_FEATURE_FLAGS as K extends "EPICS_SETTINGS" | "EPICS_DISPLAY" ? K : never]: unknown;
};

export interface IIssueTypesStore {
  // observables
  loader: TLoader; // issue type loader
  issueTypePromise: TIssueTypesPromise | undefined; // promise to fetch issue types and epics
  issuePropertiesLoader: Record<string, TLoader>; // project id -> TLoader
  propertiesFetchedMap: Record<string, boolean>; // project id -> boolean
  issueTypes: Record<string, IIssueType>; // issue type id -> issue type
  projectEpics: Record<string, IIssueType>; // project id -> epic issue type
  epicAnalyticsLoader: Record<string, TLoader>; // epic id -> TLoader
  epicAnalyticsMap: Record<string, TEpicAnalytics>; // epic id -> TEpicAnalytics
  // computed
  data: Record<string, IIssueType>; // all issue type id -> issue type
  // computed functions
  getEpicAnalyticsById: (epicId: string) => TEpicAnalytics | undefined;
  getIssueTypeById: (issueTypeId: string) => IIssueType | undefined;
  getIssuePropertyById: (issuePropertyId: string) => IIssueProperty<EIssuePropertyType> | undefined;
  getProjectIssuePropertiesLoader: (projectId: string) => TLoader;
  getProjectIssueTypeIds: (projectId: string) => string[];
  getProjectIssueTypes: (projectId: string, activeOnly: boolean) => Record<string, IIssueType>; // issue type id -> issue type
  getProjectEpicId: (projectId: string) => string | undefined;
  getProjectDefaultIssueType: (projectId: string) => IIssueType | undefined;
  getIssueTypeProperties: (issueTypeId: string) => IIssueProperty<EIssuePropertyType>[];
  getIssueTypeIdsWithMandatoryProperties: (projectId: string) => string[];
  isIssueTypeEnabledForProject: (
    workspaceSlug: string,
    projectId: string,
    issueTypeFlagKey: IssueTypeFlagKeys
  ) => boolean;
  isEpicEnabledForProject: (workspaceSlug: string, projectId: string, epicFlagKey: EpicIssueTypeFlagKeys) => boolean;
  isIssueTypeOrEpicEnabledForProject: (
    workspaceSlug: string,
    projectId: string,
    issueTypeFlagKey: IssueTypeFlagKeys,
    epicFlagKey: EpicIssueTypeFlagKeys
  ) => boolean;
  // helper actions
  addOrUpdateIssueTypes: (issueTypes: TIssueType[]) => void;
  addOrUpdateEpicIssueTypes: (issueTypes: TIssueType[]) => void;
  fetchAllPropertyData: (workspaceSlug: string, projectId: string) => Promise<TIssueTypesPropertiesOptions>;
  fetchAllIssueTypes: (workspaceSlug: string) => Promise<TIssueType[]>;
  fetchAllEpics: (workspaceSlug: string) => Promise<TIssueType[]>;
  // actions
  enableIssueTypes: (workspaceSlug: string, projectId: string) => Promise<void>;
  enableEpics: (workspaceSlug: string, projectId: string) => Promise<void>;
  disableEpics: (workspaceSlug: string, projectId: string) => Promise<void>;
  fetchAll: (workspaceSlug: string) => Promise<void>;
  fetchAllPropertiesAndOptions: (workspaceSlug: string, projectId: string) => Promise<void | undefined>;
  fetchEpicAnalytics: (workspaceSlug: string, projectId: string, epicId: string) => Promise<TEpicAnalytics | undefined>;
  updateEpicAnalytics: (
    workspaceSlug: string,
    projectId: string,
    epicId: string,
    data: {
      incrementStateGroupCount?: TEpicAnalyticsGroup;
      decrementStateGroupCount?: TEpicAnalyticsGroup;
    }
  ) => void;
  createType: (typeData: Partial<TIssueType>) => Promise<TIssueType | undefined>;
  deleteType: (typeId: string) => Promise<void>;
}

export class IssueTypes implements IIssueTypesStore {
  // observables
  epicAnalyticsMap: Record<string, TEpicAnalytics> = {};
  epicAnalyticsLoader: Record<string, TLoader> = {};
  loader: TLoader = "init-loader";
  issueTypePromise: TIssueTypesPromise | undefined = undefined;
  issuePropertiesLoader: Record<string, TLoader> = {};
  propertiesFetchedMap: Record<string, boolean> = {};
  issueTypes: Record<string, IIssueType> = {};
  projectEpics: Record<string, IIssueType> = {};
  // root store
  rootStore: RootStore;
  // issue types services
  issueTypesService: IIssueTypesService;
  issuePropertyService: IIssuePropertiesService;
  issuePropertyOptionService: IIssuePropertyOptionsService;
  // epic services
  epicService: IEpicService;
  epicIssueTypesService: IIssueTypesService;
  epicPropertyService: IIssuePropertiesService;
  epicPropertyOptionService: IIssuePropertyOptionsService;

  constructor(protected store: RootStore) {
    makeObservable(this, {
      // observables
      epicAnalyticsMap: observable,
      epicAnalyticsLoader: observable,
      loader: observable.ref,
      issuePropertiesLoader: observable,
      propertiesFetchedMap: observable,
      issueTypes: observable,
      projectEpics: observable,
      // computed
      data: computed,
      // helper actions
      fetchAllPropertyData: action,
      // actions
      enableIssueTypes: action,
      fetchAllPropertiesAndOptions: action,
      fetchEpicAnalytics: action,
      createType: action,
      deleteType: action,
      updateEpicAnalytics: action,
    });
    // root store
    this.rootStore = store;
    // issue types services
    this.issueTypesService = issueTypeService;
    this.issuePropertyService = issuePropertyService;
    this.issuePropertyOptionService = issuePropertyOptionService;
    // epic services
    this.epicService = epicService;
    this.epicIssueTypesService = epicIssueTypeService;
    this.epicPropertyService = epicPropertyService;
    this.epicPropertyOptionService = epicPropertyOptionService;
  }

  // computed
  get data() {
    return {
      ...this.issueTypes,
      ...Object.fromEntries(
        Object.entries(this.projectEpics)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .filter(([_, epic]) => epic?.id)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .map(([_, epic]) => [epic.id, epic])
      ),
    };
  }

  // computed functions
  /**
   * @description Get issue type by issue type id
   * @param issueTypeId
   * @returns {IIssueType | undefined}
   */
  getIssueTypeById = computedFn((issueTypeId: string) => this.data[issueTypeId]);

  /**
   * @description Get issue property by issue property id (from all issue types)
   * @param issuePropertyId
   * @returns {IIssueProperty<EIssuePropertyType> | undefined}
   */
  getIssuePropertyById = computedFn((issuePropertyId: string) =>
    Object.keys(this.data)
      .filter(Boolean)
      .flatMap((issueTypeId) => this.getIssueTypeProperties(issueTypeId))
      .find((property) => property.id === issuePropertyId)
  );

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
    const projectIssueTypeIds = Object.keys(this.issueTypes).filter((issueTypeId) =>
      this.issueTypes[issueTypeId]?.project_ids?.includes(projectId)
    );
    return projectIssueTypeIds;
  });

  /**
   * @description Get current project issue types
   * @returns {Record<string, IIssueType>}
   */
  getProjectIssueTypes = computedFn((projectId: string, activeOnly: boolean) => {
    const projectIssueTypes = Object.entries(this.issueTypes).reduce(
      (acc, [issueTypeId, issueType]) => {
        if (issueType.project_ids?.includes(projectId)) {
          if (activeOnly && !issueType.is_active) return acc;
          acc[issueTypeId] = issueType;
        }
        return acc;
      },
      {} as Record<string, IIssueType>
    );
    return projectIssueTypes;
  });

  /**
   * @description Get project epic id
   * @param projectId
   * @returns {string | undefined}
   */
  getProjectEpicId = computedFn((projectId: string) => this.projectEpics[projectId]?.id ?? undefined);

  /**
   * @description Get project default issue type id of the project
   * @param projectId
   * @returns {string | undefined}
   */
  getProjectDefaultIssueType = computedFn((projectId: string) => {
    const projectIssueTypes = this.getProjectIssueTypes(projectId, true);

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

  /**
   * @description Get issue type ids with mandatory properties
   * @param projectId
   * @returns {string[]}
   */
  getIssueTypeIdsWithMandatoryProperties = computedFn((projectId: string) => {
    const projectIssueTypes = this.getProjectIssueTypes(projectId, false);
    return Object.keys(projectIssueTypes).filter((issueTypeId) => {
      const issueType = projectIssueTypes[issueTypeId];
      return issueType.activeProperties.some((property) => property.is_required);
    });
  });

  /**
   * @description Get epic analytics by epic id
   * @param epicId
   * @returns {TEpicAnalytics | undefined}
   */
  getEpicAnalyticsById = computedFn((epicId: string) =>
    this.epicAnalyticsMap[epicId] ? this.epicAnalyticsMap[epicId] : undefined
  );

  /**
   * @description Check if issue type is enabled for the project
   * @param workspaceSlug
   * @param projectId
   * @param issueTypeFlagKey - feature flag
   * @returns {boolean}
   */
  isIssueTypeEnabledForProject = computedFn(
    (workspaceSlug: string, projectId: string, issueTypeFlagKey: IssueTypeFlagKeys): boolean => {
      const issueTypeFlagEnabled =
        this.rootStore.featureFlags.flags[workspaceSlug]?.[E_FEATURE_FLAGS[issueTypeFlagKey]];
      const projectDetails = this.rootStore.projectRoot.project.getProjectById(projectId);
      return (issueTypeFlagEnabled && projectDetails?.is_issue_type_enabled) ?? false;
    }
  );

  /**
   * @description Check if epic is enabled for the project
   * @param workspaceSlug
   * @param projectId
   * @param epicFlagKey
   * @returns {boolean}
   */
  isEpicEnabledForProject = computedFn(
    (workspaceSlug: string, projectId: string, epicFlagKey: EpicIssueTypeFlagKeys): boolean => {
      const epicFlagEnabled = this.rootStore.featureFlags.getFeatureFlagForCurrentWorkspace(epicFlagKey);
      // const projectDetails = this.rootStore.projectRoot.project.getProjectById(projectId);
      return epicFlagEnabled ?? false;
      // return (epicFlagEnabled && projectDetails?.is_epic_enabled) ?? false;
    }
  );

  updateEpicAnalytics = (
    workspaceSlug: string,
    projectId: string,
    epicId: string,
    data: {
      incrementStateGroupCount?: TEpicAnalyticsGroup;
      decrementStateGroupCount?: TEpicAnalyticsGroup;
    }
  ) => {
    // Early return if required params are missing or no analytics exist
    if (!workspaceSlug || !projectId || !epicId || !this.epicAnalyticsMap[epicId]) return;

    const { incrementStateGroupCount, decrementStateGroupCount } = data;
    if (!incrementStateGroupCount && !decrementStateGroupCount) return;

    // Create update payload
    const payload: Partial<TEpicAnalytics> = {};

    if (incrementStateGroupCount) {
      payload[incrementStateGroupCount] = this.epicAnalyticsMap[epicId][incrementStateGroupCount] + 1;
    }

    if (decrementStateGroupCount) {
      payload[decrementStateGroupCount] =
        this.epicAnalyticsMap[epicId][decrementStateGroupCount] > 0
          ? this.epicAnalyticsMap[epicId][decrementStateGroupCount] - 1
          : 0;
    }

    // Update analytics in a single operation
    runInAction(() => {
      this.epicAnalyticsMap[epicId] = {
        ...this.epicAnalyticsMap[epicId],
        ...payload,
      };
    });
  };

  /**
   * @description Check if issue type or epic is enabled for the project
   * @param workspaceSlug
   * @param projectId
   * @param issueTypeFlagKey
   * @param epicFlagKey
   * @returns {boolean}
   */
  isIssueTypeOrEpicEnabledForProject = computedFn(
    (
      workspaceSlug: string,
      projectId: string,
      issueTypeFlagKey: IssueTypeFlagKeys,
      epicFlagKey: EpicIssueTypeFlagKeys
    ): boolean =>
      this.isIssueTypeEnabledForProject(workspaceSlug, projectId, issueTypeFlagKey) ||
      this.isEpicEnabledForProject(workspaceSlug, projectId, epicFlagKey)
  );

  // helper actions
  /**
   * @description Add issue types to the store
   * @param issueTypes
   * @returns void
   */
  addOrUpdateIssueTypes = (issueTypes: TIssueType[]) => {
    for (const issueType of issueTypes) {
      if (!issueType.id) continue;

      // Update existing issue type if it exists
      if (this.issueTypes[issueType.id]) {
        this.issueTypes[issueType.id].updateType(issueType);
        continue;
      }

      // Create new issue type instance
      const issueTypeInstance = new IssueType({
        root: this.rootStore,
        services: {
          issueTypes: this.issueTypesService,
          issueProperties: this.issuePropertyService,
          issuePropertyOptions: this.issuePropertyOptionService,
        },
        issueTypeData: issueType,
      });

      // Add to store
      set(this.issueTypes, issueType.id, issueTypeInstance);
    }
  };

  /**
   * @description Add epic issue types to the store
   * @param issueTypes
   * @returns void
   */
  addOrUpdateEpicIssueTypes = (epicIssueTypes: TIssueType[]) => {
    for (const epicIssueType of epicIssueTypes) {
      if (!epicIssueType.id) continue;

      // Update existing epic issue type
      if (this.projectEpics[epicIssueType.id]) {
        this.projectEpics[epicIssueType.id].updateType(epicIssueType);
        continue;
      }

      // Create new epic issue type for each project
      if (!epicIssueType.project_ids?.length) continue;

      const epicIssueTypeInstance = new IssueType({
        root: this.rootStore,
        services: {
          issueTypes: this.epicIssueTypesService,
          issueProperties: this.epicPropertyService,
          issuePropertyOptions: this.epicPropertyOptionService,
        },
        issueTypeData: epicIssueType,
      });

      // Set the same issue type instance for each project
      for (const projectId of epicIssueType.project_ids) {
        set(this.projectEpics, [projectId], epicIssueTypeInstance);
      }
    }
  };

  /**
   * @description Fetch all issue and epic property data for a project
   * @param workspaceSlug - The workspace slug
   * @param projectId - The project ID
   * @returns Promise resolving to combined issue and epic properties/options
   */
  fetchAllPropertyData = async (workspaceSlug: string, projectId: string): Promise<TIssueTypesPropertiesOptions> => {
    if (!workspaceSlug || !projectId) {
      return { issueProperties: [], issuePropertyOptions: {} };
    }
    const isIssueTypeEnabled = this.isIssueTypeEnabledForProject(workspaceSlug, projectId, "ISSUE_TYPE_DISPLAY");
    const isEpicsEnabled = this.isEpicEnabledForProject(workspaceSlug, projectId, "EPICS_DISPLAY");
    // Fetch issue type data
    let issueProperties: TIssueProperty<EIssuePropertyType>[] = [];
    let issuePropertyOptions: TIssuePropertyOptionsPayload = {};
    if (isIssueTypeEnabled) {
      try {
        const [properties, options] = await Promise.all([
          this.issuePropertyService.fetchAll({ workspaceSlug, projectId }),
          this.issuePropertyOptionService.fetchAll({ workspaceSlug, projectId }),
        ]);
        issueProperties = properties || [];
        issuePropertyOptions = options || {};
      } catch (error) {
        console.error("Error fetching issue type data:", error);
      }
    }

    // Fetch epic data
    let epicProperties: TIssueProperty<EIssuePropertyType>[] = [];
    let epicPropertyOptions: TIssuePropertyOptionsPayload = {};
    if (isEpicsEnabled) {
      try {
        const [properties, options] = await Promise.all([
          this.epicPropertyService.fetchAll({ workspaceSlug, projectId }),
          this.epicPropertyOptionService.fetchAll({ workspaceSlug, projectId }),
        ]);
        epicProperties = properties || [];
        epicPropertyOptions = options || {};
      } catch (error) {
        console.error("Error fetching epic data:", error);
      }
    }

    return {
      issueProperties: [...issueProperties, ...epicProperties],
      issuePropertyOptions: { ...issuePropertyOptions, ...epicPropertyOptions },
    };
  };

  /**
   * @description Fetch epic analytics
   * @param workspaceSlug
   * @param projectId
   * @param epicId
   */
  fetchEpicAnalytics = async (workspaceSlug: string, projectId: string, epicId: string) => {
    if (!workspaceSlug || !projectId || !epicId) return;
    if (!this.epicService.getIssueProgressAnalytics) throw new Error("Get epic analytics service not available.");
    try {
      this.epicAnalyticsLoader[epicId] = "init-loader";
      const analytics = await this.epicService.getIssueProgressAnalytics(workspaceSlug, projectId, epicId);
      runInAction(() => {
        set(this.epicAnalyticsMap, epicId, analytics);
        this.epicAnalyticsLoader[epicId] = "loaded";
      });
      return analytics;
    } catch (error) {
      this.epicAnalyticsLoader[epicId] = "loaded";
      throw error;
    }
  };

  // actions
  /**
   * @description Enable issue type feature
   * @param workspaceSlug
   * @param projectId
   */
  enableIssueTypes = async (workspaceSlug: string, projectId: string) => {
    if (!workspaceSlug || !projectId) return;
    if (!this.issueTypesService.enable) throw new Error("Enable issue type service not available.");
    try {
      this.loader = "init-loader";
      const issueType = await this.issueTypesService.enable({ workspaceSlug, projectId });
      runInAction(() => {
        // enable `is_issue_type_enabled` in project details
        set(this.rootStore.projectRoot.project.projectMap, [projectId, "is_issue_type_enabled"], true);
        // add issue type to the store
        this.addOrUpdateIssueTypes([issueType]);
        // get all issues
        const currentProjectIssues = Object.values(this.rootStore.issue.issues.issuesMap).filter(
          (issue) => issue.project_id === projectId
        );
        // attach issue type to all project issues
        for (const issue of currentProjectIssues) {
          this.rootStore.issue.issues.updateIssue(issue.id, { type_id: issueType.id });
        }
        this.loader = "loaded";
      });
    } catch (error) {
      this.loader = "loaded";
      throw error;
    }
  };

  /**
   * @description Enable epics for the project
   * @param workspaceSlug
   * @param projectId
   */
  enableEpics = async (workspaceSlug: string, projectId: string) => {
    if (!workspaceSlug || !projectId) return;
    if (!this.epicIssueTypesService.enable) throw new Error("Enable epic issue type service not available.");
    try {
      this.loader = "init-loader";
      const epic = await this.epicIssueTypesService.enable({ workspaceSlug, projectId });
      runInAction(() => {
        // enable `is_epic_enabled` in project details
        set(this.rootStore.projectRoot.project.projectMap, [projectId, "is_epic_enabled"], true);
        // add epic issue type to the store
        set(this.projectEpics, projectId, epic);
        this.loader = "loaded";
      });
    } catch (error) {
      this.loader = "loaded";
      throw error;
    }
  };

  /**
   * @description Disable epics for the project
   * @param workspaceSlug
   * @param projectId
   */
  disableEpics = async (workspaceSlug: string, projectId: string) => {
    if (!workspaceSlug || !projectId) return;
    const epic = this.projectEpics[projectId];
    if (!epic) return;
    if (!this.epicIssueTypesService.disable) throw new Error("Disable epic issue type service not available.");
    try {
      runInAction(() => {
        // disable `is_epic_enabled` in project details
        set(this.rootStore.projectRoot.project.projectMap, [projectId, "is_epic_enabled"], false);
        // remove epic issue type from the store
        set(this.projectEpics, projectId, undefined);
      });
      await this.epicIssueTypesService.disable({ workspaceSlug, projectId });
    } catch (error) {
      runInAction(() => {
        // revert the changes
        set(this.rootStore.projectRoot.project.projectMap, [projectId, "is_epic_enabled"], true);
        set(this.projectEpics, projectId, epic);
      });
      throw error;
    }
  };

  /**
   * @description Get all issue types for the workspace
   * @param workspaceSlug
   */
  fetchAllIssueTypes = async (workspaceSlug: string) => {
    if (!workspaceSlug) return Promise.resolve([]);
    const isIssueTypesEnabled = this.rootStore.featureFlags.getFeatureFlagForCurrentWorkspace("ISSUE_TYPE_DISPLAY");
    if (!isIssueTypesEnabled) return Promise.resolve([]);
    return this.issueTypesService.fetchAll({ workspaceSlug });
  };

  /**
   * @description Get all epics for the workspace
   * @param workspaceSlug
   */
  fetchAllEpics = async (workspaceSlug: string) => {
    if (!workspaceSlug) return Promise.resolve([]);
    const isEpicsEnabled = this.rootStore.featureFlags.getFeatureFlagForCurrentWorkspace("EPICS_DISPLAY");
    if (!isEpicsEnabled) return Promise.resolve([]);
    return this.epicIssueTypesService.fetchAll({ workspaceSlug });
  };

  /**
   * @description Get all issue types and epics for the workspace
   * @param workspaceSlug
   */
  fetchAll = async (workspaceSlug: string) => {
    if (!workspaceSlug) return;
    try {
      this.loader = "init-loader";
      this.issueTypePromise = Promise.all([
        this.fetchAllIssueTypes(workspaceSlug),
        this.fetchAllEpics(workspaceSlug),
      ]).catch((error) => {
        throw error;
      });
      const [issueTypes, epicIssueTypes] = await this.issueTypePromise;
      runInAction(() => {
        if (issueTypes) this.addOrUpdateIssueTypes(issueTypes);
        if (epicIssueTypes) this.addOrUpdateEpicIssueTypes(epicIssueTypes);
        this.loader = "loaded";
        this.issueTypePromise = undefined;
      });
    } catch (error) {
      this.loader = "loaded";
      this.issueTypePromise = undefined;
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
      this.propertiesFetchedMap[projectId] = true;
      const { issueProperties, issuePropertyOptions } = await this.fetchAllPropertyData(workspaceSlug, projectId);
      runInAction(async () => {
        if (issueProperties) {
          // Since we fetch issue type,properties and options in parallel, we need to wait for issue types to be fetched and stores to be populated
          if (this.issueTypePromise) await this.issueTypePromise;
          for (const issueProperty of issueProperties) {
            if (issueProperty.id && issueProperty.issue_type) {
              const issueType = this.data[issueProperty.issue_type];
              if (issueType) {
                issueType.addOrUpdateProperty(issueProperty, issuePropertyOptions[issueProperty.id]);
              }
            }
          }
        }
        this.issuePropertiesLoader[projectId] = "loaded";
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
    const { workspaceSlug, projectId } = this.rootStore.router;
    if (!workspaceSlug || !projectId) return;
    if (!this.issueTypesService.create) throw new Error("Create issue type service not available.");
    try {
      this.loader = "mutation";
      const issueType = await this.issueTypesService.create({ workspaceSlug, projectId, data: typeData });
      if (issueType.id) {
        set(
          this.issueTypes,
          issueType.id,
          new IssueType({
            root: this.rootStore,
            services: {
              issueTypes: this.issueTypesService,
              issueProperties: this.issuePropertyService,
              issuePropertyOptions: this.issuePropertyOptionService,
            },
            issueTypeData: issueType,
          })
        );
      }
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
    const { workspaceSlug, projectId } = this.rootStore.router;
    if (!workspaceSlug || !projectId) return;
    if (!this.issueTypesService.deleteType) throw new Error("Delete issue type service not available.");
    try {
      this.loader = "mutation";
      await this.issueTypesService.deleteType({ workspaceSlug, projectId, issueTypeId: typeId });
      set(this.issueTypes, typeId, undefined);
      this.loader = "loaded";
    } catch (error) {
      this.loader = "loaded";
      throw error;
    }
  };
}
