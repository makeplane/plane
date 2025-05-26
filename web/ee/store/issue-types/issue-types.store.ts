import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { EWorkItemConversionType, EWorkItemTypeEntity } from "@plane/constants";
import {
  TLoader,
  TIssueType,
  IIssueTypesService,
  IIssuePropertiesService,
  IIssuePropertyOptionsService,
  IIssueType,
  IIssueTypesStore,
  TIssueTypesPromise,
  TWorkItemTypesPropertiesOptions,
  TEpicPropertiesOptions,
} from "@plane/types";
import { buildWorkItemTypeSchema } from "@plane/utils";
// plane web services
import {
  epicIssueTypeService,
  epicPropertyOptionService,
  epicPropertyService,
  issuePropertyOptionService,
  issuePropertyService,
  issueTypeService,
  epicService,
} from "@/plane-web/services/issue-types";
// plane web stores
import { IssueType } from "@/plane-web/store/issue-types";
import { RootStore } from "@/plane-web/store/root.store";

export class IssueTypes implements IIssueTypesStore {
  // observables
  loader: TLoader = "init-loader";
  issueTypePromise: TIssueTypesPromise | undefined = undefined;
  propertiesLoader: Record<string, Record<EWorkItemTypeEntity, TLoader>> = {};
  propertiesFetchedMap: Record<string, Record<EWorkItemTypeEntity, boolean>> = {};
  issueTypes: Record<string, IIssueType> = {};
  projectEpics: Record<string, IIssueType> = {};
  // root store
  rootStore: RootStore;
  // issue types services
  issueTypesService: IIssueTypesService;
  issuePropertyService: IIssuePropertiesService;
  issuePropertyOptionService: IIssuePropertyOptionsService;
  // epic services
  epicIssueTypesService: IIssueTypesService;
  epicPropertyService: IIssuePropertiesService;
  epicPropertyOptionService: IIssuePropertyOptionsService;

  constructor(protected store: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      propertiesLoader: observable,
      propertiesFetchedMap: observable,
      issueTypes: observable,
      projectEpics: observable,
      // computed
      data: computed,
      // helper actions
      fetchAllWorkItemTypePropertyData: action,
      fetchAllEpicPropertyData: action,
      // actions
      enableIssueTypes: action,
      fetchAllWorkItemTypePropertiesAndOptions: action,
      fetchAllEpicPropertiesAndOptions: action,
      createType: action,
      deleteType: action,
      convertWorkItem: action,
    });
    // root store
    this.rootStore = store;
    // issue types services
    this.issueTypesService = issueTypeService;
    this.issuePropertyService = issuePropertyService;
    this.issuePropertyOptionService = issuePropertyOptionService;
    // epic services
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
   * @description Get all work item type ids
   * @returns {string[]}
   */
  getIssueTypeIds = computedFn((activeOnly: boolean) =>
    Object.keys(this.data).filter((issueTypeId) => {
      const issueType = this.data[issueTypeId];
      return !activeOnly || (activeOnly && issueType.is_active);
    })
  );

  /**
   * @description Get work item type by work item type id
   * @param issueTypeId
   * @returns {IIssueType | undefined}
   */
  getIssueTypeById = computedFn((issueTypeId: string) => this.data[issueTypeId]);

  /**
   * @description Get work item property by work item property id (from all work item types)
   * @param customPropertyId
   * @returns {IIssueProperty<EIssuePropertyType> | undefined}
   */
  getIssuePropertyById = computedFn((customPropertyId: string) =>
    Object.keys(this.data)
      .filter(Boolean)
      .flatMap((issueTypeId) => this.getIssueTypeProperties(issueTypeId))
      .find((property) => property.id === customPropertyId)
  );

  /**
   * @description Get project work item type loader
   * @param projectId
   * @returns {TLoader}
   */
  getProjectWorkItemPropertiesLoader = computedFn((projectId: string, entityType: EWorkItemTypeEntity) => {
    if (!this.propertiesLoader?.[projectId]?.[entityType]) {
      set(this.propertiesLoader, [projectId, entityType], "init-loader");
    }
    return this.propertiesLoader[projectId][entityType];
  });

  /**
   * @description Get project work item type properties fetched map
   * @param projectId
   * @param entityType
   * @returns {boolean}
   */
  getProjectWorkItemPropertiesFetchedMap = computedFn((projectId: string, entityType: EWorkItemTypeEntity) => {
    if (!this.propertiesFetchedMap?.[projectId]?.[entityType]) {
      set(this.propertiesFetchedMap, [projectId, entityType], false);
    }
    return this.propertiesFetchedMap[projectId][entityType];
  });

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
   * @description Check if work item type is enabled for the project
   * @param workspaceSlug
   * @param projectId
   * @returns {boolean}
   */
  isWorkItemTypeEnabledForProject = computedFn((workspaceSlug: string, projectId: string): boolean => {
    const issueTypeFlagEnabled = this.rootStore.featureFlags.getFeatureFlagForCurrentWorkspace("ISSUE_TYPES", false);
    const projectFeatures = this.rootStore.projectDetails.getProjectFeatures(projectId);
    return (issueTypeFlagEnabled && projectFeatures?.is_issue_type_enabled) ?? false;
  });

  /**
   * @description Check if epic is enabled for the project
   * @param workspaceSlug
   * @param projectId
   * @returns {boolean}
   */
  isEpicEnabledForProject = computedFn((workspaceSlug: string, projectId: string): boolean => {
    const epicFlagEnabled = this.rootStore.featureFlags.getFeatureFlagForCurrentWorkspace("EPICS", false);
    const projectFeatures = this.rootStore.projectDetails.getProjectFeatures(projectId);
    return (epicFlagEnabled && projectFeatures?.is_epic_enabled) ?? false;
  });

  /**
   * @description Check if work item type or epic is enabled for the project
   * @param workspaceSlug
   * @param projectId
   * @param entityType
   * @returns {boolean}
   */
  isWorkItemTypeEntityEnabledForProject = computedFn(
    (workspaceSlug: string, projectId: string, entityType?: EWorkItemTypeEntity): boolean => {
      if (entityType === EWorkItemTypeEntity.WORK_ITEM) {
        return this.isWorkItemTypeEnabledForProject(workspaceSlug, projectId);
      }
      if (entityType === EWorkItemTypeEntity.EPIC) {
        return this.isEpicEnabledForProject(workspaceSlug, projectId);
      }
      return (
        this.isWorkItemTypeEnabledForProject(workspaceSlug, projectId) ||
        this.isEpicEnabledForProject(workspaceSlug, projectId)
      );
    }
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
          workItemType: this.issueTypesService,
          customProperty: this.issuePropertyService,
          customPropertyOption: this.issuePropertyOptionService,
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
          workItemType: this.epicIssueTypesService,
          customProperty: this.epicPropertyService,
          customPropertyOption: this.epicPropertyOptionService,
        },
        issueTypeData: epicIssueType,
      });

      // Add to store
      set(this.projectEpics, epicIssueType.id, epicIssueTypeInstance);
    }
  };

  /**
   * @description Fetch all work item property data for a project
   * @param workspaceSlug - The workspace slug
   * @param projectId - The project ID
   * @returns Promise resolving to work item properties/options
   */
  fetchAllWorkItemTypePropertyData = async (
    workspaceSlug: string,
    projectId: string
  ): Promise<TWorkItemTypesPropertiesOptions> => {
    if (!workspaceSlug || !projectId) {
      return { workItemTypeProperties: [], workItemTypePropertyOptions: {} };
    }
    const isIssueTypeEnabled = this.isWorkItemTypeEnabledForProject(workspaceSlug, projectId);
    if (!isIssueTypeEnabled) {
      return { workItemTypeProperties: [], workItemTypePropertyOptions: {} };
    }

    try {
      const [properties, options] = await Promise.all([
        this.issuePropertyService.fetchAll({ workspaceSlug, projectId }),
        this.issuePropertyOptionService.fetchAll({ workspaceSlug, projectId }),
      ]);
      return {
        workItemTypeProperties: properties || [],
        workItemTypePropertyOptions: options || {},
      };
    } catch (error) {
      console.error("Error fetching work item type data:", error);
      throw error;
    }
  };

  /**
   * @description Fetch all epic property data for a project
   * @param workspaceSlug - The workspace slug
   * @param projectId - The project ID
   * @returns Promise resolving to epic properties/options
   */
  fetchAllEpicPropertyData = async (workspaceSlug: string, projectId: string): Promise<TEpicPropertiesOptions> => {
    if (!workspaceSlug || !projectId) {
      return { epicProperties: [], epicPropertyOptions: {} };
    }
    const isEpicsEnabled = this.isEpicEnabledForProject(workspaceSlug, projectId);
    if (!isEpicsEnabled) {
      return { epicProperties: [], epicPropertyOptions: {} };
    }

    try {
      const [properties, options] = await Promise.all([
        this.epicPropertyService.fetchAll({ workspaceSlug, projectId }),
        this.epicPropertyOptionService.fetchAll({ workspaceSlug, projectId }),
      ]);
      return {
        epicProperties: properties || [],
        epicPropertyOptions: options || {},
      };
    } catch (error) {
      console.error("Error fetching epic data:", error);
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
        // get all work item templates
        const currentProjectWorkItemTemplates =
          this.rootStore.templatesRoot.workItemTemplates.getAllWorkItemTemplatesForProject(workspaceSlug, projectId);
        const workItemTemplatesWithoutType = currentProjectWorkItemTemplates.filter(
          (template) => !template.template_data.type || !template.template_data.type.id
        );
        // attach the new default issue type to all work item templates
        for (const template of workItemTemplatesWithoutType) {
          template.mutateInstance({
            template_data: {
              ...template.template_data,
              type: buildWorkItemTypeSchema(issueType.id, this.getIssueTypeById),
            },
          });
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
   * @description Get all issue types for the workspace or project
   * @param workspaceSlug
   * @param projectId - To fetch project level issue types
   */
  fetchAllIssueTypes = async (workspaceSlug: string, projectId?: string) => {
    if (!workspaceSlug) return Promise.resolve([]);
    const isIssueTypesEnabled = this.rootStore.featureFlags.getFeatureFlagForCurrentWorkspace("ISSUE_TYPES", false);
    if (!isIssueTypesEnabled) return Promise.resolve([]);
    const workItemTypeFetchService = projectId
      ? this.issueTypesService.fetchAllProjectLevel.bind(this.issueTypesService, { workspaceSlug, projectId })
      : this.issueTypesService.fetchAll.bind(this.issueTypesService, { workspaceSlug });
    return workItemTypeFetchService();
  };

  /**
   * @description Get all epics for the workspace or project
   * @param workspaceSlug
   * @param projectId - To fetch project level epics
   */
  fetchAllEpics = async (workspaceSlug: string, projectId?: string) => {
    if (!workspaceSlug) return Promise.resolve([]);
    const isEpicsEnabled = this.rootStore.featureFlags.getFeatureFlagForCurrentWorkspace("EPICS", false);
    if (!isEpicsEnabled) return Promise.resolve([]);
    const epicTypeFetchService = projectId
      ? this.epicIssueTypesService.fetchAllProjectLevel.bind(this.epicIssueTypesService, { workspaceSlug, projectId })
      : this.epicIssueTypesService.fetchAll.bind(this.epicIssueTypesService, { workspaceSlug });
    return epicTypeFetchService();
  };

  /**
   * @description Get all issue types and epics for the workspace or project
   * @param workspaceSlug
   * @param projectId - To fetch project level issue types and epics
   */
  fetchAll = async (workspaceSlug: string, projectId?: string) => {
    if (!workspaceSlug) return;
    try {
      this.loader = "init-loader";
      this.issueTypePromise = Promise.all([
        this.fetchAllIssueTypes(workspaceSlug, projectId),
        this.fetchAllEpics(workspaceSlug, projectId),
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
   * @description Get all work item type property and options
   * @param workspaceSlug
   * @param projectId
   */
  fetchAllWorkItemTypePropertiesAndOptions = async (workspaceSlug: string, projectId: string) => {
    if (!workspaceSlug || !projectId) return;
    try {
      // Do not fetch if issue types are already fetched and issue type ids are available
      if (this.getProjectWorkItemPropertiesFetchedMap(projectId, EWorkItemTypeEntity.WORK_ITEM)) return;
      // Fetch issue property and options
      set(this.propertiesLoader, [projectId, EWorkItemTypeEntity.WORK_ITEM], "init-loader");
      set(this.propertiesFetchedMap, [projectId, EWorkItemTypeEntity.WORK_ITEM], true);
      const { workItemTypeProperties, workItemTypePropertyOptions } = await this.fetchAllWorkItemTypePropertyData(
        workspaceSlug,
        projectId
      );
      runInAction(async () => {
        if (workItemTypeProperties) {
          // Since we fetch issue type, properties and options in parallel, we need to wait for issue types to be fetched and stores to be populated
          if (this.issueTypePromise) await this.issueTypePromise;
          for (const issueProperty of workItemTypeProperties) {
            if (issueProperty.id && issueProperty.issue_type) {
              const issueType = this.data[issueProperty.issue_type];
              if (issueType) {
                issueType.addOrUpdateProperty(issueProperty, workItemTypePropertyOptions[issueProperty.id]);
              }
            }
          }
        }
        set(this.propertiesLoader, [projectId, EWorkItemTypeEntity.WORK_ITEM], "loaded");
      });
    } catch (error) {
      set(this.propertiesLoader, [projectId, EWorkItemTypeEntity.WORK_ITEM], "loaded");
      set(this.propertiesFetchedMap, [projectId, EWorkItemTypeEntity.WORK_ITEM], false);
      throw error;
    }
  };

  /**
   * @description Get all epic type property and options
   * @param workspaceSlug
   * @param projectId
   */
  fetchAllEpicPropertiesAndOptions = async (workspaceSlug: string, projectId: string) => {
    if (!workspaceSlug || !projectId) return;
    try {
      // Do not fetch if issue types are already fetched and issue type ids are available
      if (this.getProjectWorkItemPropertiesFetchedMap(projectId, EWorkItemTypeEntity.EPIC)) return;
      // Fetch issue property and options
      set(this.propertiesLoader, [projectId, EWorkItemTypeEntity.EPIC], "init-loader");
      set(this.propertiesFetchedMap, [projectId, EWorkItemTypeEntity.EPIC], true);
      const { epicProperties, epicPropertyOptions } = await this.fetchAllEpicPropertyData(workspaceSlug, projectId);
      runInAction(async () => {
        if (epicProperties) {
          // Since we fetch issue type, properties and options in parallel, we need to wait for issue types to be fetched and stores to be populated
          if (this.issueTypePromise) await this.issueTypePromise;
          for (const issueProperty of epicProperties) {
            if (issueProperty.id && issueProperty.issue_type) {
              const issueType = this.data[issueProperty.issue_type];
              if (issueType) {
                issueType.addOrUpdateProperty(issueProperty, epicPropertyOptions[issueProperty.id]);
              }
            }
          }
        }
        set(this.propertiesLoader, [projectId, EWorkItemTypeEntity.EPIC], "loaded");
      });
    } catch (error) {
      set(this.propertiesLoader, [projectId, EWorkItemTypeEntity.EPIC], "loaded");
      set(this.propertiesFetchedMap, [projectId, EWorkItemTypeEntity.EPIC], false);
      throw error;
    }
  };

  /**
   * @description Fetch all properties and options
   * @param workspaceSlug
   * @param projectId
   * @param entityType
   */
  fetchAllPropertiesAndOptions = async (workspaceSlug: string, projectId: string, entityType: EWorkItemTypeEntity) => {
    if (!workspaceSlug || !projectId) return;
    if (entityType === EWorkItemTypeEntity.WORK_ITEM) {
      return this.fetchAllWorkItemTypePropertiesAndOptions(workspaceSlug, projectId);
    }
    if (entityType === EWorkItemTypeEntity.EPIC) {
      return this.fetchAllEpicPropertiesAndOptions(workspaceSlug, projectId);
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
              workItemType: this.issueTypesService,
              customProperty: this.issuePropertyService,
              customPropertyOption: this.issuePropertyOptionService,
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

  /**
   * @description Convert a work item type to another work item type
   * @param workspaceSlug
   * @param projectId
   * @param workItemId
   * @param convertTo
   */
  convertWorkItem = async (
    workspaceSlug: string,
    projectId: string,
    workItemId: string,
    convertTo: EWorkItemConversionType
  ) => {
    if (!workspaceSlug || !projectId || !workItemId || !convertTo) return;
    try {
      const detailStore =
        convertTo === EWorkItemConversionType.WORK_ITEM
          ? this.rootStore.issue.issueDetail
          : this.rootStore.issue.epicDetail;

      await epicService.convertWorkItemType(workspaceSlug, projectId, workItemId, convertTo);
      runInAction(() => {
        if (convertTo === EWorkItemConversionType.WORK_ITEM) {
          this.rootStore.issue.projectEpics.removeIssueFromList(workItemId);
          this.rootStore.issue.projectIssues.addIssueToList(workItemId);

          const initiativeIdFromRouter = this.rootStore.router.query.initiativeId;
          if (initiativeIdFromRouter) {
            this.rootStore.initiativeStore.epics.removeEpicFromInitiative(
              workspaceSlug,
              initiativeIdFromRouter?.toString(),
              workItemId
            );
          }
          // update is_epic to false
          this.rootStore.issue.issues.updateIssue(workItemId, { is_epic: false });
          detailStore.fetchActivities(workspaceSlug, projectId, workItemId);
        } else if (convertTo === EWorkItemConversionType.EPIC) {
          this.rootStore.issue.projectIssues.removeIssueFromList(workItemId);
          this.rootStore.issue.projectEpics.addIssueToList(workItemId);
          // update is_epic to true
          this.rootStore.issue.issues.updateIssue(workItemId, { is_epic: true });
          detailStore.fetchActivities(workspaceSlug, projectId, workItemId);
        }
      });
    } catch (error) {
      this.loader = "loaded";
      throw error;
    }
  };
}
