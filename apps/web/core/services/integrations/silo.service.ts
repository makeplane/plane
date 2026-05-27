/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * CE silo integration service. Reads workspace-level connection
 * rows from /api/v1/workspaces/<slug>/workspace-connections/ and
 * fetches the Slack authorize URL from silo.
 */

import { API_BASE_URL, SILO_URL } from "@plane/constants";

import { APIService } from "@/services/api.service";

export type WorkspaceConnection = {
  id: string;
  workspace_id: string;
  workspace_slug: string;
  credential_id: string;
  connection_type: string;
  connection_id: string;
  connection_slug: string | null;
  connection_data: Record<string, unknown> | null;
  scopes: string[] | null;
};

export class SiloIntegrationService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async listConnections(workspaceSlug: string, connectionType?: string): Promise<WorkspaceConnection[]> {
    const qs = connectionType ? `?connection_type=${encodeURIComponent(connectionType)}` : "";
    const r = await this.get(`/api/v1/workspaces/${workspaceSlug}/workspace-connections/${qs}`);
    return r?.data ?? [];
  }

  async deleteConnection(workspaceSlug: string, connectionId: string): Promise<void> {
    await this.delete(`/api/v1/workspaces/${workspaceSlug}/workspace-connections/${connectionId}/`);
  }

  async getSlackInstallUrl(workspaceSlug: string, userId: string): Promise<string> {
    const url = `${SILO_URL}/api/slack/team/auth/url?workspaceSlug=${encodeURIComponent(workspaceSlug)}&userId=${encodeURIComponent(userId)}`;
    const r = await fetch(url, { credentials: "omit" });
    if (!r.ok) throw new Error(`silo auth/url ${r.status}`);
    const j = (await r.json()) as { url: string };
    return j.url;
  }

  async getSlackUserAuthUrl(workspaceSlug: string, planeUserId: string): Promise<string> {
    const url = `${SILO_URL}/api/slack/user/auth/url?workspaceSlug=${encodeURIComponent(workspaceSlug)}&planeUserId=${encodeURIComponent(planeUserId)}`;
    const r = await fetch(url, { credentials: "omit" });
    if (!r.ok) throw new Error(`silo user auth/url ${r.status}`);
    const j = (await r.json()) as { url: string };
    return j.url;
  }

  async listUserConnections(workspaceSlug: string, connectionType?: string): Promise<WorkspaceConnection[]> {
    const qs = connectionType ? `?connection_type=${encodeURIComponent(connectionType)}` : "";
    const r = await this.get(`/api/v1/workspaces/${workspaceSlug}/workspace-user-connections/${qs}`);
    return r?.data ?? [];
  }

  async deleteUserConnection(workspaceSlug: string, connectionId: string): Promise<void> {
    await this.delete(`/api/v1/workspaces/${workspaceSlug}/workspace-user-connections/${connectionId}/`);
  }

  async listSlackChannels(workspaceSlug: string, teamId: string): Promise<SlackChannel[]> {
    const url = `${SILO_URL}/api/slack/channels?workspaceSlug=${encodeURIComponent(workspaceSlug)}&teamId=${encodeURIComponent(teamId)}`;
    const r = await fetch(url, { credentials: "omit" });
    if (!r.ok) throw new Error(`silo channels ${r.status}`);
    const j = (await r.json()) as { channels: SlackChannel[] };
    return j.channels ?? [];
  }

  async listEntityConnections(
    workspaceSlug: string,
    params?: { workspaceConnectionId?: string; projectId?: string; type?: string }
  ): Promise<WorkspaceEntityConnection[]> {
    const qs = new URLSearchParams();
    if (params?.workspaceConnectionId) qs.set("workspace_connection_id", params.workspaceConnectionId);
    if (params?.projectId) qs.set("project_id", params.projectId);
    if (params?.type) qs.set("type", params.type);
    const r = await this.get(
      `/api/v1/workspaces/${workspaceSlug}/workspace-entity-connections/${qs.toString() ? `?${qs}` : ""}`
    );
    return r?.data ?? [];
  }

  async createEntityConnection(
    workspaceSlug: string,
    body: {
      workspace_connection_id: string;
      project_id: string;
      type: string;
      entity_type: string;
      entity_id: string;
      entity_slug?: string | null;
      entity_data?: Record<string, unknown>;
      config?: Record<string, unknown>;
    }
  ): Promise<WorkspaceEntityConnection> {
    const r = await this.post(`/api/v1/workspaces/${workspaceSlug}/workspace-entity-connections/`, body);
    return r?.data;
  }

  async deleteEntityConnection(workspaceSlug: string, id: string): Promise<void> {
    await this.delete(`/api/v1/workspaces/${workspaceSlug}/workspace-entity-connections/${id}/`);
  }
}

export type SlackChannel = {
  id: string;
  name: string;
  is_private: boolean;
  is_member: boolean;
  num_members: number;
};

export type WorkspaceEntityConnection = {
  id: string;
  workspace_id: string;
  workspace_connection_id: string;
  project_id: string | null;
  issue_id: string | null;
  type: string;
  entity_type: string;
  entity_id: string;
  entity_slug: string | null;
  entity_data: Record<string, unknown> | null;
  config: Record<string, unknown> | null;
};
