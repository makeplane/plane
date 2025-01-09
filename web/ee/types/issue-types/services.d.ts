import {
  TIssueType,
  TIssueProperty,
  EIssuePropertyType,
  TIssuePropertyPayload,
  TIssuePropertyResponse,
  TIssuePropertyOption,
  TIssuePropertyOptionsPayload,
} from "@/plane-web/types";

// -------------------------- ISSUE TYPES --------------------------

export type TFetchIssueTypesPayload = {
  workspaceSlug: string;
};

export type TCreateIssueTypePayload = {
  workspaceSlug: string;
  projectId: string;
  data: Partial<TIssueType>;
};

export type TUpdateIssueTypePayload = {
  workspaceSlug: string;
  projectId: string;
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

export interface IIssueTypesService {
  fetchAll(payload: TFetchIssueTypesPayload): Promise<TIssueType[]>;
  create?(payload: TCreateIssueTypePayload): Promise<TIssueType>;
  update?(payload: TUpdateIssueTypePayload): Promise<TIssueType>;
  deleteType?(payload: TDeleteIssueTypePayload): Promise<void>;
  enable?(payload: TEnableIssueTypePayload): Promise<TIssueType>;
  disable?(payload: TDisableIssueTypePayload): Promise<void>;
}

// -------------------------- ISSUE PROPERTIES --------------------------

export type TFetchIssuePropertiesPayload = {
  workspaceSlug: string;
  projectId: string;
};

export type TCreateIssuePropertyPayload = {
  workspaceSlug: string;
  projectId: string;
  issueTypeId?: string;
  data: TIssuePropertyPayload;
};

export type TUpdateIssuePropertyPayload = {
  workspaceSlug: string;
  projectId: string;
  issueTypeId?: string;
  issuePropertyId: string;
  data: TIssuePropertyPayload;
};

export type TDeleteIssuePropertyPayload = {
  workspaceSlug: string;
  projectId: string;
  issueTypeId?: string;
  issuePropertyId: string;
};

export interface IIssuePropertiesService {
  fetchAll(payload: TFetchIssuePropertiesPayload): Promise<TIssueProperty<EIssuePropertyType>[]>;
  create(payload: TCreateIssuePropertyPayload): Promise<TIssuePropertyResponse>;
  update(payload: TUpdateIssuePropertyPayload): Promise<TIssuePropertyResponse>;
  deleteProperty(payload: TDeleteIssuePropertyPayload): Promise<void>;
}

// -------------------------- ISSUE PROPERTY OPTIONS --------------------------

export type TFetchIssuePropertyOptionsPayload = {
  workspaceSlug: string;
  projectId: string;
};

export type TCreateIssuePropertyOptionPayload = {
  workspaceSlug: string;
  projectId: string;
  issuePropertyId: string;
  data: Partial<TIssuePropertyOption>;
};

export type TDeleteIssuePropertyOptionPayload = {
  workspaceSlug: string;
  projectId: string;
  issuePropertyId: string;
  issuePropertyOptionId: string;
};

export interface IIssuePropertyOptionsService {
  fetchAll(payload: TFetchIssuePropertyOptionsPayload): Promise<TIssuePropertyOptionsPayload>;
  create(payload: TCreateIssuePropertyOptionPayload): Promise<TIssuePropertyOption>;
  deleteOption(payload: TDeleteIssuePropertyOptionPayload): Promise<void>;
}

// -------------------------- ISSUE TYPES SERVICES --------------------------

export type TIssueTypeStoreServices = {
  issueTypes: IIssueTypesService;
  issueProperties: IIssuePropertiesService;
  issuePropertyOptions: IIssuePropertyOptionsService;
};

// -------------------------- EPIC SERVICES --------------------------

export type TEpicAnalyticsGroup =
  | "backlog_issues"
  | "unstarted_issues"
  | "started_issues"
  | "completed_issues"
  | "cancelled_issues"
  | "overdue_issues";

export type TEpicAnalytics = {
  backlog_issues: number;
  unstarted_issues: number;
  started_issues: number;
  completed_issues: number;
  cancelled_issues: number;
  overdue_issues: number;
};

export interface IEpicService {
  getIssueProgressAnalytics(workspaceSlug: string, projectId: string, issueId: string): Promise<TEpicAnalytics>;
}
