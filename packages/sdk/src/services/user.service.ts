import { APIService } from "@/services/api.service";
// types
import {
  ClientOptions,
  PlaneUser,
  UserCreatePayload,
  UserResponsePayload,
} from "@/types/types";

export class UserService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async create(
    workspaceSlug: string,
    projectId: string,
    payload: UserCreatePayload,
  ): Promise<UserResponsePayload> {
    return this.post(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/members/`,
      payload,
    )
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async list(workspaceSlug: string, projectId: string): Promise<PlaneUser[]> {
    return this.get(
      `/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/members/`,
    )
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }
}
