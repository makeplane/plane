/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@workspaces/constants";
// api services
import { APIService } from "@/services/api.service";
// local imports
import type {
  TBootstrapResult,
  TDeliveryAnalytics,
  TDeployment,
  TDeploymentPayload,
  TDeveloperDashboard,
  TDevOpsDashboard,
  TMissingWorkLogs,
  TOperationsRecord,
  TOperationsRecordPayload,
  TOperationsReport,
  TOperationsSettings,
  TOperationsTicket,
  TOperationsTicketActivity,
  TOperationsTicketComment,
  TOperationsTicketConversion,
  TOperationsTicketPayload,
  TOperationsTicketStatus,
  TPaginated,
  TPMDashboard,
  TProductivityAnalytics,
  TQADashboard,
  TQualityAnalytics,
  TReportType,
  TTeamAnalytics,
  TTeamAvailability,
  TWorkLog,
  TWorkLogPayload,
} from "./types";

export type TQuery = Record<string, string | number | boolean | undefined>;

/** Drop empty values so `?project_id=` never reaches the API as a filter. */
const clean = (query?: TQuery): TQuery => {
  if (!query) return {};
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== "" && value !== null)
  );
};

/**
 * One client for the whole Engineering Operations surface.
 *
 * Split into sections that mirror the URL file on the Django side rather than
 * into a class per resource: these endpoints are always used together (a
 * dashboard reads tickets and work logs; a report reads everything), and eight
 * near-identical service classes would be eight places to keep the base URL in
 * step.
 */
export class OperationsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  private unwrap<T>(promise: Promise<{ data: T }>): Promise<T> {
    return promise
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data ?? error;
      });
  }

  // ------------------------------------------------------------------ Work logs

  async getWorkLogs(workspaceSlug: string, query?: TQuery): Promise<TPaginated<TWorkLog>> {
    return this.unwrap(this.get(`/api/workspaces/${workspaceSlug}/work-logs/`, { params: clean(query) }));
  }

  /** Today's log for the signed-in user, created as a draft if absent. */
  async getMyWorkLog(workspaceSlug: string, date?: string): Promise<TWorkLog> {
    return this.unwrap(this.get(`/api/workspaces/${workspaceSlug}/work-logs/me/`, { params: clean({ date }) }));
  }

  async createWorkLog(workspaceSlug: string, data: TWorkLogPayload): Promise<TWorkLog> {
    return this.unwrap(this.post(`/api/workspaces/${workspaceSlug}/work-logs/`, data));
  }

  async updateWorkLog(workspaceSlug: string, workLogId: string, data: TWorkLogPayload): Promise<TWorkLog> {
    return this.unwrap(this.patch(`/api/workspaces/${workspaceSlug}/work-logs/${workLogId}/`, data));
  }

  async submitWorkLog(workspaceSlug: string, workLogId: string, reopen = false): Promise<TWorkLog> {
    return this.unwrap(this.post(`/api/workspaces/${workspaceSlug}/work-logs/${workLogId}/submit/`, { reopen }));
  }

  async deleteWorkLog(workspaceSlug: string, workLogId: string): Promise<void> {
    return this.unwrap(this.delete(`/api/workspaces/${workspaceSlug}/work-logs/${workLogId}/`));
  }

  async getMissingWorkLogs(workspaceSlug: string, query?: TQuery): Promise<TMissingWorkLogs> {
    return this.unwrap(this.get(`/api/workspaces/${workspaceSlug}/work-logs/missing/`, { params: clean(query) }));
  }

  // ---------------------------------------------------------- Operations tickets

  async getTickets(workspaceSlug: string, query?: TQuery): Promise<TPaginated<TOperationsTicket>> {
    return this.unwrap(this.get(`/api/workspaces/${workspaceSlug}/operations-tickets/`, { params: clean(query) }));
  }

  async getTicket(workspaceSlug: string, ticketId: string): Promise<TOperationsTicket> {
    return this.unwrap(this.get(`/api/workspaces/${workspaceSlug}/operations-tickets/${ticketId}/`));
  }

  async createTicket(workspaceSlug: string, data: TOperationsTicketPayload): Promise<TOperationsTicket> {
    return this.unwrap(this.post(`/api/workspaces/${workspaceSlug}/operations-tickets/`, data));
  }

  async updateTicket(
    workspaceSlug: string,
    ticketId: string,
    data: TOperationsTicketPayload
  ): Promise<TOperationsTicket> {
    return this.unwrap(this.patch(`/api/workspaces/${workspaceSlug}/operations-tickets/${ticketId}/`, data));
  }

  async deleteTicket(workspaceSlug: string, ticketId: string): Promise<void> {
    return this.unwrap(this.delete(`/api/workspaces/${workspaceSlug}/operations-tickets/${ticketId}/`));
  }

  /** Move a ticket through its lifecycle. The API refuses illegal moves. */
  async transitionTicket(
    workspaceSlug: string,
    ticketId: string,
    status: TOperationsTicketStatus,
    comment?: string
  ): Promise<TOperationsTicket> {
    return this.unwrap(
      this.post(`/api/workspaces/${workspaceSlug}/operations-tickets/${ticketId}/transition/`, { status, comment })
    );
  }

  async convertTicket(
    workspaceSlug: string,
    ticketId: string,
    data: { project_id: string; module_id?: string; issue_type_id?: string }
  ): Promise<TOperationsTicketConversion> {
    return this.unwrap(this.post(`/api/workspaces/${workspaceSlug}/operations-tickets/${ticketId}/convert/`, data));
  }

  async getTicketComments(workspaceSlug: string, ticketId: string): Promise<TOperationsTicketComment[]> {
    return this.unwrap(this.get(`/api/workspaces/${workspaceSlug}/operations-tickets/${ticketId}/comments/`));
  }

  async createTicketComment(
    workspaceSlug: string,
    ticketId: string,
    commentHtml: string
  ): Promise<TOperationsTicketComment> {
    return this.unwrap(
      this.post(`/api/workspaces/${workspaceSlug}/operations-tickets/${ticketId}/comments/`, {
        comment_html: commentHtml,
      })
    );
  }

  async getTicketActivities(workspaceSlug: string, ticketId: string): Promise<TOperationsTicketActivity[]> {
    return this.unwrap(this.get(`/api/workspaces/${workspaceSlug}/operations-tickets/${ticketId}/activities/`));
  }

  // -------------------------------------------------------------------- Records

  async getRecords(workspaceSlug: string, query?: TQuery): Promise<TPaginated<TOperationsRecord>> {
    return this.unwrap(this.get(`/api/workspaces/${workspaceSlug}/operations-records/`, { params: clean(query) }));
  }

  async getRecord(workspaceSlug: string, recordId: string): Promise<TOperationsRecord> {
    return this.unwrap(this.get(`/api/workspaces/${workspaceSlug}/operations-records/${recordId}/`));
  }

  async createRecord(workspaceSlug: string, data: TOperationsRecordPayload): Promise<TOperationsRecord> {
    return this.unwrap(this.post(`/api/workspaces/${workspaceSlug}/operations-records/`, data));
  }

  async updateRecord(
    workspaceSlug: string,
    recordId: string,
    data: TOperationsRecordPayload
  ): Promise<TOperationsRecord> {
    return this.unwrap(this.patch(`/api/workspaces/${workspaceSlug}/operations-records/${recordId}/`, data));
  }

  async deleteRecord(workspaceSlug: string, recordId: string): Promise<void> {
    return this.unwrap(this.delete(`/api/workspaces/${workspaceSlug}/operations-records/${recordId}/`));
  }

  // ---------------------------------------------------------------- Deployments

  async getDeployments(workspaceSlug: string, query?: TQuery): Promise<TPaginated<TDeployment>> {
    return this.unwrap(this.get(`/api/workspaces/${workspaceSlug}/deployments/`, { params: clean(query) }));
  }

  async createDeployment(workspaceSlug: string, projectId: string, data: TDeploymentPayload): Promise<TDeployment> {
    return this.unwrap(this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/deployments/`, data));
  }

  async updateDeployment(
    workspaceSlug: string,
    projectId: string,
    deploymentId: string,
    data: TDeploymentPayload
  ): Promise<TDeployment> {
    return this.unwrap(
      this.patch(`/api/workspaces/${workspaceSlug}/projects/${projectId}/deployments/${deploymentId}/`, data)
    );
  }

  async deleteDeployment(workspaceSlug: string, projectId: string, deploymentId: string): Promise<void> {
    return this.unwrap(
      this.delete(`/api/workspaces/${workspaceSlug}/projects/${projectId}/deployments/${deploymentId}/`)
    );
  }

  // ----------------------------------------------------------------- Dashboards

  async getPMDashboard(workspaceSlug: string, query?: TQuery): Promise<TPMDashboard> {
    return this.unwrap(
      this.get(`/api/workspaces/${workspaceSlug}/operations/dashboards/pm/`, { params: clean(query) })
    );
  }

  async getDeveloperDashboard(workspaceSlug: string, query?: TQuery): Promise<TDeveloperDashboard> {
    return this.unwrap(
      this.get(`/api/workspaces/${workspaceSlug}/operations/dashboards/developer/`, { params: clean(query) })
    );
  }

  async getQADashboard(workspaceSlug: string, query?: TQuery): Promise<TQADashboard> {
    return this.unwrap(
      this.get(`/api/workspaces/${workspaceSlug}/operations/dashboards/qa/`, { params: clean(query) })
    );
  }

  async getDevOpsDashboard(workspaceSlug: string, query?: TQuery): Promise<TDevOpsDashboard> {
    return this.unwrap(
      this.get(`/api/workspaces/${workspaceSlug}/operations/dashboards/devops/`, { params: clean(query) })
    );
  }

  // ------------------------------------------------------------------ Analytics

  async getDeliveryAnalytics(workspaceSlug: string, query?: TQuery): Promise<TDeliveryAnalytics> {
    return this.unwrap(
      this.get(`/api/workspaces/${workspaceSlug}/operations/analytics/delivery/`, { params: clean(query) })
    );
  }

  async getQualityAnalytics(workspaceSlug: string, query?: TQuery): Promise<TQualityAnalytics> {
    return this.unwrap(
      this.get(`/api/workspaces/${workspaceSlug}/operations/analytics/quality/`, { params: clean(query) })
    );
  }

  async getProductivityAnalytics(workspaceSlug: string, query?: TQuery): Promise<TProductivityAnalytics> {
    return this.unwrap(
      this.get(`/api/workspaces/${workspaceSlug}/operations/analytics/productivity/`, { params: clean(query) })
    );
  }

  async getTeamAnalytics(workspaceSlug: string, query?: TQuery): Promise<TTeamAnalytics> {
    return this.unwrap(
      this.get(`/api/workspaces/${workspaceSlug}/operations/analytics/team/`, { params: clean(query) })
    );
  }

  // -------------------------------------------------------------------- Reports

  async getReport(workspaceSlug: string, reportType: TReportType, query?: TQuery): Promise<TOperationsReport> {
    return this.unwrap(
      this.get(`/api/workspaces/${workspaceSlug}/operations/reports/${reportType}/`, { params: clean(query) })
    );
  }

  // ------------------------------------------------------------------- Settings

  async getSettings(workspaceSlug: string): Promise<TOperationsSettings> {
    return this.unwrap(this.get(`/api/workspaces/${workspaceSlug}/operations/settings/`));
  }

  async updateSettings(workspaceSlug: string, config: Record<string, unknown>): Promise<TOperationsSettings> {
    return this.unwrap(this.patch(`/api/workspaces/${workspaceSlug}/operations/settings/`, { config }));
  }

  async bootstrap(workspaceSlug: string, projectIds?: string[]): Promise<TBootstrapResult> {
    return this.unwrap(
      this.post(`/api/workspaces/${workspaceSlug}/operations/bootstrap/`, { project_ids: projectIds })
    );
  }

  // ----------------------------------------------------------- Team availability

  async getTeamAvailability(workspaceSlug: string): Promise<TTeamAvailability> {
    return this.unwrap(this.get(`/api/workspaces/${workspaceSlug}/operations/team-availability/`));
  }
}

const operationsService = new OperationsService();

export default operationsService;
