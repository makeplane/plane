// types
import { EIssuePropertyType, TIssueProperty, IIssueProperty, TIssuePropertyPayload } from "./work-item-properties";
import { TLoader } from "../issues/base";
import { TLogoProps } from "../common";
import { TIssuePropertyOption, TIssuePropertyOptionsPayload } from "./work-item-property-option";

export enum EWorkItemTypeEntity {
  WORK_ITEM = "WORK_ITEM",
  EPIC = "EPIC",
}

export enum EWorkItemConversionType {
  WORK_ITEM = "work_item",
  EPIC = "epic",
}

// Issue Type
export type TIssueType = {
  id: string | undefined;
  name: string | undefined;
  description: string | undefined;
  logo_props: TLogoProps | undefined;
  is_active: boolean | undefined;
  is_default: boolean | undefined;
  issue_exists: boolean | undefined;
  level: number | undefined;
  is_epic: boolean | undefined;
  project_ids: string[] | undefined;
  workspace: string | undefined;
  created_at: Date | undefined;
  created_by: string | undefined;
  updated_at: Date | undefined;
  updated_by: string | undefined;
};

// Issue Type Instance
export interface IIssueType extends TIssueType {
  properties: IIssueProperty<EIssuePropertyType>[];
  // computed
  asJSON: TIssueType | undefined;
  activeProperties: IIssueProperty<EIssuePropertyType>[];
  // computed function
  getPropertyById: <T extends EIssuePropertyType>(propertyId: string) => IIssueProperty<T> | undefined;
  // actions
  updateType: (issueTypeData: Partial<TIssueType>, shouldSync?: boolean) => Promise<TIssueType | undefined>;
  addOrUpdateProperty: (
    propertyData: TIssueProperty<EIssuePropertyType>,
    propertyOptions: TIssuePropertyOption[]
  ) => void;
  createProperty: (propertyData: TIssuePropertyPayload) => Promise<TIssueProperty<EIssuePropertyType> | undefined>;
  deleteProperty: (propertyId: string) => Promise<void>;
}

// Issue Type Store related types
export type TIssueTypesPromise = Promise<[TIssueType[], TIssueType[]]>;

export type TWorkItemTypesPropertiesOptions = {
  workItemTypeProperties: TIssueProperty<EIssuePropertyType>[];
  workItemTypePropertyOptions: TIssuePropertyOptionsPayload;
};

export type TEpicPropertiesOptions = {
  epicProperties: TIssueProperty<EIssuePropertyType>[];
  epicPropertyOptions: TIssuePropertyOptionsPayload;
};

// Issue Type Store
export interface IIssueTypesStore {
  // observables
  loader: TLoader; // issue type loader
  issueTypePromise: TIssueTypesPromise | undefined; // promise to fetch issue types and epics
  propertiesLoader: Record<string, Record<EWorkItemTypeEntity, TLoader>>; // project id -> work item entity type -> TLoader
  propertiesFetchedMap: Record<string, Record<EWorkItemTypeEntity, boolean>>; // project id -> work item entity type -> boolean
  issueTypes: Record<string, IIssueType>; // issue type id -> issue type
  projectEpics: Record<string, IIssueType>; // epic issue type id -> epic issue type
  // computed
  data: Record<string, IIssueType>; // all issue type id -> issue type
  // computed functions
  getIssueTypeIds: (activeOnly: boolean) => string[];
  getIssueTypeById: (issueTypeId: string) => IIssueType | undefined;
  getIssuePropertyById: (customPropertyId: string) => IIssueProperty<EIssuePropertyType> | undefined;
  getProjectWorkItemPropertiesLoader: (projectId: string, entityType: EWorkItemTypeEntity) => TLoader;
  getProjectWorkItemPropertiesFetchedMap: (projectId: string, entityType: EWorkItemTypeEntity) => boolean;
  getProjectIssueTypeIds: (projectId: string) => string[];
  getProjectIssueTypes: (projectId: string, activeOnly: boolean) => Record<string, IIssueType>; // issue type id -> issue type
  getProjectEpicId: (projectId: string) => string | undefined;
  getProjectEpicDetails: (projectId: string) => IIssueType | undefined;
  getProjectDefaultIssueType: (projectId: string) => IIssueType | undefined;
  getIssueTypeProperties: (issueTypeId: string) => IIssueProperty<EIssuePropertyType>[];
  getIssueTypeIdsWithMandatoryProperties: (projectId: string) => string[];
  isWorkItemTypeEnabledForProject: (workspaceSlug: string, projectId: string) => boolean;
  isEpicEnabledForProject: (workspaceSlug: string, projectId: string) => boolean;
  isWorkItemTypeEntityEnabledForProject: (
    workspaceSlug: string,
    projectId: string,
    entityType?: EWorkItemTypeEntity
  ) => boolean;
  // helper actions
  addOrUpdateIssueTypes: (issueTypes: TIssueType[], projectId?: string) => void;
  fetchAllWorkItemTypePropertyData: (
    workspaceSlug: string,
    projectId: string
  ) => Promise<TWorkItemTypesPropertiesOptions>;
  fetchAllEpicPropertyData: (workspaceSlug: string, projectId: string) => Promise<TEpicPropertiesOptions>;
  fetchAllIssueTypes: (workspaceSlug: string, projectId?: string) => Promise<TIssueType[]>;
  fetchAllEpics: (workspaceSlug: string, projectId?: string) => Promise<TIssueType[]>;
  // actions
  enableIssueTypes: (workspaceSlug: string, projectId: string) => Promise<void>;
  enableEpics: (workspaceSlug: string, projectId: string) => Promise<void>;
  disableEpics: (workspaceSlug: string, projectId: string) => Promise<void>;
  fetchAll: (workspaceSlug: string, projectId?: string) => Promise<void>;
  fetchAllWorkItemTypePropertiesAndOptions: (workspaceSlug: string, projectId: string) => Promise<void | undefined>;
  fetchAllEpicPropertiesAndOptions: (workspaceSlug: string, projectId: string) => Promise<void | undefined>;
  fetchAllPropertiesAndOptions: (
    workspaceSlug: string,
    projectId: string,
    entityType: EWorkItemTypeEntity
  ) => Promise<void | undefined>;
  createType: (typeData: Partial<TIssueType>) => Promise<TIssueType | undefined>;
  deleteType: (typeId: string) => Promise<void>;
  // convert actions
  convertWorkItem: (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    convertTo: EWorkItemConversionType
  ) => Promise<void>;
}
