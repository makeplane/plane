import { Client as PlaneClient, PlaneUser, UserResponsePayload } from "@plane/sdk";
import { protect } from "@/lib";
import { logger } from "@/logger";
import { AxiosError } from "axios";

/* ----------------------------- User Creation Utilities ----------------------------- */
export const createUsers = async (
  jobId: string,
  users: PlaneUser[],
  planeClient: PlaneClient,
  workspaceSlug: string,
  projectId: string
): Promise<PlaneUser[]> => {
  const createdUsers: UserResponsePayload[] = [];
  const createUserPromises = users.map(async (user) => {
    try {
      const createdUser: any = await protect(
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
        }
      );

      // Append the created user to the planeUsers
      createdUsers.push(createdUser);
    } catch (error) {
      // User already exists, and we can move ahead with creating other users
      if (
        error instanceof AxiosError &&
        (error.response?.status !== 400 || !error.response.data.error.includes("already exists"))
      ) {
        logger.error(`[${jobId.slice(0, 7)}] Error while creating the user: ${user.display_name}`, error);
      }

      console.log("Error while creating the user: ", user.display_name);
      console.log(error);
    }
  });

  await Promise.all(createUserPromises);
  return createdUsers;
};
