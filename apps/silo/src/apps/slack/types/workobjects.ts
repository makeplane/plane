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

import type {
  Client,
  ExIssue,
  ExIssueProperty,
  ExIssuePropertyOption,
  ExState,
  IssueWithExpanded,
  PlaneUser,
} from "@plane/sdk";

/* ------------------- INTERFACES ---------------------- */
export interface IIssueDetailService {
  getWorkItemDetails(
    planeClient: Client,
    ctx: TWorkItemDetailsCtx & { workspaceSlug: string }
  ): Promise<TWorkObjectIssueDetails>;
}

export interface IIssueWorkObjectViewService {
  getWorkItemView(
    workspaceSlug: string,
    issueDetails: TWorkObjectIssueDetails,
    config?: TWorkObjectViewConfig
  ): TWorkObjectView;
}

/* -------------------- TYPES -------------------------- */
export type TWorkObjectType = "MINIMAL" | "DETAILED"; // WHY NOT USE AN ENUM OVER HERE?

export enum EWorkObjectEntityType {
  FILE = "slack#/entities/file",
  TASK = "slack#/entities/task",
  ITEM = "slack#/entities/item",
  CONTENT_ITEM = "slack#/entities/content_item",
  INCIDENT = "slack#/entities/incident",
}

export type TWorkItemDetailsCtx =
  | { strategy: "sequence"; projectIdentifier: string; issueSequence: number }
  | { strategy: "id"; projectId: string; issueId: string };

export type TWorkObjectEntityPayloadAttributes = {
  title: {
    text: string;
    edit?: {
      enabled: boolean;
    };
  };
  // Display Information
  display_id?: string;
  display_type?: string;

  // Full Size Preview Information
  full_size_preview?: {
    is_supported: boolean;
    preview_url: string;
    mime_type: string;
    error: {
      code: "file_not_supported" | "file_size_exceeded" | "custom";
      message: string;
    };
  };
};

/**
 * Plain text object used in Slack UI elements
 */
export type TWorkObjectPlainText = {
  type: "plain_text";
  text: string;
  emoji?: boolean;
};

/**
 * Static option for select and multi-select inputs
 */
export type TWorkObjectStaticOption = {
  value: string;
  text: TWorkObjectPlainText;
  description?: TWorkObjectPlainText;
};

/**
 * Configuration for select and multi-select inputs
 */
export type TWorkObjectSelectConfig = {
  current_value?: string;
  current_values?: string[];
  static_options?: TWorkObjectStaticOption[];
  fetch_options_dynamically?: boolean;
};

/**
 * Configuration for number type fields
 */
export type TWorkObjectNumberConfig = {
  min_value?: number;
  max_value?: number;
};

/**
 * Configuration for text type fields
 */
export type TWorkObjectTextConfig = {
  min_length?: number;
  max_length?: number;
};

/**
 * Configuration for boolean type fields
 */
export type TWorkObjectBooleanConfig = {
  input_type?: "checkbox" | "radio" | "select";
};

/**
 * Edit configuration for work object fields
 */
export type TWorkObjectEditConfig = {
  enabled: boolean;
  placeholder?: TWorkObjectPlainText;
  hint?: TWorkObjectPlainText;
  optional?: boolean;
  select?: TWorkObjectSelectConfig;
  number?: TWorkObjectNumberConfig;
  text?: TWorkObjectTextConfig;
  boolean?: TWorkObjectBooleanConfig;
};

export type TWorkObjectUser = {
  user_id?: string;
  text?: string;
  url?: string;
  email?: string;
  icon?: TWorkObjectIcon;
};

export enum EWorkObjectFieldType {
  STRING = "string",
  INTEGER = "integer",
  BOOLEAN = "boolean",
  EMAIL = "email",
  LINK = "link",
  USER = "slack#/types/user",
  CHANNEL_ID = "slack#/types/channel_id",
  TIMESTAMP = "slack#/types/timestamp",
  DATE = "slack#/types/date",
  IMAGE = "slack#/types/image",
  ARRAY = "array",
}

export type TWorkObjectTagColor = "red" | "yellow" | "green" | "gray" | "blue";

export type TWorkObjectArrayFieldValue = { type: EWorkObjectFieldType.ARRAY } & (
  | { item_type: EWorkObjectFieldType.STRING; value: { value: string }[] }
  | { item_type: EWorkObjectFieldType.INTEGER; value: { value: number }[] }
  | { item_type: EWorkObjectFieldType.CHANNEL_ID; value: { value: string }[] }
  | { item_type: EWorkObjectFieldType.USER; value: { user: TWorkObjectUser }[] }
);

export type TWorkObjectIcon = {
  alt_text: string;
  url: string;
};

export type TWorkObjectFieldValue =
  /* --------------- String Types ---------------- */
  | ({
      type: EWorkObjectFieldType.STRING;
      value: string;
      link?: string;
      long?: boolean;
    } & (
      | { format?: "markdown" }
      | { type: EWorkObjectFieldType.STRING; value: string; tag_color?: TWorkObjectTagColor }
      | { type: EWorkObjectFieldType.STRING; value: string; icon?: TWorkObjectIcon }
    ))
  /* --------------- Other Types ---------------- */
  | { type: EWorkObjectFieldType.INTEGER; value: number }
  | { type: EWorkObjectFieldType.BOOLEAN; value: boolean }
  | { type: EWorkObjectFieldType.EMAIL; value: string }
  | { type: EWorkObjectFieldType.LINK; value: string }
  | { type: EWorkObjectFieldType.USER; user: TWorkObjectUser }
  | { type: EWorkObjectFieldType.CHANNEL_ID; value: string }
  | { type: EWorkObjectFieldType.TIMESTAMP; value: number }
  | { type: EWorkObjectFieldType.DATE; value: string }
  | { type: EWorkObjectFieldType.IMAGE; value: string }
  | TWorkObjectArrayFieldValue;

export type TWorkObjectField = {
  icon?: {
    icon_url?: string;
    unicode_emoji?: string;
  };
  edit?: TWorkObjectEditConfig;
};

export type TWorkObjectCustomFieldValue = {
  key: string;
  label: string;
  edit?: TWorkObjectEditConfig;
} & TWorkObjectFieldValue;

export type TWorkObjectAction = {
  text: string;
  action_id: string;
  value?: string;
  style?: "primary" | "danger";
  url?: string;
};

export type TWorkObjectEntityPayload = {
  attributes: TWorkObjectEntityPayloadAttributes;
  fields: Record<string, TWorkObjectField & TWorkObjectFieldValue>;
  custom_fields: Array<TWorkObjectField & TWorkObjectCustomFieldValue>;
  display_order: string[];
  actions?: {
    primary_actions: TWorkObjectAction[];
    overflow_actions: TWorkObjectAction[];
  };
};

export type TWorkObjectView = {
  app_unfurl_url?: string;
  url: string;
  external_ref: {
    id: string;
    type: string;
  };
  entity_type: EWorkObjectEntityType;
  entity_payload: TWorkObjectEntityPayload;
};

export type TWorkObjectViewConfig = {
  appUnfurlUrl?: string;
};

/**
 * Additional details that can be fetched for an issue work object
 * Each property here should have a corresponding fetcher in IssueDetailService
 */
export type TWorkObjectAdditionalIssueDetails = {
  propertyDetails?: {
    properties: ExIssueProperty[];
    propertyOptions: Map<string, ExIssuePropertyOption[]>;
    propertyValues: Map<string, { property_id: string; values: string[] }[]>;
  };
  availableStates?: ExState[];
  projectMembers?: PlaneUser[];

  // Issue Properties, that we need to show
  parent?: ExIssue;
};

export type TWorkObjectIssueDetails = IssueWithExpanded<
  ["state", "project", "assignees", "labels", "type", "created_by", "updated_by"]
> & {
  additionalDetails?: TWorkObjectAdditionalIssueDetails;
};

export type TWorkObjectContext = {
  planeCtx: {
    workspaceId: string;
    workspaceSlug: string;
  };
  planeClient: Client;
  userMap: {
    planeToSlack: Map<string, string>;
    slackToPlane: Map<string, string>;
  };
};
