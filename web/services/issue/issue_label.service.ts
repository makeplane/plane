import { API_BASE_URL } from "helpers/common.helper";
// services
import { APIService } from "services/api.service";
import { TrackEventService } from "services/track_event.service";
// types
import { IIssueLabels, IUser } from "types";

const trackEventServices = new TrackEventService();

export class IssueLabelService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getWorkspaceIssueLabels(workspaceSlug: string): Promise<IIssueLabels[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/labels/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getProjectIssueLabels(workspaceSlug: string, projectId: string): Promise<IIssueLabels[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-labels/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createIssueLabel(
    workspaceSlug: string,
    projectId: string,
    data: any,
    user: IUser | undefined
  ): Promise<IIssueLabels> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-labels/`, data)
      .then((response: { data: IIssueLabels; [key: string]: any }) => {
        trackEventServices.trackIssueLabelEvent(
          {
            workSpaceId: response?.data?.workspace_detail?.id,
            workSpaceName: response?.data?.workspace_detail?.name,
            workspaceSlug,
            projectId,
            projectIdentifier: response?.data?.project_detail?.identifier,
            projectName: response?.data?.project_detail?.name,
            labelId: response?.data?.id,
            color: response?.data?.color,
          },
          "ISSUE_LABEL_CREATE",
          user as IUser
        );
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async patchIssueLabel(
    workspaceSlug: string,
    projectId: string,
    labelId: string,
    data: any,
    user: IUser | undefined
  ): Promise<any> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-labels/${labelId}/`, data)
      .then((response) => {
        trackEventServices.trackIssueLabelEvent(
          {
            workSpaceId: response?.data?.workspace_detail?.id,
            workSpaceName: response?.data?.workspace_detail?.name,
            workspaceSlug,
            projectId,
            projectIdentifier: response?.data?.project_detail?.identifier,
            projectName: response?.data?.project_detail?.name,
            labelId: response?.data?.id,
            color: response?.data?.color,
          },
          "ISSUE_LABEL_UPDATE",
          user as IUser
        );
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteIssueLabel(
    workspaceSlug: string,
    projectId: string,
    labelId: string,
    user: IUser | undefined
  ): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/issue-labels/${labelId}/`)
      .then((response) => {
        trackEventServices.trackIssueLabelEvent(
          {
            workspaceSlug,
            projectId,
          },
          "ISSUE_LABEL_DELETE",
          user as IUser
        );
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
