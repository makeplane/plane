// plane types
import { API_BASE_URL } from "@plane/constants";
import { TUpdateComment, TUpdateReaction, TUpdate } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export interface IEpicUpdateService {
  createUpdate: (workspaceSlug: string, data: Partial<TUpdate>, projectId: string, epicId: string) => Promise<TUpdate>;
  patchUpdate: (
    workspaceSlug: string,
    updateId: string,
    data: Partial<TUpdate>,
    projectId: string,
    epicId: string
  ) => Promise<TUpdate>;
  getUpdates: (workspaceSlug: string, projectId: string, epicId: string) => Promise<TUpdate[]>;
  deleteUpdate: (workspaceSlug: string, updateId: string, projectId: string, epicId: string) => Promise<TUpdate>;
  getUpdateComments: (
    workspaceSlug: string,
    updateId: string,
    projectId: string,
    epicId: string
  ) => Promise<TUpdateComment[]>;
  createUpdateComment: (
    workspaceSlug: string,
    updateId: string,
    data: Partial<TUpdateComment>,
    projectId: string,
    epicId: string
  ) => Promise<TUpdateComment>;
  patchUpdateComment: (
    workspaceSlug: string,
    commentId: string,
    data: Partial<TUpdateComment>,
    projectId: string,
    epicId: string
  ) => Promise<void>;
  deleteUpdateComment: (workspaceSlug: string, commentId: string, projectId: string, epicId: string) => Promise<void>;
  createUpdateReaction: (
    workspaceSlug: string,
    updateId: string,
    data: Partial<TUpdateReaction>,
    projectId: string,
    epicId: string
  ) => Promise<TUpdateReaction>;
  deleteUpdateReaction: (
    workspaceSlug: string,
    updateId: string,
    reaction: string,
    projectId: string,
    epicId: string
  ) => Promise<void>;
}
export class EpicsUpdateService extends APIService implements IEpicUpdateService {
  constructor() {
    super(API_BASE_URL);
  }

  //   Updates
  async createUpdate(
    workspaceSlug: string,
    data: Partial<TUpdate>,
    projectId: string,
    epicId: string
  ): Promise<TUpdate> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/epics/${epicId}/updates/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async patchUpdate(
    workspaceSlug: string,
    updateId: string,
    data: Partial<TUpdate>,
    projectId: string,
    epicId: string
  ): Promise<TUpdate> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/epics/${epicId}/updates/${updateId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getUpdates(workspaceSlug: string, projectId: string, epicId: string): Promise<TUpdate[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/epics/${epicId}/updates/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteUpdate(workspaceSlug: string, updateId: string, projectId: string, epicId: string): Promise<TUpdate> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/epics/${epicId}/updates/${updateId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // Comments
  async getUpdateComments(
    workspaceSlug: string,
    updateId: string,
    projectId: string,
    epicId: string
  ): Promise<TUpdateComment[]> {
    return this.get(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/epics/${epicId}/updates/${updateId}/comments/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createUpdateComment(
    workspaceSlug: string,
    updateId: string,
    data: Partial<TUpdateComment>,
    projectId: string,
    epicId: string
  ): Promise<TUpdateComment> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/epics/${epicId}/updates/${updateId}/comments/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchUpdateComment(
    workspaceSlug: string,
    commentId: string,
    data: Partial<TUpdateComment>,
    projectId: string,
    epicId: string
  ): Promise<void> {
    return this.patch(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/epics/${epicId}/updates/${commentId}/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteUpdateComment(
    workspaceSlug: string,
    commentId: string,
    projectId: string,
    epicId: string
  ): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/epics/${epicId}/updates/${commentId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  //   Reactions
  async createUpdateReaction(
    workspaceSlug: string,
    updateId: string,
    data: Partial<TUpdateReaction>,
    projectId: string,
    epicId: string
  ): Promise<TUpdateReaction> {
    return this.post(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/epics/${epicId}/updates/${updateId}/reactions/`,
      data
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteUpdateReaction(
    workspaceSlug: string,
    updateId: string,
    reaction: string,
    projectId: string,
    epicId: string
  ): Promise<void> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/projects/${projectId}/epics/${epicId}/updates/${updateId}/reactions/${reaction}/`
    )
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
