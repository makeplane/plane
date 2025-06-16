import { AxiosError } from "axios";
import { Client as PlaneClient, PlaneUser, UserResponsePayload } from "@plane/sdk";
import { TWorkspaceCredential } from "@plane/types";
import { processBatchPromises } from "@/helpers/methods";
import { downloadFile, uploadFile } from "@/helpers/utils";
import { protect } from "@/lib";
import { logger } from "@/logger";
import { generateFileUploadPayload } from "./issues.migrator";

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
              const response = await planeClient.users.getAvatarUploadAvatar(user.display_name, blob.size, entityType);
              const data = generateFileUploadPayload(response.upload_data, blob, user.display_name);
              const upload = await uploadFile({
                url: response.upload_data.url,
                data: data,
              });

              if (upload) {
                avatarId = response.asset_id;
                await planeClient.users.markAvatarAsUploaded(avatarId);
              }
            } catch (error) {
              logger.error(`Error while uploading avatar: ${user.display_name}`);
            }
          }
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

      return createdUser;
    } catch (error) {
      logger.error(`[${jobId.slice(0, 7)}] Error while creating the user: ${user.display_name}`);
      return undefined;
    }
  };

  const createdUsers = await processBatchPromises(users, createOrUpdateUser, 5);
  return createdUsers?.filter((user) => user !== undefined) ?? [];
};
