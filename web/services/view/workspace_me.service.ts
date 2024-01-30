import { APIService } from "services/api.service";
// types
import { TView } from "@plane/types";
import { TViewService } from "./types";
// helpers
import { API_BASE_URL } from "helpers/common.helper";

export class WorkspaceMeViewService extends APIService implements TViewService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetch(workspaceSlug: string): Promise<TView[]> {
    return this.get(`/api/users/me/workspaces/${workspaceSlug}/views/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async fetchById(workspaceSlug: string, viewId: string): Promise<TView> {
    return this.get(`/api/users/me/workspaces/${workspaceSlug}/views/${viewId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async create(workspaceSlug: string, data: Partial<TView>): Promise<TView> {
    return this.post(`/api/users/me/workspaces/${workspaceSlug}/views/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async update(workspaceSlug: string, viewId: string, data: Partial<TView>): Promise<TView> {
    return this.patch(`/api/users/me/workspaces/${workspaceSlug}/views/${viewId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async remove(workspaceSlug: string, viewId: string): Promise<void> {
    return this.delete(`/api/users/me/workspaces/${workspaceSlug}/views/${viewId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async lock(workspaceSlug: string, viewId: string): Promise<TView> {
    return this.post(`/api/users/me/workspaces/${workspaceSlug}/views/${viewId}/lock/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async unlock(workspaceSlug: string, viewId: string): Promise<TView> {
    return this.post(`/api/users/me/workspaces/${workspaceSlug}/views/${viewId}/unlock/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async duplicate(workspaceSlug: string, viewId: string): Promise<TView> {
    return this.post(`/api/users/me/workspaces/${workspaceSlug}/views/${viewId}/duplicate/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async makeFavorite(workspaceSlug: string, viewId: string): Promise<TView> {
    return this.post(`/api/users/me/workspaces/${workspaceSlug}/views/${viewId}/favorite/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async removeFavorite(workspaceSlug: string, viewId: string): Promise<TView> {
    return this.post(`/api/users/me/workspaces/${workspaceSlug}/views/${viewId}/unfavorite/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
