/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type {
  TFlow,
  TFlowPayload,
  THubChannel,
  THubDoc,
  THubDocPayload,
  THubPerson,
  THubSecret,
  THubSecretLog,
  THubSecretPayload,
  TLibraryFile,
} from "@plane/types";
// services
import { APIService } from "../api.service";

const MULTIPART = { headers: { "Content-Type": "multipart/form-data" } };

const fail = (error: { response?: { data?: unknown } }) => {
  throw error?.response?.data;
};

/** The Hub beyond chat: people, private messages, documents, shared files and secrets. */
export class HubExtraService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  private base(workspaceSlug: string) {
    return `/api/workspaces/${workspaceSlug}/team-ops/hub`;
  }

  async listPeople(workspaceSlug: string): Promise<THubPerson[]> {
    return this.get(`${this.base(workspaceSlug)}/people/`)
      .then((response) => response?.data?.results)
      .catch(fail);
  }

  /** Opens (or creates) the private conversation with a colleague. */
  async openDirect(workspaceSlug: string, user: string): Promise<THubChannel> {
    return this.post(`${this.base(workspaceSlug)}/direct/`, { user })
      .then((response) => response?.data)
      .catch(fail);
  }

  async listDocs(
    workspaceSlug: string,
    params: { q?: string; tag?: string; project?: string }
  ): Promise<{ results: THubDoc[]; tags: string[] }> {
    return this.get(`${this.base(workspaceSlug)}/docs/`, { params })
      .then((response) => response?.data)
      .catch(fail);
  }

  async getDoc(workspaceSlug: string, id: string): Promise<THubDoc> {
    return this.get(`${this.base(workspaceSlug)}/docs/${id}/`)
      .then((response) => response?.data)
      .catch(fail);
  }

  async saveDoc(workspaceSlug: string, payload: THubDocPayload, id?: string): Promise<THubDoc> {
    const request = id
      ? this.patch(`${this.base(workspaceSlug)}/docs/${id}/`, payload)
      : this.post(`${this.base(workspaceSlug)}/docs/`, payload);
    return request.then((response) => response?.data).catch(fail);
  }

  async deleteDoc(workspaceSlug: string, id: string): Promise<void> {
    return this.delete(`${this.base(workspaceSlug)}/docs/${id}/`)
      .then(() => undefined)
      .catch(fail);
  }

  async listFiles(workspaceSlug: string): Promise<TLibraryFile[]> {
    return this.get(`${this.base(workspaceSlug)}/library/`)
      .then((response) => response?.data?.results)
      .catch(fail);
  }

  /** Shares files with everyone in the workspace. */
  async uploadFiles(workspaceSlug: string, files: File[]): Promise<TLibraryFile[]> {
    const form = new FormData();
    files.forEach((file) => form.append("files", file));
    return this.post(`${this.base(workspaceSlug)}/library/`, form, MULTIPART)
      .then((response) => response?.data?.results)
      .catch(fail);
  }

  async deleteFile(workspaceSlug: string, id: string): Promise<void> {
    return this.delete(`${this.base(workspaceSlug)}/library/${id}/`)
      .then(() => undefined)
      .catch(fail);
  }

  async listSecrets(workspaceSlug: string): Promise<THubSecret[]> {
    return this.get(`${this.base(workspaceSlug)}/secrets/`)
      .then((response) => response?.data?.results)
      .catch(fail);
  }

  async createSecret(workspaceSlug: string, payload: THubSecretPayload): Promise<THubSecret> {
    return this.post(`${this.base(workspaceSlug)}/secrets/`, payload)
      .then((response) => response?.data)
      .catch(fail);
  }

  async updateSecret(
    workspaceSlug: string,
    id: string,
    payload: Partial<Pick<THubSecretPayload, "name" | "description" | "value">>
  ): Promise<THubSecret> {
    return this.patch(`${this.base(workspaceSlug)}/secrets/${id}/`, payload)
      .then((response) => response?.data)
      .catch(fail);
  }

  async deleteSecret(workspaceSlug: string, id: string): Promise<void> {
    return this.delete(`${this.base(workspaceSlug)}/secrets/${id}/`)
      .then(() => undefined)
      .catch(fail);
  }

  /** The value of a secret. Every call is logged on the server; never keep the result longer than needed. */
  async revealSecret(workspaceSlug: string, id: string): Promise<string> {
    return this.post(`${this.base(workspaceSlug)}/secrets/${id}/reveal/`, {})
      .then((response) => response?.data?.value)
      .catch(fail);
  }

  /** Replaces the list of people who may read the secret (publisher only). */
  async setSecretAccess(workspaceSlug: string, id: string, users: string[]): Promise<THubSecret> {
    return this.put(`${this.base(workspaceSlug)}/secrets/${id}/access/`, { users })
      .then((response) => response?.data)
      .catch(fail);
  }

  async getSecretLog(workspaceSlug: string, id: string): Promise<THubSecretLog[]> {
    return this.get(`${this.base(workspaceSlug)}/secrets/${id}/access/`)
      .then((response) => response?.data?.results)
      .catch(fail);
  }
}

/** Flows: the stages of people on a project, drawn by an admin. */
export class FlowService extends APIService {
  constructor(BASE_URL?: string) {
    super(BASE_URL || API_BASE_URL);
  }

  private base(workspaceSlug: string) {
    return `/api/workspaces/${workspaceSlug}/team-ops/teamflow/flows`;
  }

  async list(workspaceSlug: string): Promise<{ results: TFlow[]; can_manage: boolean }> {
    return this.get(`${this.base(workspaceSlug)}/`)
      .then((response) => response?.data)
      .catch(fail);
  }

  async create(workspaceSlug: string, payload: TFlowPayload): Promise<TFlow> {
    return this.post(`${this.base(workspaceSlug)}/`, payload)
      .then((response) => response?.data)
      .catch(fail);
  }

  async update(workspaceSlug: string, id: string, payload: TFlowPayload): Promise<TFlow> {
    return this.put(`${this.base(workspaceSlug)}/${id}/`, payload)
      .then((response) => response?.data)
      .catch(fail);
  }

  async remove(workspaceSlug: string, id: string): Promise<void> {
    return this.delete(`${this.base(workspaceSlug)}/${id}/`)
      .then(() => undefined)
      .catch(fail);
  }

  /** The people of a project who can be put into its flow. */
  async listProjectPeople(workspaceSlug: string, project: string): Promise<THubPerson[]> {
    return this.get(`${this.base(workspaceSlug)}/members/`, { params: { project } })
      .then((response) => response?.data?.results)
      .catch(fail);
  }
}
