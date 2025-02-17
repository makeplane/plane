import { set } from "lodash";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { E_FEATURE_FLAGS, EIssuePropertyType } from "@plane/constants";
import {
  TEpicStats,
  TLoader,
  TIssueType,
  TIssueProperty,
  TIssuePropertyOptionsPayload,
  IIssueTypesService,
  IIssuePropertiesService,
  IIssuePropertyOptionsService,
  IEpicService,
  TEpicAnalytics,
  TEpicAnalyticsGroup,
  IIssueType,
  IIssueTypesStore,
  TIssueTypesPromise,
  TIssueTypesPropertiesOptions,
  IssueTypeFlagKeys,
  EpicIssueTypeFlagKeys,
} from "@plane/types";
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
import { IssueType } from "@/plane-web/store/issue-types";
import { RootStore } from "@/plane-web/store/root.store";

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
  epicStatsLoader: Record<string, TLoader> = {};
  epicStatsMap: Record<string, TEpicStats> = {};
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
      epicStatsLoader: observable,
      epicStatsMap: observable,
      // computed
      data: computed,
      // helper actions
      fetchAllPropertyData: action,
      // actions
      enableIssueTypes: action,
      fetchAllPropertiesAndOptions: action,
      fetchEpicAnalytics: action,
      fetchEpicStats: action,
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
      ...this.projectEpics,
    };
  }

  // computed functions
  /**
   * @description Get work item type by work item type id
   * @param issueTypeId
   * @returns {IIssueType | undefined}
   */
  getIssueTypeById = computedFn((issueTypeId: string) => this.data[issueTypeId]);

  /**
   * @description Get work item property by work item property id (from all work item types)
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
   * @description Get project work item type loader
   * @param projectId
   * @returns {TLoader}
   */
  getProjectIssuePropertiesLoader = computedFn(
    (projectId: string) => this.issuePropertiesLoader[projectId] ?? "init-loader"
  );

  /**
   * @description Get project work item type ids
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
   * @description Get current project work item types
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
  getProjectEpicId = computedFn(
    (projectId: string) =>
      Object.values(this.projectEpics)
        .filter(Boolean)
        .find((issueType) => issueType.project_ids?.includes(projectId))?.id
  );

  /**
   * @description Get project epic details
   * @param projectId
   * @returns {IIssueType | undefined}
   */
  getProjectEpicDetails = computedFn((projectId: string) => {
    const projectEpicId = this.getProjectEpicId(projectId);
    return projectEpicId ? this.getIssueTypeById(projectEpicId) : undefined;
  });

  /**
   * @description Get project default work item type id of the project
   * @param projectId
   * @returns {string | undefined}
   */
  getProjectDefaultIssueType = computedFn((projectId: string) => {
    const projectIssueTypes = this.getProjectIssueTypes(projectId, true);

    const defaultIssueType = Object.values(projectIssueTypes).find((issueType) => issueType.is_default);
    return defaultIssueType ?? undefined;
  });

  /**
   * @description Get work item type properties by work item type id
   * @param issueTypeId
   * @returns {TIssueProperty<EIssuePropertyType>[]}
   */
  getIssueTypeProperties = computedFn((issueTypeId: string) => {
    const issueType = this.data[issueTypeId];
    if (!issueType) return [];
    return issueType.properties;
  });

  /**
   * @description Get work item type ids with mandatory properties
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

  getEpicStatsById = computedFn((epicId: string) => this.epicStatsMap[epicId]);

  /**
   * @description Check if work item type is enabled for the project
   * @param workspaceSlug
   * @param projectId
   * @param issueTypeFlagKey - feature flag
   * @returns {boolean}
   */
  isIssueTypeEnabledForProject = computedFn(
    (workspaceSlug: string, projectId: string, issueTypeFlagKey: IssueTypeFlagKeys): boolean => {
      const issueTypeFlagEnabled =
        this.rootStore.featureFlags.flags[workspaceSlug]?.[E_FEATURE_FLAGS[issueTypeFlagKey]];
      const projectFeatures = this.rootStore.projectDetails.getProjectFeatures(projectId);
      return (issueTypeFlagEnabled && projectFeatures?.is_issue_type_enabled) ?? false;
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
      const epicFlagEnabled = this.rootStore.featureFlags.getFeatureFlagForCurrentWorkspace(epicFlagKey, false);
      const projectFeatures = this.rootStore.projectDetails.getProjectFeatures(projectId);
      return (epicFlagEnabled && projectFeatures?.is_epic_enabled) ?? false;
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
      this.epicStatsMap[epicId] = {
        ...this.epicStatsMap[epicId],
        ...payload,
      };
    });
  };

  /**
   * @description Check if work item type or epic is enabled for the project
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
   * @description Add work item types to the store
   * @param issueTypes
   * @returns void
   */
  addOrUpdateIssueTypes = (issueTypes: TIssueType[]) => {
    for (const issueType of issueTypes) {
      if (!issueType.id) continue;

      // Update existing issue type if it exists
      if (this.issueTypes[issueType.id]) {
        this.issueTypes[issueType.id].updateType(issueType, false);
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
        this.projectEpics[epicIssueType.id].updateType(epicIssueType, false);
        continue;
      }

      // Create new epic issue type instance
      const epicIssueTypeInstance = new IssueType({
        root: this.rootStore,
        services: {
          issueTypes: this.epicIssueTypesService,
          issueProperties: this.epicPropertyService,
          issuePropertyOptions: this.epicPropertyOptionService,
        },
        issueTypeData: epicIssueType,
      });

      // Add to store
      set(this.projectEpics, epicIssueType.id, epicIssueTypeInstance);
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
    const isIssueTypeEnabled = this.isIssueTypeEnabledForProject(workspaceSlug, projectId, "ISSUE_TYPES");
    const isEpicsEnabled = this.isEpicEnabledForProject(workspaceSlug, projectId, "EPICS");
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
        console.error("Error fetching work item type data:", error);
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

  /**
   * @description Fetch epic stats
   * @param workspaceSlug
   * @param projectId
   */
  fetchEpicStats = async (workspaceSlug: string, projectId: string) => {
    if (!workspaceSlug || !projectId) return;
    if (!this.epicService.fetchEpicStats) throw new Error("Fetch epic stats service not available.");
    try {
      this.epicStatsLoader[projectId] = "init-loader";
      const response = await this.epicService.fetchEpicStats(workspaceSlug, projectId);

      runInAction(() => {
        if (!response) return;

        if (!this.epicStatsMap) this.epicStatsMap = {};

        response.forEach((stats) => {
          if (!stats) return;

          this.epicStatsMap![stats.epic_id] = stats;
        });
        this.epicStatsLoader[projectId] = "loaded";
      });

      return response;
    } catch (error) {
      this.epicStatsLoader[projectId] = "loaded";
      throw error;
    }
  };

  // actions
  /**
   * @description Enable work item type feature
   * @param workspaceSlug
   * @param projectId
   */
  enableIssueTypes = async (workspaceSlug: string, projectId: string) => {
    if (!workspaceSlug || !projectId) return;
    if (!this.issueTypesService.enable) throw new Error("Enable work item type service not available.");
    try {
      this.loader = "init-loader";
      const issueType = await this.issueTypesService.enable({ workspaceSlug, projectId });
      runInAction(() => {
        // enable `is_issue_type_enabled` in project details
        set(this.rootStore.projectDetails.features, [projectId, "is_issue_type_enabled"], true);
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
    if (!this.epicIssueTypesService.enable) throw new Error("Enable epic work item type service not available.");
    try {
      this.loader = "init-loader";
      const epic = await this.epicIssueTypesService.enable({ workspaceSlug, projectId });
      runInAction(() => {
        // enable `is_epic_enabled` in project details
        set(this.rootStore.projectDetails.features, [projectId, "is_epic_enabled"], true);
        // add epic issue type to the store
        this.addOrUpdateEpicIssueTypes([epic]);
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
    const epic = this.getProjectEpicDetails(projectId);
    const epicId = epic?.id;
    if (!epic || !epicId) return;
    if (!this.epicIssueTypesService.disable) throw new Error("Disable epic work item type service not available.");
    try {
      runInAction(() => {
        // disable `is_epic_enabled` in project details
        set(this.rootStore.projectDetails.features, [projectId, "is_epic_enabled"], false);
      });
      await this.epicIssueTypesService.disable({ workspaceSlug, projectId });
    } catch (error) {
      runInAction(() => {
        // revert the changes
        set(this.rootStore.projectDetails.features, [projectId, "is_epic_enabled"], true);
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
    const isIssueTypesEnabled = this.rootStore.featureFlags.getFeatureFlagForCurrentWorkspace("ISSUE_TYPES", false);
    if (!isIssueTypesEnabled) return Promise.resolve([]);
    return this.issueTypesService.fetchAll({ workspaceSlug });
  };

  /**
   * @description Get all epics for the workspace
   * @param workspaceSlug
   */
  fetchAllEpics = async (workspaceSlug: string) => {
    if (!workspaceSlug) return Promise.resolve([]);
    const isEpicsEnabled = this.rootStore.featureFlags.getFeatureFlagForCurrentWorkspace("EPICS", false);
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
      console.error("Error in fetching work item types", error);
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
   * @description Create a new work item type
   * @param typeData
   */
  createType = async (typeData: Partial<TIssueType>) => {
    const { workspaceSlug, projectId } = this.rootStore.router;
    if (!workspaceSlug || !projectId) return;
    if (!this.issueTypesService.create) throw new Error("Create work item type service not available.");
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
   * @description Delete a work item type
   * @param typeId
   */
  deleteType = async (typeId: string) => {
    const { workspaceSlug, projectId } = this.rootStore.router;
    if (!workspaceSlug || !projectId) return;
    if (!this.issueTypesService.deleteType) throw new Error("Delete work item type service not available.");
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
