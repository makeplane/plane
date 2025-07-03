import { TEpicAnalytics, TEpicStats } from "../epics";
import { EIssuePropertyType, TIssueProperty, TIssuePropertyPayload, TIssuePropertyResponse } from "./work-item-properties";
import { TIssuePropertyOption, TIssuePropertyOptionsPayload } from "./work-item-property-option";
import { TIssueType } from "./work-item-types";

// -------------------------- ISSUE TYPES --------------------------

export type TFetchIssueTypesPayload = {
  workspaceSlug: string;
};

export type TFetchIssueTypesProjectLevelPayload = TFetchIssueTypesPayload & {
  projectId: string;
};

export type TCreateIssueTypePayload = {
  workspaceSlug: string;
  projectId: string;
  data: Partial<TIssueType>;
};

export type TUpdateIssueTypePayload = {
  workspaceSlug: string;
  projectId?: string;
  issueTypeId?: string;
  data: Partial<TIssueType>;
};

export type TDeleteIssueTypePayload = {
  workspaceSlug: string;
  projectId: string;
  issueTypeId?: string;
};

export type TEnableIssueTypePayload = {
  workspaceSlug: string;
  projectId: string;
};

export type TDisableIssueTypePayload = {
  workspaceSlug: string;
  projectId: string;
  issueTypeId?: string;
};

export interface IWorkItemTypeInstanceServices {
  create?(payload: TCreateIssueTypePayload): Promise<TIssueType>;
  update?(payload: TUpdateIssueTypePayload): Promise<TIssueType>;
}

export interface IIssueTypesService extends IWorkItemTypeInstanceServices {
  fetchAll(payload: TFetchIssueTypesPayload): Promise<TIssueType[]>;
  fetchAllProjectLevel(payload: TFetchIssueTypesProjectLevelPayload): Promise<TIssueType[]>;
  deleteType?(payload: TDeleteIssueTypePayload): Promise<void>;
  enable?(payload: TEnableIssueTypePayload): Promise<TIssueType>;
  disable?(payload: TDisableIssueTypePayload): Promise<void>;
}

// -------------------------- ISSUE PROPERTIES --------------------------

export type TFetchIssuePropertiesPayload = {
  workspaceSlug: string;
  projectId?: string;
};

export type TCreateIssuePropertyPayload = {
  workspaceSlug: string;
  projectId?: string;
  issueTypeId?: string;
  data: TIssuePropertyPayload;
};

export type TUpdateIssuePropertyPayload = {
  workspaceSlug: string;
  projectId?: string;
  issueTypeId?: string;
  customPropertyId: string;
  data: TIssuePropertyPayload;
};

export type TDeleteIssuePropertyPayload = {
  workspaceSlug: string;
  projectId?: string;
  issueTypeId?: string;
  customPropertyId: string;
};

export interface ICustomPropertiesInstanceServices {
  create(payload: TCreateIssuePropertyPayload): Promise<TIssuePropertyResponse>;
  update(payload: TUpdateIssuePropertyPayload): Promise<TIssuePropertyResponse>;
  deleteProperty(payload: TDeleteIssuePropertyPayload): Promise<void>;
}

export interface IIssuePropertiesService extends ICustomPropertiesInstanceServices {
  fetchAll(payload: TFetchIssuePropertiesPayload): Promise<TIssueProperty<EIssuePropertyType>[]>;
}

// -------------------------- ISSUE PROPERTY OPTIONS --------------------------

export type TFetchIssuePropertyOptionsPayload = {
  workspaceSlug: string;
  projectId?: string;
};

export type TCreateIssuePropertyOptionPayload = {
  workspaceSlug: string;
  projectId?: string;
  customPropertyId: string;
  data: Partial<TIssuePropertyOption>;
};

export type TDeleteIssuePropertyOptionPayload = {
  workspaceSlug: string;
  projectId?: string;
  customPropertyId: string;
  issuePropertyOptionId: string;
};

export interface ICustomPropertyOptionsInstanceServices {
  create(payload: TCreateIssuePropertyOptionPayload): Promise<TIssuePropertyOption>;
  deleteOption(payload: TDeleteIssuePropertyOptionPayload): Promise<void>;
}

export interface IIssuePropertyOptionsService extends ICustomPropertyOptionsInstanceServices {
  fetchAll(payload: TFetchIssuePropertyOptionsPayload): Promise<TIssuePropertyOptionsPayload>;
}

// -------------------------- ISSUE TYPES SERVICES --------------------------

export type TIssueTypeStoreServices = {
  issueTypes?: IIssueTypesService;
  issueProperties: IIssuePropertiesService;
  issuePropertyOptions: IIssuePropertyOptionsService;
};

export interface ICustomPropertyStoreInstanceServices {
  customProperty: ICustomPropertiesInstanceServices;
  customPropertyOption: ICustomPropertyOptionsInstanceServices;
}

export interface IWorkItemTypeStoreInstanceServices extends ICustomPropertyStoreInstanceServices {
  workItemType: IWorkItemTypeInstanceServices;
}

// -------------------------- EPIC SERVICES --------------------------

export interface IEpicService {
  getIssueProgressAnalytics(workspaceSlug: string, projectId: string, issueId: string): Promise<TEpicAnalytics>;
  fetchEpicStats(workspaceSlug: string, projectId: string): Promise<TEpicStats[]>;
}
