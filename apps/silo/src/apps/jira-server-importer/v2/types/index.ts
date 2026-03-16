/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { JiraIssueField, JiraV2Service } from "@plane/etl/jira-server";
import type { Client as PlaneClient, TWorklog } from "@plane/sdk";
import type { TImportJob, TWorkspaceCredential } from "@plane/types";
import type { KNOWN_CUSTOM_FIELDS } from "../helpers/constants";
import type { Resolution } from "jira.js/out/version2/models";

export enum EJiraStep {
  // Pre-run
  PLANE_PROJECT_CREATION = "plane_project_creation",
  PLANE_PROJECT_CONFIGURATION = "plane_project_configuration",

  // Entities
  USERS = "users",
  STATES = "states",
  BOARDS = "boards",
  MODULES = "modules",
  CYCLES = "cycles",
  COMMENTS = "comments",
  RESOLUTIONS = "resolutions",
  ISSUE_TYPES = "issue_types",
  ISSUE_PROPERTIES = "issue_properties",
  DEFAULT_PROPERTIES = "default_properties",
  ISSUE_PROPERTY_OPTIONS = "issue_property_options",

  // Issues
  ISSUES = "issues",
  WAIT_FOR_CELERY = "wait_for_celery",

  // Relations
  RELATIONS = "relations",

  // Post Run
  TOGGLE_ISSUE_PROPERTIES = "toggle_issue_properties",
  CLEANUP_ISSUE_SEQUENCE = "cleanup_issue_sequence",
  SUMMARY = "summary",
}

export type TDefaultPropertyData = {
  resolutions?: Resolution[];
};

/**
 * Custom relation data extracted from unmapped Jira issue link types.
 * These become WorkItemRelationDefinition + IssueRelation with category="relation" in Plane.
 */
export type TCustomRelationData = {
  /** Jira issue link instance ID, used as external_id on IssueRelation */
  link_external_id: string;
  linked_issue_external_id: string;
  link_type: {
    id: string;
    name: string;
    outward: string;
    inward: string;
  };
  /**
   * True when the Jira link has inwardIssue (linked issue performs the inward
   * action on current → current needs to be placed as related_issue_id).
   *
   * In Plane's DB: issue_id shows outward label, related_issue_id shows inward label.
   * - current_is_outward=true  (inwardIssue link) → issue_id = linked, related_issue_id = current
   * - current_is_outward=false (outwardIssue link) → issue_id = current, related_issue_id = linked
   */
  current_is_outward: boolean;
};

/**
 * Issue relations data structure from storage
 */
export type TIssueRelationsData = {
  external_id: string;
  relationships: {
    parent?: string;
    blocking: string[];
    is_blocked_by: string[];
    relates_to: string[];
    duplicate_of: string;
    custom_relations: TCustomRelationData[];
  };
};

/**
 * Cross-project relation detected during import.
 * Stored as WorkspaceEntityConnection records for later resolution
 * when the other project is imported.
 *
 * Convention:
 * - "current" = the issue being imported right now
 * - "other" = the linked issue in a different Jira project
 * - relationType = relationship FROM current TO other
 *   (e.g., "parent" means "other is the parent of current")
 */
export type TCrossProjectRelation = {
  currentIssueId: string;
  currentIssueKey: string;
  otherIssueId: string;
  otherIssueKey: string;
  otherProjectKey: string;
  relationType: string; // parent, blocked_by, blocks, relates_to, duplicate, custom
  /** Present when relationType="custom" — carries the Jira link type metadata */
  linkType?: {
    id: string;
    name: string;
    outward: string;
    inward: string;
  };
  /** For custom relations: true when current issue is the outward side */
  currentIsOutward?: boolean;
  /** Jira issue link instance ID */
  linkId?: string;
};

export type TIssuesAssociationsData = {
  cycles: Map<string, string[]>;
  modules: Map<string, string[]>;
  worklogs: Map<string, Partial<TWorklog>[]>;
  subscribers: Map<string, string[]>;
};

export type TKnownFieldMapping = {
  name: keyof typeof KNOWN_CUSTOM_FIELDS;
  data: JiraIssueField;
};

/**
 * Failed step tracking structure
 */
export type TFailedStep = {
  name: string;
  error: string;
  failedAt: string;
};

export type TOrchestratorState = {
  jobId: string;

  // Step tracking
  currentStepIndex: number;
  currentStepName: string;
  totalSteps: number;
  completedSteps: string[];

  // Failed steps (logged and skipped)
  failedSteps?: TFailedStep[];

  // Timestamps
  startedAt: string;
  lastUpdatedAt: string;

  // Step execution context (for pagination)
  stepContext?: TStepExecutionContext;
};

export enum E_ADDITIONAL_STORAGE_KEYS {
  JIRA_RAW_FIELDS = "JIRA_RAW_FIELDS",
  JIRA_ISSUE_RELATIONS = "JIRA_ISSUE_RELATIONS",
  JIRA_KNOWN_FIELD_MAPPING = "JIRA_KNOWN_FIELD_MAPPING",
  JIRA_WORKSPACE_CONNECTION_ID = "JIRA_WORKSPACE_CONNECTION_ID",
}

/**
 * Stored board data for dependent steps
 */
export type TBoardData = Array<{
  id: number;
  name: string;
  type?: string;
}>;

/**
 * Issue Types data to store for dependent steps
 */
export type TIssueTypesData = Array<{
  id: string;
  external_id: string;
  name: string;
  is_epic: boolean;
  is_default: boolean;
}>;

/**
 * Issue properties data to store for dependent steps
 */
export type TIssuePropertiesData = Array<{
  id: string;
  external_id: string;
  display_name: string;
  property_type: string;
  relation_type?: string;
}>;

/**
 * Step interface - each entity type implements this
 */
export interface IStep {
  /** Step name (e.g., 'users', 'issues') */
  name: EJiraStep;

  /** data that should be loaded before handling this step */
  dependencies: EJiraStep[];
  stepRequired?: boolean;

  /** Execute pull, transform, and push for this step */
  execute(input: TStepExecutionInput): Promise<TStepExecutionContext>;
}

/**
 * Input provided to a step for execution
 */
export type TStepExecutionInput = {
  storage: IStorageService;
  jobContext: TJobContext;
  previousContext?: TStepExecutionContext;

  /**
   * Dependency data resolved by orchestrator
   * Key is the dependency step name, value is the data stored by that step
   *
   * @example
   * // Sprints step declares: dependencies = ["boards"]
   * // Orchestrator loads boards data and passes it here
   * dependencyData: {
   *   boards: { boards: [{ id: 1, name: "Board 1" }, ...] }
   * }
   */
  dependencyData?: Record<string, any>;
};

/**
 * Context returned after step execution
 */
export type TStepExecutionContext = {
  /** Pagination state */
  pageCtx: {
    startAt: number;
    hasMore: boolean;
    totalProcessed: number;
  };

  /** Execution results */
  results: {
    pulled: number;
    pushed: number;
    errors: Error[];
  };

  /*
   * This is going to be used for say, issue types and cycles, for example
   * to pull sprints, you need to fetch boards and boards provide you with
   * each sprint inside, hence we need to persist the board id and then use it
   * to fetch the sprints for that board and then move on to the next board
   */
  state?: {
    /** Current phase/stage of execution */
    phase?: string;

    /** Arbitrary data the step needs to persist */
    [key: string]: any;
  };
};

/**
 * Job context with credentials and clients
 */
export type TJobContext<TConfig = any> = {
  job: TImportJob<TConfig>;
  credentials: TWorkspaceCredential;
  planeClient: PlaneClient;
  sourceClient: JiraV2Service;
};

/**
 * Storage service for entity mapping operations
 */
export interface IStorageService {
  /** Lookup Plane IDs from external IDs */
  lookupMapping(jobId: string, entityType: string, externalIds: string[]): Promise<Map<string, string>>;

  /** Retrieve all entity mappings for an entity type */
  retrieveMapping(jobId: string, entityType: string): Promise<Map<string, string>>;

  /** Store entity mappings */
  storeMapping(
    jobId: string,
    entityType: string,
    mappings: Array<{ externalId: string; planeId: string }>
  ): Promise<void>;

  /** Store shared data from a step for dependent steps to use */
  storeData<T>(jobId: string, stepName: string, data: T[], deduplicateBy: string[]): Promise<void>;

  /** Get shared data from a step for dependent steps to use */
  retrieveData<T>(jobId: string, stepName: string): Promise<T | null>;
}

// /**
//  * Orchestrator interface
//  */
// export interface StepOrchestrator {
//   registerStep(step: Step): void;
//   startJob(jobId: string): Promise<void>;
//   handleStepCompletion(jobId: string, stepName: string, context: StepExecutionContext): Promise<void>;
//   cancelJob(jobId: string): Promise<void>;
// }
