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

/**
 * @fileoverview
 * This file includes the types required by the summary function, which includes
 * types for each summary record
 */
/**
 * Classification of summary records based on their purpose
 */
export enum EExecutionLogLevel {
  INFO = "info",
  SUCCESS = "success",
  ERROR = "error",
}

export enum EExecutionLogEntityType {
  BOARDS = "BOARDS",
  PROJECT = "PROJECT",
  USER = "USER",
  CYCLE = "CYCLE",
  MODULE = "MODULE",
  WORK_ITEM = "WORK_ITEM",
  SUBSCRIBERS = "WORK_ITEM_SUBSCRIBERS",
  RELEASE = "RELEASE",
  WORK_LOG = "WORK_LOG",
  WORK_ITEM_ATTACHMENT = "WORK_ITEM_ATTACHMENT",
  WORK_ITEM_COMMENT = "WORK_ITEM_COMMENT",
  WORK_ITEM_RELATIONS = "WORK_ITEM_RELATIONS",
  WORK_ITEM_COMMENT_ATTACHMENT = "WORK_ITEM_COMMENT_ATTACHMENT",
  WORK_ITEM_LINK = "WORK_ITEM_LINK",
  ISSUE_TYPE = "ISSUE_TYPE",
  ISSUE_PROPERTY = "ISSUE_PROPERTY",
  ISSUE_DEFAULT_PROPERTY = "ISSUE_DEFAULT_PROPERTY",
  ISSUE_PROPERTY_OPTION = "ISSUE_PROPERTY_OPTION",
  ISSUE_PROPERTY_VALUE = "ISSUE_PROPERTY_VALUE",
}

export type TExecutionSummaryTable = {
  [recordType: string]: {
    total: number;
    pulled: number;
    created: number;
    alreadyExisted: number;
    errors: number;
  };
};

/*
 * A single summary record that represents an operation being successfull or meta or errored out,
 * with all the supporting metadata required.
 */
export type TExecutionLogRecord = {
  /* The step at which the record was created */
  entity_type: EExecutionLogEntityType;

  /* Say if there is a log that we wish to completely ignore in the summarization, like configuration or something, we can use this flag.
   */
  ignore_summarization?: boolean;

  /* While collecting the record, you can also add a phase, if that supports like while pulling issues, something went wrong */
  phase?: string;
  related_entity?: string;
  related_entity_type?: EExecutionLogEntityType;
  additional_data?: object;

  /*
   * Metadata of the supporting record, it can be,
   * 1. Info -> Where you can collect meta information like count of issues, any payload, like supports
   * 2. Success -> Success record represents, an operation successfully going through, like import success, there you can collect ids, as what entity was created as what
   * 3. Error -> Error record represents, an errored out operation, the most crucial one where you can add the supporting metadata that is required by the end user
   */
} & (
  | {
      level: EExecutionLogLevel.INFO;
      metrics?: {
        total?: number;
        pulled?: number;
        imported?: number;
        errored?: number;
        already_existed?: number;
      };
    }
  | {
      level: EExecutionLogLevel.SUCCESS;
      entity_name?: string;
      entity_plane_id?: string;
      entity_external_id?: string;
      already_existed?: boolean;
    }
  | {
      level: EExecutionLogLevel.ERROR;

      entity_name?: string;
      entity_plane_id?: string;
      entity_external_id?: string;
      already_existed?: boolean;

      is_fatal?: boolean;
      error?: {
        message?: string;
        status_code?: number;
        payload?: object;
        metadata?: object;
      };
    }
);
