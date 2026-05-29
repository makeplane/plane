import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";

export interface ISupportTicket {
  id: string;
  ticket_number: number;
  ticket_display: string;
  issue_id: string;
  issue_name: string;
  issue_description_html: string;
  issue_description_stripped: string;
  issue_priority: string;
  issue_state_id: string;
  issue_state_name: string;
  issue_state_group: string;
  issue_state_color: string;
  assignee_ids: string[];
  issue_start_date: string | null;
  issue_target_date: string | null;
  source: string;
  source_email: string | null;
  email_subject: string | null;
  project_id: string;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ISupportTicketCreate {
  title: string;
  description_html?: string;
  priority?: string;
  state_id?: string;
  assignee_ids?: string[];
  source?: string;
}

export class SupportTicketService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getTickets(workspaceSlug: string, projectId: string): Promise<ISupportTicket[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/support-tickets/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createTicket(workspaceSlug: string, projectId: string, data: ISupportTicketCreate): Promise<ISupportTicket> {
    return this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/support-tickets/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getTicketById(workspaceSlug: string, projectId: string, ticketId: string): Promise<ISupportTicket> {
    return this.get(`/api/workspaces/${workspaceSlug}/projects/${projectId}/support-tickets/${ticketId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateTicket(
    workspaceSlug: string,
    projectId: string,
    ticketId: string,
    data: Partial<ISupportTicketCreate>
  ): Promise<ISupportTicket> {
    return this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/support-tickets/${ticketId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteTicket(workspaceSlug: string, projectId: string, ticketId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/support-tickets/${ticketId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
