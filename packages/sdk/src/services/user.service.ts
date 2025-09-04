import { APIService } from "@/services/api.service";
// types
import { ClientOptions, PlaneUser, UploadData, UserCreatePayload, UserResponsePayload } from "@/types/types";

export type TTempPlaneUser = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar: string;
  avatar_url: string;
  display_name: string;
};

export class UserService extends APIService {
  constructor(options: ClientOptions) {
    super(options);
  }

  async getAvatarUploadAvatar(
    name: string,
    size: number,
    type: string
  ): Promise<{
    upload_data: UploadData;
    asset_id: string;
    asset_url: string;
  }> {
    return this.post(`/api/v1/assets/user-assets/server/`, {
      name,
      size,
      type,
      entity_type: "USER_AVATAR",
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async markAvatarAsUploaded(assetId: string) {
    return this.patch(`/api/v1/assets/user-assets/${assetId}/server/`, {
      is_uploaded: true,
      entity_type: "USER_AVATAR",
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async create(workspaceSlug: string, projectId: string, payload: UserCreatePayload): Promise<UserResponsePayload> {
    return this.post(`/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/members/`, payload)
      .then((response) => response.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async currentUser(): Promise<PlaneUser> {
    const data = await this.get("/api/v1/users/me/");
    const tempUser: TTempPlaneUser = data.data;
    return {
      id: tempUser.id,
      first_name: tempUser.first_name,
      last_name: tempUser.last_name,
      email: tempUser.email,
      role: 15,
      avatar: tempUser.avatar,
      display_name: tempUser.display_name,
    };
  }

  async list(workspaceSlug: string, projectId: string): Promise<PlaneUser[]> {
    return this.get(`/api/v1/workspaces/${workspaceSlug}/projects/${projectId}/members/`)
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }

  async listAllUsers(workspaceSlug: string): Promise<PlaneUser[]> {
    return this.get(`/api/v1/workspaces/${workspaceSlug}/members/`)
      .then((response) => response.data)
      .catch((error) => {
        console.log(error);
        throw error?.response?.data;
      });
  }
}
