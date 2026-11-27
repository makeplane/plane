/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: app endpoints of the decision register (apps/api/plane/liviere/app/decisions.py).
// Errors are thrown as TDecisionError ({status, error, code, field, number}).

import { API_BASE_URL } from "@plane/constants";
import { APIService } from "@/services/api.service";
import type {
  TDecision,
  TDecisionAction,
  TDecisionActionBody,
  TDecisionArea,
  TDecisionDetail,
  TDecisionError,
  TDecisionListPage,
  TDecisionNewVersion,
  TDecisionQueueCounts,
  TDecisionSearchResult,
  TDecisionSettings,
  TDecisionSupersedeResult,
} from "./types";

// The list endpoint gives at most 1000 per page; the page loads the whole register, up to this many pages
export const LIST_PAGE_SIZE = 1000;
export const LIST_MAX_PAGES = 5;
// Largest limit of POST search/
export const SEARCH_LIMIT = 200;

type TAxiosLikeError = { response?: { status?: number; data?: Record<string, unknown> } } | undefined;

const text = (value: unknown) => (typeof value === "string" ? value : null);

/** The error of a failed request in one shape, also for network errors (status null). */
export function toDecisionError(error: unknown): TDecisionError {
  const response = (error as TAxiosLikeError)?.response;
  const data = response?.data ?? {};
  return {
    status: response?.status ?? null,
    error: text(data.error) ?? text(data.detail),
    code: text(data.code),
    field: text(data.field),
    number: typeof data.number === "number" ? data.number : null,
  };
}

export const isDisabledError = (error: unknown) =>
  !!error && (error as TDecisionError).status === 404 && (error as TDecisionError).code === "decisions_disabled";
export const isForbiddenError = (error: unknown) => !!error && (error as TDecisionError).status === 403;

export class DecisionsService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  private url(workspaceSlug: string, projectId: string, path = "") {
    return `/api/workspaces/${workspaceSlug}/projects/${projectId}/liviere/decisions/${path}`;
  }

  private async run<T>(request: Promise<{ data: T } | undefined>): Promise<T> {
    try {
      const response = await request;
      return response?.data as T;
    } catch (error) {
      throw toDecisionError(error);
    }
  }

  getSettings(workspaceSlug: string, projectId: string): Promise<TDecisionSettings> {
    return this.run(this.get(this.url(workspaceSlug, projectId, "settings/")));
  }

  updateSettings(workspaceSlug: string, projectId: string, data: { enabled: boolean }): Promise<TDecisionSettings> {
    return this.run(this.patch(this.url(workspaceSlug, projectId, "settings/"), data));
  }

  /** The whole register in every state, page after page; `complete` false if it hit LIST_MAX_PAGES. */
  async listAll(workspaceSlug: string, projectId: string): Promise<{ results: TDecision[]; complete: boolean }> {
    const results: TDecision[] = [];
    let cursor: string | undefined;
    for (let page = 0; page < LIST_MAX_PAGES; page++) {
      // Each page needs the cursor of the previous one
      // oxlint-disable-next-line no-await-in-loop
      const data: TDecisionListPage = await this.run(
        this.get(this.url(workspaceSlug, projectId), {
          params: { status: "all", per_page: LIST_PAGE_SIZE, ...(cursor ? { cursor } : {}) },
        })
      );
      results.push(...(data?.results ?? []));
      if (!data?.next_page_results || !data.next_cursor) return { results, complete: true };
      cursor = data.next_cursor;
    }
    return { results, complete: false };
  }

  async getAreas(workspaceSlug: string, projectId: string): Promise<TDecisionArea[]> {
    const data = await this.run<{ results: TDecisionArea[] }>(this.get(this.url(workspaceSlug, projectId, "areas/")));
    return data?.results ?? [];
  }

  getQueues(workspaceSlug: string, projectId: string): Promise<TDecisionQueueCounts> {
    return this.run(this.get(this.url(workspaceSlug, projectId, "queues/")));
  }

  getDecision(workspaceSlug: string, projectId: string, number: number): Promise<TDecisionDetail> {
    return this.run(this.get(this.url(workspaceSlug, projectId, `${number}/`)));
  }

  /** Full-text search in every state; the phrase goes in the body, never in the URL. */
  search(workspaceSlug: string, projectId: string, q: string): Promise<TDecisionSearchResult> {
    return this.run(this.post(this.url(workspaceSlug, projectId, "search/"), { q, limit: SEARCH_LIMIT }));
  }

  action<A extends TDecisionAction>(
    workspaceSlug: string,
    projectId: string,
    number: number,
    action: A,
    body: TDecisionActionBody[A]
  ): Promise<TDecision> {
    return this.run(this.post(this.url(workspaceSlug, projectId, `${number}/${action}/`), body));
  }

  /** One new version, or several (a split), in a single request. */
  supersede(
    workspaceSlug: string,
    projectId: string,
    number: number,
    versions: TDecisionNewVersion[]
  ): Promise<TDecisionSupersedeResult> {
    const body = versions.length === 1 ? versions[0] : { decisions: versions };
    return this.run(this.post(this.url(workspaceSlug, projectId, `${number}/supersede/`), body));
  }

  async getEnabledProjectIds(workspaceSlug: string): Promise<string[]> {
    const data = await this.run<{ project_ids: string[] }>(
      this.get(`/api/workspaces/${workspaceSlug}/liviere/decisions/enabled-projects/`)
    );
    return data?.project_ids ?? [];
  }
}

export const decisionsService = new DecisionsService();
