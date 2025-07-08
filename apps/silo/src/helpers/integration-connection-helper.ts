// This file is a wrapper for the db connection for silo tables in plane
// this accepts data in single format for all integrations/importers and returns the data in single format
import { TClickUpRelationMap } from "@plane/etl/clickup";
import {
  TImportJob,
  TImportReport,
  TWorkspaceConnection,
  TWorkspaceCredential,
  TWorkspaceEntityConnection,
} from "@plane/types";
import { APIClient, getAPIClient } from "@/services/client";
class IntegrationConnectionHelper {
  private apiClient: APIClient;
  constructor() {
    this.apiClient = getAPIClient();
  }

  // workspace connection
  async createOrUpdateWorkspaceConnection({
    workspace_id,
    connection_type,
    connection_id,
    connection_slug,
    connection_data,
    credential_id,
    config,
    target_hostname,
    source_hostname,
  }: {
    workspace_id: string;
    connection_type: string;
    connection_id: string;
    connection_slug: string;
    connection_data: object;
    credential_id: string;
    config?: object;
    target_hostname?: string;
    source_hostname?: string;
  }): Promise<TWorkspaceConnection> {
    return this.apiClient.workspaceConnection.createWorkspaceConnection({
      workspace_id,
      connection_type,
      connection_id,
      connection_slug,
      connection_data,
      credential_id,
      config,
      target_hostname,
      source_hostname,
    });
  }

  // get single workspace connection
  async getWorkspaceConnection({
    connection_type,
    workspace_id,
    connection_id,
  }: {
    connection_type?: string;
    workspace_id?: string;
    connection_id?: string;
  }): Promise<TWorkspaceConnection | null> {
    const connections = await this.apiClient.workspaceConnection.listWorkspaceConnections({
      connection_type,
      workspace_id,
      connection_id,
    });
    return connections?.[0];
  }

  // get all workspace connections for a workspace and connection type
  async getWorkspaceConnections({
    workspace_id,
    connection_type,
  }: {
    workspace_id: string;
    connection_type: string;
  }): Promise<TWorkspaceConnection[]> {
    return this.apiClient.workspaceConnection.listWorkspaceConnections({
      workspace_id,
      connection_type,
    });
  }

  // delete workspace connection
  async deleteWorkspaceConnection({
    connection_id,
    disconnect_meta,
    deleted_by,
  }: {
    connection_id: string;
    disconnect_meta?: object;
    deleted_by?: string;
  }): Promise<TWorkspaceConnection> {
    return this.apiClient.workspaceConnection.deleteWorkspaceConnection(connection_id, {
      disconnect_meta,
      deleted_by,
    });
  }

  // workspace entity connection
  // TODO after new model changes entity_id will be peer_entity_id and entity_type will be peer_entity_type

  async createOrUpdateWorkspaceEntityConnection({
    workspace_id,
    workspace_connection_id,
    entity_id,
    entity_type,
    entity_data,
  }: {
    workspace_id: string;
    workspace_connection_id: string;
    entity_id: string;
    entity_type: string;
    entity_data: object;
  }): Promise<TWorkspaceEntityConnection> {
    return this.apiClient.workspaceEntityConnection.createWorkspaceEntityConnection({
      workspace_id,
      workspace_connection_id,
      entity_id,
      entity_type,
      entity_data,
    });
  }

  async updateWorkspaceConnection({
    workspace_connection_id,
    config,
  }: {
    workspace_connection_id: string;
    config: object;
  }): Promise<TWorkspaceConnection> {
    return this.apiClient.workspaceConnection.updateWorkspaceConnection(workspace_connection_id, {
      config,
    });
  }

  async getWorkspaceEntityConnection({
    workspace_connection_id,
    entity_id,
  }: {
    workspace_connection_id: string;
    entity_id: string;
  }): Promise<TWorkspaceEntityConnection | null> {
    const entityConnections = await this.apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
      workspace_connection_id,
      entity_id,
    });
    return entityConnections?.[0];
  }

  async getWorkspaceEntityConnections({
    workspace_connection_id,
    entity_type,
  }: {
    workspace_connection_id: string;
    entity_type?: string;
  }): Promise<TWorkspaceEntityConnection[]> {
    return this.apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
      workspace_connection_id,
      entity_type,
    });
  }

  async updateWorkspaceEntityConnection({
    entity_connection_id,
    entity_data,
    config,
  }: {
    entity_connection_id: string;
    entity_data?: object;
    config?: object;
  }): Promise<TWorkspaceEntityConnection> {
    return this.apiClient.workspaceEntityConnection.updateWorkspaceEntityConnection(entity_connection_id, {
      entity_data,
      config,
    });
  }

  async deleteWorkspaceEntityConnection({
    entity_connection_id,
  }: {
    entity_connection_id: string;
  }): Promise<TWorkspaceEntityConnection> {
    return this.apiClient.workspaceEntityConnection.deleteWorkspaceEntityConnection(entity_connection_id);
  }

  // workspace credential

  async createOrUpdateWorkspaceCredential({
    workspace_id,
    user_id,
    source,
    source_identifier,
    source_authorization_type,
    source_access_token,
    source_refresh_token,
    target_access_token,
    target_refresh_token,
    target_identifier,
    target_authorization_type,
    is_pat,
    source_hostname,
  }: {
    workspace_id: string;
    user_id: string;
    source: string;
    source_identifier?: string;
    source_authorization_type?: string;
    source_access_token: string;
    source_refresh_token: string;
    target_access_token: string;
    target_refresh_token?: string;
    target_identifier?: string;
    target_authorization_type?: string;
    is_pat?: boolean;
    source_hostname: string;
  }): Promise<TWorkspaceCredential> {
    return this.apiClient.workspaceCredential.createWorkspaceCredential({
      workspace_id,
      user_id,
      source,
      source_identifier,
      source_authorization_type,
      source_access_token,
      source_refresh_token,
      target_access_token,
      target_refresh_token,
      target_identifier,
      target_authorization_type,
      is_pat,
      source_hostname,
    });
  }

  async updateWorkspaceCredential({
    credential_id,
    source_access_token,
    source_refresh_token,
    target_access_token,
    target_refresh_token,
    source_hostname,
  }: {
    credential_id: string;
    source_access_token?: string;
    source_refresh_token?: string;
    target_access_token?: string;
    target_refresh_token?: string;
    source_hostname?: string;
  }): Promise<TWorkspaceCredential> {
    return this.apiClient.workspaceCredential.updateWorkspaceCredential(credential_id, {
      source_access_token,
      source_refresh_token,
      target_access_token,
      target_refresh_token,
      source_hostname,
    });
  }

  async getWorkspaceCredential({
    workspace_id,
    source,
    credential_id,
  }: {
    workspace_id?: string;
    source?: string;
    credential_id?: string;
  }): Promise<TWorkspaceCredential> {
    if (credential_id) {
      return this.apiClient.workspaceCredential.getWorkspaceCredential(credential_id);
    }

    if (!workspace_id || !source) {
      throw new Error("workspace_id and source are required when credential_id is not provided");
    }

    const credentials = await this.apiClient.workspaceCredential.listWorkspaceCredentials({
      workspace_id,
      source,
    });
    return credentials?.[0];
  }

  async getWorkspaceCredentials({
    workspace_id,
    source,
    user_id,
  }: {
    workspace_id: string;
    source: string;
    user_id?: string;
  }): Promise<TWorkspaceCredential[]> {
    return this.apiClient.workspaceCredential.listWorkspaceCredentials({
      workspace_id,
      source,
      user_id,
    });
  }

  async getUserWorkspaceCredentials({
    workspace_id,
    user_id,
    source,
  }: {
    workspace_id: string;
    user_id: string;
    source: string;
  }): Promise<TWorkspaceCredential[]> {
    return this.apiClient.workspaceCredential.listWorkspaceCredentials({
      workspace_id,
      user_id,
      source,
    });
  }

  async deleteWorkspaceCredential(credential_id: string): Promise<TWorkspaceCredential> {
    return this.apiClient.workspaceCredential.deleteWorkspaceCredential(credential_id);
  }

  // import report

  async updateImportReport({
    report_id,
    batch_size,
    total_batch_count,
    imported_batch_count,
    errored_batch_count,
    total_issue_count,
    imported_issue_count,
    errored_issue_count,
    total_page_count,
    imported_page_count,
    errored_page_count,
    start_time,
    end_time,
  }: {
    report_id: string;
    batch_size?: number;
    total_batch_count?: number;
    imported_batch_count?: number;
    errored_batch_count?: number;
    total_issue_count?: number;
    imported_issue_count?: number;
    errored_issue_count?: number;
    total_page_count?: number;
    imported_page_count?: number;
    errored_page_count?: number;
    start_time?: string;
    end_time?: string;
  }): Promise<TImportReport> {
    return this.apiClient.importReport.updateImportReport(report_id, {
      batch_size,
      total_batch_count,
      imported_batch_count,
      errored_batch_count,
      total_issue_count,
      imported_issue_count,
      errored_issue_count,
      total_page_count,
      imported_page_count,
      errored_page_count,
      start_time,
      end_time,
    });
  }

  async getImportReport({ report_id }: { report_id: string }): Promise<TImportReport> {
    return this.apiClient.importReport.getImportReport(report_id);
  }

  async incrementImportReportCount({
    report_id,
    total_batch_count,
  }: {
    report_id: string;
    total_batch_count: number;
  }): Promise<TImportReport> {
    return this.apiClient.importReport.incrementImportReportCount(report_id, {
      total_batch_count,
    });
  }

  // import job
  async updateImportJob({
    job_id,
    status,
    success_metadata,
    error_metadata,
    cancelled_at,
    relation_map,
  }: {
    job_id: string;
    status?: string;
    success_metadata?: object;
    error_metadata?: object;
    cancelled_at?: string;
    relation_map?: TClickUpRelationMap;
  }): Promise<TImportJob> {
    return this.apiClient.importJob.updateImportJob(job_id, {
      status,
      success_metadata,
      error_metadata,
      cancelled_at,
      relation_map,
    });
  }

  async getImportJob(job_id: string): Promise<TImportJob> {
    return this.apiClient.importJob.getImportJob(job_id);
  }

  async listImportJobs({
    workspace_id,
    source,
    status,
  }: {
    workspace_id: string;
    source?: string;
    status?: string;
  }): Promise<TImportJob[]> {
    return this.apiClient.importJob.listImportJobs({
      workspace_id,
      source,
      status,
    });
  }
}

export const integrationConnectionHelper = new IntegrationConnectionHelper();
