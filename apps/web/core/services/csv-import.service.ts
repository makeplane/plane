import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export interface ICSVValidationResponse {
  total_rows: number;
  valid_rows: any[];
  warnings: string[];
  total_valid: number;
  total_warnings: number;
}

export interface ICSVConfirmResponse {
  issues_created: number;
  tickets_created: number;
}

export class CSVImportService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async validateCSV(workspaceSlug: string, projectId: string, file: File): Promise<ICSVValidationResponse> {
    const formData = new FormData();
    formData.append("file", file);

    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/import/csv/validate/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async confirmImport(
    workspaceSlug: string,
    projectId: string,
    rows: any[],
    createSupportTickets: boolean
  ): Promise<ICSVConfirmResponse> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/import/csv/confirm/`, {
      rows,
      create_support_tickets: createSupportTickets,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
