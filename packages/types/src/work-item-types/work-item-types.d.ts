// types
import { E_FEATURE_FLAGS, EIssuePropertyType } from "@plane/constants";
import {
  TLoader,
  TIssuePropertyPayload,
  TIssuePropertyOption,
  TIssueProperty,
  IIssueProperty,
  TLogoProps,
  TEpicStats,
  TEpicAnalyticsGroup,
  TEpicAnalytics,
  TIssuePropertyOptionsPayload,
} from "@plane/types";

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

export type TIssueTypesPropertiesOptions = {
  issueProperties: TIssueProperty<EIssuePropertyType>[];
  issuePropertyOptions: TIssuePropertyOptionsPayload;
};

export type IssueTypeFlagKeys = keyof {
  [K in keyof typeof E_FEATURE_FLAGS as K extends "ISSUE_TYPES" ? K : never]: unknown;
};

export type EpicIssueTypeFlagKeys = keyof {
  [K in keyof typeof E_FEATURE_FLAGS as K extends "EPICS" ? K : never]: unknown;
};

// Issue Type Store
export interface IIssueTypesStore {
  // observables
  loader: TLoader; // issue type loader
  issueTypePromise: TIssueTypesPromise | undefined; // promise to fetch issue types and epics
  issuePropertiesLoader: Record<string, TLoader>; // project id -> TLoader
  // propertiesFetchedMap: Record<string, boolean>; // project id -> boolean
  issueTypes: Record<string, IIssueType>; // issue type id -> issue type
  projectEpics: Record<string, IIssueType>; // epic issue type id -> epic issue type
  epicAnalyticsLoader: Record<string, TLoader>; // epic id -> TLoader
  epicAnalyticsMap: Record<string, TEpicAnalytics>; // epic id -> TEpicAnalytics
  epicStatsLoader: Record<string, TLoader>; // epic id -> TLoader
  epicStatsMap: Record<string, TEpicStats>; // epic id -> TEpicStats
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
  getProjectEpicDetails: (projectId: string) => IIssueType | undefined;
  getEpicStatsById: (epicId: string) => TEpicStats | undefined;
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
  addOrUpdateIssueTypes: (issueTypes: TIssueType[], projectId?: string) => void;
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
  fetchEpicStats: (workspaceSlug: string, projectId: string) => Promise<TEpicStats[] | undefined>;
  createType: (typeData: Partial<TIssueType>) => Promise<TIssueType | undefined>;
  deleteType: (typeId: string) => Promise<void>;
}
