/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { API_BASE_URL } from "@plane/constants";
import type {
  TContract,
  TContractChat,
  TContractChatMessage,
  TContractChatMode,
  TContractFilters,
  TContractJob,
  TContractQuery,
  TContractRetryOptions,
  TContractUpdatePayload,
} from "@plane/types";
// services
import { APIService } from "@/services/api.service";

export class ContractService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getContracts(workspaceSlug: string, filters?: TContractFilters): Promise<TContract[]> {
    // Multi-value filters repeat their key (?estatus=a&estatus=b) — Django getlist()
    const params = new URLSearchParams();
    if (filters?.asset_id) params.set("asset_id", filters.asset_id);
    if (filters?.search) params.set("search", filters.search);
    if (filters?.person) params.set("person", filters.person);
    if (filters?.artist) params.set("artist", filters.artist);
    if (filters?.year) params.set("year", filters.year);
    (filters?.estatus ?? []).forEach((value) => params.append("estatus", value));
    (filters?.tipo ?? []).forEach((value) => params.append("tipo", value));
    (filters?.processing_status ?? []).forEach((value) => params.append("processing_status", value));
    (filters?.tags ?? []).forEach((value) => params.append("tag", value));
    if (filters?.fecha_fin_efectiva_after) params.set("fecha_fin_efectiva_after", filters.fecha_fin_efectiva_after);
    if (filters?.fecha_fin_efectiva_before) params.set("fecha_fin_efectiva_before", filters.fecha_fin_efectiva_before);
    const query = params.toString();
    return this.get(`/api/workspaces/${workspaceSlug}/contracts/${query ? `?${query}` : ""}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getContract(workspaceSlug: string, contractId: string): Promise<TContract> {
    return this.get(`/api/workspaces/${workspaceSlug}/contracts/${contractId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateContract(
    workspaceSlug: string,
    contractId: string,
    data: TContractUpdatePayload
  ): Promise<TContract> {
    return this.patch(`/api/workspaces/${workspaceSlug}/contracts/${contractId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async retryContract(
    workspaceSlug: string,
    contractId: string,
    options?: TContractRetryOptions
  ): Promise<TContractJob> {
    return this.post(`/api/workspaces/${workspaceSlug}/contracts/${contractId}/retry/`, options ?? {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async reanalyzeContract(workspaceSlug: string, contractId: string): Promise<TContractJob> {
    return this.post(`/api/workspaces/${workspaceSlug}/contracts/${contractId}/reanalyze/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async confirmReanalysis(workspaceSlug: string, contractId: string, accept: boolean): Promise<TContract> {
    return this.post(`/api/workspaces/${workspaceSlug}/contracts/${contractId}/reanalyze/confirm/`, { accept })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getJobs(
    workspaceSlug: string,
    options?: { contractId?: string; active?: boolean; contractIds?: string[] }
  ): Promise<TContractJob[]> {
    const params = new URLSearchParams();
    if (options?.active) params.set("active", "true");
    (options?.contractIds ?? []).forEach((id) => params.append("contract_ids", id));
    const query = params.toString();
    const base = options?.contractId
      ? `/api/workspaces/${workspaceSlug}/contracts/${options.contractId}/jobs/`
      : `/api/workspaces/${workspaceSlug}/contracts/jobs/`;
    return this.get(`${base}${query ? `?${query}` : ""}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async bulkAction(
    workspaceSlug: string,
    action: "retry" | "reanalyze",
    contractIds: string[],
    retryOptions?: TContractRetryOptions
  ): Promise<{ dispatched: string[]; skipped: string[] }> {
    return this.post(`/api/workspaces/${workspaceSlug}/contracts/bulk/`, {
      action,
      contract_ids: contractIds,
      retry_options: retryOptions ?? {},
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  // chat

  async getChatModels(
    workspaceSlug: string
  ): Promise<{ models: Array<{ id: string; provider: "gemini" | "deepseek" }>; default_model: string }> {
    return this.get(`/api/workspaces/${workspaceSlug}/contracts/chats/models/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getChats(
    workspaceSlug: string,
    options?: { mode?: TContractChatMode; contractId?: string }
  ): Promise<TContractChat[]> {
    const params = new URLSearchParams();
    if (options?.mode) params.set("mode", options.mode);
    if (options?.contractId) params.set("contract_id", options.contractId);
    const query = params.toString();
    return this.get(`/api/workspaces/${workspaceSlug}/contracts/chats/${query ? `?${query}` : ""}`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createChat(
    workspaceSlug: string,
    data: { mode: TContractChatMode; contract_id?: string; title?: string }
  ): Promise<TContractChat> {
    return this.post(`/api/workspaces/${workspaceSlug}/contracts/chats/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getChatDetail(
    workspaceSlug: string,
    chatId: string
  ): Promise<{ chat: TContractChat; messages: TContractChatMessage[] }> {
    return this.get(`/api/workspaces/${workspaceSlug}/contracts/chats/${chatId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteChat(workspaceSlug: string, chatId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/contracts/chats/${chatId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async sendChatMessage(
    workspaceSlug: string,
    chatId: string,
    message: string,
    model?: string
  ): Promise<{ user_message: TContractChatMessage; assistant_message: TContractChatMessage }> {
    return this.post(`/api/workspaces/${workspaceSlug}/contracts/chats/${chatId}/messages/`, { message, model })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getQueries(workspaceSlug: string): Promise<TContractQuery[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/contracts/queries/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createQuery(workspaceSlug: string, query: string): Promise<TContractQuery> {
    return this.post(`/api/workspaces/${workspaceSlug}/contracts/queries/`, { query })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

export const contractService = new ContractService();
