import APIService from "services/api.service";
import trackEventServices from "services/track-event.service";

// types
import {
  IAppIntegration,
  ICurrentUserResponse,
  IImporterService,
  IWorkspaceIntegration,
  IExportServiceResponse,
} from "types";

import getConfig from "next/config";
const { publicRuntimeConfig: { NEXT_PUBLIC_API_BASE_URL } } = getConfig();

const trackEvent =
  process.env.NEXT_PUBLIC_TRACK_EVENTS === "true" || process.env.NEXT_PUBLIC_TRACK_EVENTS === "1";

class IntegrationService extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  async getAppIntegrationsList(): Promise<IAppIntegration[]> {
    return this.get(`/api/integrations/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getWorkspaceIntegrationsList(workspaceSlug: string): Promise<IWorkspaceIntegration[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/workspace-integrations/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteWorkspaceIntegration(workspaceSlug: string, integrationId: string): Promise<any> {
    return this.delete(
      `/api/workspaces/${workspaceSlug}/workspace-integrations/${integrationId}/provider/`
    )
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getImporterServicesList(workspaceSlug: string): Promise<IImporterService[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/importers/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  async getExportsServicesList(
    workspaceSlug: string,
    cursor: string,
    per_page: number
  ): Promise<IExportServiceResponse> {
    return this.get(`/api/workspaces/${workspaceSlug}/export-issues`, {
      params: {
        per_page,
        cursor,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteImporterService(
    workspaceSlug: string,
    service: string,
    importerId: string,
    user: ICurrentUserResponse | undefined
  ): Promise<any> {
    return this.delete(`/api/workspaces/${workspaceSlug}/importers/${service}/${importerId}/`)
      .then((response) => {
        const eventName = service === "github" ? "GITHUB_IMPORTER_DELETE" : "JIRA_IMPORTER_DELETE";

        if (trackEvent) trackEventServices.trackImporterEvent(response?.data, eventName, user);
        return response?.data;
      })
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new IntegrationService();
