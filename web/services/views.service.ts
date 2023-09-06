// services
import APIService from "services/api.service";
import trackEventServices from "services/track-event.service";
import { ICurrentUserResponse } from "types";

// types
import { IView } from "types/views";

import getConfig from "next/config";
const { publicRuntimeConfig: { NEXT_PUBLIC_API_BASE_URL } } = getConfig();

const trackEvent =
  process.env.NEXT_PUBLIC_TRACK_EVENTS === "true" || process.env.NEXT_PUBLIC_TRACK_EVENTS === "1";

class ViewServices extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async createView(
    workspaceSlug: string,
    projectId: string,
    data: IView,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/`, data)
      .then((response) => {
        if (trackEvent) trackEventServices.trackViewEvent(response?.data, "VIEW_CREATE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateView(
    workspaceSlug: string,
    projectId: string,
    viewId: string,
    data: IView,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.put(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/`, data)
      .then((response) => {
        if (trackEvent) trackEventServices.trackViewEvent(response?.data, "VIEW_UPDATE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchView(
    workspaceSlug: string,
    projectId: string,
    viewId: string,
    data: Partial<IView>,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/`,
      data
    )
      .then((response) => {
        if (trackEvent) trackEventServices.trackViewEvent(response?.data, "VIEW_UPDATE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteView(
    workspaceSlug: string,
    projectId: string,
    viewId: string,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/`)
      .then((response) => {
        if (trackEvent) trackEventServices.trackViewEvent(response?.data, "VIEW_DELETE", user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getViews(workspaceSlug: string, projectId: string): Promise<IView[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getViewDetails(workspaceSlug: string, projectId: string, viewId: string): Promise<IView> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getViewIssues(workspaceSlug: string, projectId: string, viewId: string): Promise<any> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/views/${viewId}/issues/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async addViewToFavorites(
    workspaceSlug: string,
    projectId: string,
    data: {
      view: string;
    }
  ): Promise<any> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/user-favorite-views/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async removeViewFromFavorites(
    workspaceSlug: string,
    projectId: string,
    viewId: string
  ): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/user-favorite-views/${viewId}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new ViewServices();
