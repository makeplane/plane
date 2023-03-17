import APIService from "services/api.service";
// types
import { IAppIntegrations, IWorkspaceIntegrations, IProject } from "types";

const { NEXT_PUBLIC_API_BASE_URL } = process.env;

class WorkspaceIntegrationService extends APIService {
  constructor() {
    super(NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000");
  }

  // integration available and integration validation starts
  async listAllIntegrations(): Promise<IAppIntegrations[]> {
    return this.get(`/api/integrations/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async listWorkspaceIntegrations(workspaceSlug: string): Promise<IWorkspaceIntegrations[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/workspace-integrations/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
  // integration available and integration validation ends

  // listing all the projects under the workspace
  async listWorkspaceProjects(workspaceSlug: string): Promise<IProject[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // fetching the status of all the importers that initiated eg: GitHub...
  async fetchImportExportIntegrationStatus(workspaceSlug: string): Promise<any> {
    return this.get(`/api/workspaces/${workspaceSlug}/importers/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export default new WorkspaceIntegrationService();
