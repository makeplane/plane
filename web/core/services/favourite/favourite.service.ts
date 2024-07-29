import type { IFavourite } from "@plane/types";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { APIService } from "@/services/api.service";
// types

export class FavouriteService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async addFavourite(workspaceSlug: string, data: Partial<IFavourite>): Promise<IFavourite> {
    console.log("addFavourite", data);
    return this.post(`/api/workspaces/${workspaceSlug}/user-favorites/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async updateFavourite(workspaceSlug: string, favouriteId: string, data: Partial<IFavourite>): Promise<IFavourite> {
    console.log("updateFavourite", data);
    return this.patch(`/api/workspaces/${workspaceSlug}/user-favorites/${favouriteId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteFavourite(workspaceSlug: string, favouriteId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/user-favorites/${favouriteId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async getFavourites(workspaceSlug: string): Promise<IFavourite[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/user-favorites/`, {
      params: {
        all: true,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getGroupedFavourites(workspaceSlug: string, favouriteId: string): Promise<IFavourite[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/user-favorites/${favouriteId}/group/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
