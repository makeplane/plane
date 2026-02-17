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
import type { Client as PlaneClient, PlaneUser, UserResponsePayload } from "@plane/sdk";
import type { TWorkspaceCredential } from "@plane/types";
import { processBatchPromises } from "@/helpers/methods";
import { downloadFile, uploadFile } from "@/helpers/utils";
import { protect } from "@/lib";
import { generateFileUploadPayload } from "./issues.migrator";
import { executionLog } from "@/lib/execution-log/service/execution-log.service";
import { EExecutionLogLevel, EExecutionLogEntityType } from "@/lib/execution-log/types";
import { extractErrorMetadata } from "@/helpers/errors";

/* ----------------------------- User Creation Utilities ----------------------------- */
export const createUsers = async (
  jobId: string,
  users: PlaneUser[],
  planeClient: PlaneClient,
  credentials: TWorkspaceCredential,
  workspaceSlug: string,
  projectId: string
): Promise<PlaneUser[]> => {
  const createOrUpdateUser = async (user: PlaneUser) => {
    try {
      let avatarId;

      if (user.avatar) {
        try {
          const blob = await downloadFile(user.avatar, `Bearer ${credentials.source_access_token}`);
          if (blob) {
            const entityType = blob.type.split(";")[0];
            if (
              entityType === "image/jpeg" ||
              entityType === "image/png" ||
              entityType === "image/gif" ||
              entityType === "image/jpg"
            ) {
              try {
                const response = await planeClient.users.getAvatarUploadAvatar(
                  user.display_name,
                  blob.size,
                  entityType
                );
                const data = generateFileUploadPayload(response.upload_data, blob, user.display_name);
                const upload = await uploadFile({
                  url: response.upload_data.url,
                  data: data,
                });

                if (upload) {
                  avatarId = response.asset_id;
                  await planeClient.users.markAvatarAsUploaded(avatarId);

                  executionLog.collect(jobId, {
                    entity_type: EExecutionLogEntityType.USER,
                    phase: "UPLOAD_AVATAR",
                    level: EExecutionLogLevel.SUCCESS,
                    entity_external_id: user.email,
                  });
                }
              } catch (error) {
                logger.error(`Error while uploading avatar: ${user.display_name}`);

                executionLog.collect(jobId, {
                  entity_type: EExecutionLogEntityType.USER,
                  phase: "UPLOAD_AVATAR",
                  ignore_summarization: true,
                  level: EExecutionLogLevel.ERROR,
                  entity_external_id: user.id,
                  error: extractErrorMetadata(error),
                });
              }
            }
          }
        } catch (error) {
          executionLog.collect(jobId, {
            entity_type: EExecutionLogEntityType.USER,
            phase: "UPLOAD_AVATAR",
            ignore_summarization: true,
            level: EExecutionLogLevel.ERROR,
            entity_external_id: user.id,
            error: extractErrorMetadata(error),
          });
        }
      }

      const createdUser: UserResponsePayload = await protect(
        planeClient.users.create.bind(planeClient.users),
        workspaceSlug,
        projectId,
        {
          // The display name of the user is assumed to be the equivalent of the
          // source username, as it will be used to identify the user in the workspace
          display_name: user.display_name ?? "",
          email: user.email ?? "",
          first_name: user.first_name ?? "",
          last_name: user.last_name ?? "",
          role: user.role ?? 10,
          avatar_asset_id: avatarId,
        }
      );

      executionLog.collect(jobId, {
        entity_type: EExecutionLogEntityType.USER,
        phase: "CREATE_USER",
        level: EExecutionLogLevel.SUCCESS,
        entity_external_id: user.email,
        entity_plane_id: createdUser.id,
        entity_name: createdUser.display_name,
      });

      return createdUser;
    } catch (error) {
      logger.error(`Error while creating the user: ${user.display_name}`, {
        jobId: jobId,
        error: error,
      });

      executionLog.collect(jobId, {
        entity_type: EExecutionLogEntityType.USER,
        phase: "CREATE_USER",
        level: EExecutionLogLevel.ERROR,
        error: extractErrorMetadata(error),
        entity_external_id: user.email,
      });

      return undefined;
    }
  };

  const createdUsers = await processBatchPromises(users, createOrUpdateUser, 2);
  const allCreatedUsers = createdUsers?.filter((user) => user !== undefined) ?? [];

  return allCreatedUsers;
};
