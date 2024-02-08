import { APIService } from "services/api.service";
// types
import { TView } from "@plane/types";
import { TViewService } from "./types";
// helpers
import { API_BASE_URL } from "helpers/common.helper";

export class ProjectPublicViewService extends APIService implements TViewService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetch(workspaceSlug: string, projectId: string | undefined = undefined): Promise<TView[] | undefined> {
    if (!projectId) return undefined;
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async fetchById(
    workspaceSlug: string,
    viewId: string,
    projectId: string | undefined = undefined
  ): Promise<TView | undefined> {
    if (!projectId) return undefined;
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async create(
    workspaceSlug: string,
    data: Partial<TView>,
    projectId: string | undefined = undefined
  ): Promise<TView | undefined> {
    if (!projectId) return undefined;
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async update(
    workspaceSlug: string,
    viewId: string,
    data: Partial<TView>,
    projectId: string | undefined = undefined
  ): Promise<TView | undefined> {
    if (!projectId) return undefined;
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async remove(
    workspaceSlug: string,
    viewId: string,
    projectId: string | undefined = undefined
  ): Promise<void | undefined> {
    if (!projectId) return undefined;
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async lock(
    workspaceSlug: string,
    viewId: string,
    projectId: string | undefined = undefined
  ): Promise<TView | undefined> {
    if (!projectId) return undefined;
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/lock/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async unlock(
    workspaceSlug: string,
    viewId: string,
    projectId: string | undefined = undefined
  ): Promise<TView | undefined> {
    if (!projectId) return undefined;
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/lock/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async duplicate(
    workspaceSlug: string,
    viewId: string,
    projectId: string | undefined = undefined
  ): Promise<TView | undefined> {
    if (!projectId) return undefined;
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/duplicate/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async makeFavorite(
    workspaceSlug: string,
    viewId: string,
    projectId: string | undefined = undefined
  ): Promise<TView | undefined> {
    if (!projectId) return undefined;
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/favorite/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async removeFavorite(
    workspaceSlug: string,
    viewId: string,
    projectId: string | undefined = undefined
  ): Promise<TView | undefined> {
    if (!projectId) return undefined;
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/favorite/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}
