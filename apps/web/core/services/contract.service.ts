/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { API_BASE_URL } from "@plane/constants";
import type {
  TContract,
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
    if (filters?.search) params.set("search", filters.search);
    if (filters?.person) params.set("person", filters.person);
    if (filters?.artist) params.set("artist", filters.artist);
    if (filters?.year) params.set("year", filters.year);
    (filters?.estatus ?? []).forEach((value) => params.append("estatus", value));
    (filters?.tipo ?? []).forEach((value) => params.append("tipo", value));
    (filters?.processing_status ?? []).forEach((value) => params.append("processing_status", value));
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
