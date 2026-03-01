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

import { isAxiosError } from "axios";
import { logger } from "@plane/logger";
import type { ExIssueType, Client as PlaneClient } from "@plane/sdk";
import { processBatchPromises } from "@/helpers/methods";
import { protect } from "@/lib";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";
import { extractErrorMetadata } from "@/helpers/errors";

type TCreateOrUpdateIssueTypes = {
  jobId: string;
  issueTypes: Partial<ExIssueType>[];
  planeClient: PlaneClient;
  workspaceSlug: string;
  projectId: string;
  method: "create" | "update";
};

export const createOrUpdateIssueTypes = async (props: TCreateOrUpdateIssueTypes): Promise<ExIssueType[]> => {
  const { jobId, issueTypes, planeClient, workspaceSlug, projectId, method } = props;

  const createOrUpdateIssueType = async (issueType: Partial<ExIssueType>): Promise<ExIssueType | undefined> => {
    try {
      let createdUpdatedIssueType: ExIssueType | undefined;
      if (method === "create") {
        createdUpdatedIssueType = await protect(
          planeClient.issueType.create.bind(planeClient.issueType),
          workspaceSlug,
          projectId,
          issueType
        );
      } else {
        createdUpdatedIssueType = await protect(
          planeClient.issueType.update.bind(planeClient.issueType),
          workspaceSlug,
          projectId,
          issueType.id,
          issueType
        );
      }

      if (createdUpdatedIssueType) {
        executionLog.collect(jobId, {
          entity_type: EExecutionLogEntityType.ISSUE_TYPE,
          phase: method === "create" ? "CREATE_ISSUE_TYPE" : "UPDATE_ISSUE_TYPE",
          level: EExecutionLogLevel.SUCCESS,
          entity_external_id: issueType.external_id,
          entity_plane_id: createdUpdatedIssueType.id,
          entity_name: issueType.name,
          already_existed: method !== "create",
          additional_data: {
            isEpic: issueType.is_epic,
          },
        });
      }

      return createdUpdatedIssueType;
    } catch (error) {
      const isAxios = isAxiosError(error);
      // If the error is an axios error, check for the status
      if (isAxios) {
        if (error.response?.status === 409) {
          // refetch and issue type and return, the issue type
          const fetchedIssueType = await protect(
            planeClient.issueType.fetchById.bind(planeClient.issueType),
            workspaceSlug,
            projectId,
            error.response.data.id
          );

          if (fetchedIssueType) {
            executionLog.collect(jobId, {
              entity_type: EExecutionLogEntityType.ISSUE_TYPE,
              phase: method === "create" ? "CREATE_ISSUE_TYPE" : "UPDATE_ISSUE_TYPE",
              level: EExecutionLogLevel.SUCCESS,
              entity_external_id: issueType.external_id,
              already_existed: true,
              entity_plane_id: fetchedIssueType.id,
              entity_name: issueType.name,
            });
          }

          return fetchedIssueType;
        } else {
          logger.error(`Error while creating or updating the issue type: ${issueType.name}`, {
            jobId: jobId,
            error: error,
          });

          executionLog.collect(jobId, {
            entity_type: EExecutionLogEntityType.ISSUE_TYPE,
            phase: method === "create" ? "CREATE_ISSUE_TYPE" : "UPDATE_ISSUE_TYPE",
            level: EExecutionLogLevel.ERROR,
            error: extractErrorMetadata(error),
            entity_name: issueType.name,
            entity_external_id: issueType.external_id,
          });
        }
      } else {
        executionLog.collect(jobId, {
          entity_type: EExecutionLogEntityType.ISSUE_TYPE,
          phase: method === "create" ? "CREATE_ISSUE_TYPE" : "UPDATE_ISSUE_TYPE",
          level: EExecutionLogLevel.ERROR,
          error: extractErrorMetadata(error),
          entity_name: issueType.name,
          entity_external_id: issueType.external_id,
        });
      }

      return undefined;
    }
  };

  const createdUpdatedIssueTypes = await processBatchPromises(issueTypes, createOrUpdateIssueType, 2);

  return createdUpdatedIssueTypes.filter((issueType) => issueType !== undefined);
};
