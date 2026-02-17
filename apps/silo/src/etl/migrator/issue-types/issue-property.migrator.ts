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

import { logger } from "@plane/logger";
import type { ExIssueProperty, ExIssueType, ExIssuePropertyOption, Client as PlaneClient } from "@plane/sdk";
import { processBatchPromises } from "@/helpers/methods";
import { protect } from "@/lib";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";
import { extractErrorMetadata } from "@/helpers/errors";

type TCreateOrUpdateIssueProperties = {
  jobId: string;
  issueTypesMap: Map<string, ExIssueType>;
  defaultIssueType: ExIssueType | undefined;
  issueProperties: Partial<ExIssueProperty>[];
  planeClient: PlaneClient;
  workspaceSlug: string;
  projectId: string;
  method: "create" | "update";
};

type TCreateOrUpdateIssuePropertiesOptions = {
  jobId: string;
  issuePropertyMap: Map<string, ExIssueProperty>;
  issuePropertiesOptions: Partial<ExIssuePropertyOption>[];
  planeClient: PlaneClient;
  workspaceSlug: string;
  projectId: string;
  method: "create" | "update";
};

export const createOrUpdateIssueProperties = async (
  props: TCreateOrUpdateIssueProperties
): Promise<ExIssueProperty[]> => {
  const { jobId, issueTypesMap, defaultIssueType, issueProperties, planeClient, workspaceSlug, projectId, method } =
    props;

  // Process a single issue property
  const processIssueProperty = async (
    issueProperty: Partial<ExIssueProperty>
  ): Promise<ExIssueProperty | undefined> => {
    try {
      const issueType = issueTypesMap.get(issueProperty.type_id || "") || defaultIssueType;
      if (!issueType) {
        logger.error(
          `[${jobId.slice(0, 7)}] Issue type not found for the issue property: ${issueProperty.display_name}`
        );

        executionLog.collect(jobId, {
          entity_type: EExecutionLogEntityType.ISSUE_PROPERTY,
          phase: method === "create" ? "CREATE_PROPERTY" : "UPDATE_PROPERTY",
          level: EExecutionLogLevel.ERROR,
          entity_name: issueProperty.display_name,
          entity_external_id: issueProperty.external_id,
          additional_data: {
            type_id: issueProperty.type_id,
            typesMap: issueTypesMap,
          },
          error: {
            message: "Issue Type not found for the issue property",
          },
        });

        return undefined;
      }

      issueProperty.type_id = issueType.id;

      let createdUpdatedIssueProperty: ExIssueProperty | undefined;

      if (method === "create") {
        createdUpdatedIssueProperty = await protect(
          planeClient.issueProperty.create.bind(planeClient.issueProperty),
          workspaceSlug,
          projectId,
          issueType.id,
          issueProperty
        );
      } else {
        createdUpdatedIssueProperty = await protect(
          planeClient.issueProperty.update.bind(planeClient.issueProperty),
          workspaceSlug,
          projectId,
          issueType.id,
          issueProperty.id,
          issueProperty
        );
      }

      if (createdUpdatedIssueProperty) {
        executionLog.collect(jobId, {
          entity_type: EExecutionLogEntityType.ISSUE_PROPERTY,
          phase: method === "create" ? "CREATE_PROPERTY" : "UPDATE_PROPERTY",
          level: EExecutionLogLevel.SUCCESS,
          entity_external_id: issueProperty.external_id,
          entity_plane_id: createdUpdatedIssueProperty.id,
          entity_name: issueProperty.display_name,
          already_existed: method !== "create",
          additional_data: {
            propertyType: issueProperty.property_type,
          },
        });
      }

      return createdUpdatedIssueProperty;
    } catch (error) {
      logger.error(
        `Error while ${method === "create" ? "creating" : "updating"} the issue property: ${issueProperty.display_name}`,
        {
          jobId: jobId,
          error: error,
        }
      );

      executionLog.collect(jobId, {
        entity_type: EExecutionLogEntityType.ISSUE_PROPERTY,
        phase: method === "create" ? "CREATE_PROPERTY" : "UPDATE_PROPERTY",
        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
        entity_external_id: issueProperty.external_id,
        entity_name: issueProperty.display_name,
      });

      return undefined;
    }
  };

  // Process all issue properties in batches of 5
  const createdUpdatedIssueProperties = await processBatchPromises(issueProperties, processIssueProperty, 2);

  return createdUpdatedIssueProperties.filter((property) => property !== undefined);
};

export const createOrUpdateIssuePropertiesOptions = async (
  props: TCreateOrUpdateIssuePropertiesOptions
): Promise<ExIssuePropertyOption[]> => {
  const { jobId, issuePropertyMap, issuePropertiesOptions, planeClient, workspaceSlug, projectId, method } = props;

  const processIssuePropertyOption = async (
    issuePropertyOption: Partial<ExIssuePropertyOption>
  ): Promise<ExIssuePropertyOption | undefined> => {
    let createdUpdatedIssuePropertyOption: ExIssuePropertyOption | undefined;
    try {
      const issueProperty = issuePropertyMap.get(issuePropertyOption.property_id || "");
      if (!issueProperty) {
        logger.error(
          `[${jobId.slice(0, 7)}] Issue property not found for the issue property option: ${issuePropertyOption.name}`
        );

        executionLog.collect(jobId, {
          entity_type: EExecutionLogEntityType.ISSUE_PROPERTY_OPTION,
          phase: method === "create" ? "CREATE_OPTION" : "UPDATE_OPTION",
          level: EExecutionLogLevel.ERROR,
          entity_name: issuePropertyOption.name,
          entity_external_id: issuePropertyOption.external_id,
          additional_data: {
            issuePropertyMap,
          },
          error: {
            message: "Issue property not found for the issue property option",
          },
        });

        return undefined;
      }

      if (method === "create") {
        createdUpdatedIssuePropertyOption = await protect(
          planeClient.issuePropertyOption.create.bind(planeClient.issuePropertyOption),
          workspaceSlug,
          projectId,
          issueProperty.id,
          issuePropertyOption
        );
      } else {
        createdUpdatedIssuePropertyOption = await protect(
          planeClient.issuePropertyOption.update.bind(planeClient.issuePropertyOption),
          workspaceSlug,
          projectId,
          issueProperty.id,
          issuePropertyOption.id,
          issuePropertyOption
        );
      }

      if (createdUpdatedIssuePropertyOption) {
        executionLog.collect(jobId, {
          entity_type: EExecutionLogEntityType.ISSUE_PROPERTY_OPTION,
          phase: method === "create" ? "CREATE_OPTION" : "UPDATE_OPTION",
          level: EExecutionLogLevel.SUCCESS,
          entity_external_id: issuePropertyOption.external_id,
          entity_plane_id: createdUpdatedIssuePropertyOption.id,
          already_existed: method !== "create",
          entity_name: issuePropertyOption.name,
        });
      }

      return createdUpdatedIssuePropertyOption;
    } catch (error) {
      logger.error(
        `Error while ${method === "create" ? "creating" : "updating"} the issue property option: ${issuePropertyOption.name}`,
        {
          jobId: jobId,
          error: {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : undefined,
          },
        }
      );

      executionLog.collect(jobId, {
        entity_type: EExecutionLogEntityType.ISSUE_PROPERTY_OPTION,
        phase: method === "create" ? "CREATE_OPTION" : "UPDATE_OPTION",
        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
        entity_name: issuePropertyOption.name,
        entity_external_id: issuePropertyOption.external_id,
      });

      return undefined;
    }
  };

  const createdUpdatedIssuePropertiesOptions = await processBatchPromises(
    issuePropertiesOptions,
    processIssuePropertyOption,
    2
  );

  return createdUpdatedIssuePropertiesOptions.filter((option) => option !== undefined);
};
