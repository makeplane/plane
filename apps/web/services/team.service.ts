/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
import type { ETeamRole, TPortfolio, TProjectMoveResult, TTeam, TTeamCreatePayload, TTeamMember } from "@plane/types";
// services
import { APIService } from "@/services/api.service";

const data = <T>(request: Promise<{ data: T }>): Promise<T> =>
  request
    .then((response) => response?.data)
    .catch((error) => {
      throw error?.response?.data;
    });

export class TeamService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  list(workspaceSlug: string): Promise<TTeam[]> {
    return data(this.get(`/api/workspaces/${workspaceSlug}/teams/`));
  }

  create(workspaceSlug: string, payload: TTeamCreatePayload): Promise<TTeam> {
    return data(this.post(`/api/workspaces/${workspaceSlug}/teams/`, payload));
  }

  update(workspaceSlug: string, teamId: string, payload: Partial<TTeam>): Promise<TTeam> {
    return data(this.patch(`/api/workspaces/${workspaceSlug}/teams/${teamId}/`, payload));
  }

  remove(workspaceSlug: string, teamId: string): Promise<void> {
    return data(this.delete(`/api/workspaces/${workspaceSlug}/teams/${teamId}/`));
  }

  setArchived(workspaceSlug: string, teamId: string, archived: boolean): Promise<Pick<TTeam, "archived_at">> {
    const url = `/api/workspaces/${workspaceSlug}/teams/${teamId}/archive/`;
    return data(archived ? this.post(url) : this.delete(url));
  }

  listMembers(workspaceSlug: string, teamId: string): Promise<TTeamMember[]> {
    return data(this.get(`/api/workspaces/${workspaceSlug}/teams/${teamId}/members/`));
  }

  addMembers(
    workspaceSlug: string,
    teamId: string,
    payload: { member_ids: string[]; role: ETeamRole }
  ): Promise<TTeamMember[]> {
    return data(this.post(`/api/workspaces/${workspaceSlug}/teams/${teamId}/members/`, payload));
  }

  updateMember(workspaceSlug: string, teamId: string, id: string, role: ETeamRole): Promise<TTeamMember> {
    return data(this.patch(`/api/workspaces/${workspaceSlug}/teams/${teamId}/members/${id}/`, { role }));
  }

  removeMember(workspaceSlug: string, teamId: string, id: string): Promise<void> {
    return data(this.delete(`/api/workspaces/${workspaceSlug}/teams/${teamId}/members/${id}/`));
  }

  listPortfolios(workspaceSlug: string): Promise<TPortfolio[]> {
    return data(this.get(`/api/workspaces/${workspaceSlug}/portfolios/`));
  }

  createPortfolio(workspaceSlug: string, teamId: string, payload: Partial<TPortfolio>): Promise<TPortfolio> {
    return data(this.post(`/api/workspaces/${workspaceSlug}/teams/${teamId}/portfolios/`, payload));
  }

  updatePortfolio(workspaceSlug: string, portfolioId: string, payload: Partial<TPortfolio>): Promise<TPortfolio> {
    return data(this.patch(`/api/workspaces/${workspaceSlug}/portfolios/${portfolioId}/`, payload));
  }

  removePortfolio(workspaceSlug: string, portfolioId: string): Promise<void> {
    return data(this.delete(`/api/workspaces/${workspaceSlug}/portfolios/${portfolioId}/`));
  }

  setPortfolioArchived(
    workspaceSlug: string,
    portfolioId: string,
    archived: boolean
  ): Promise<Pick<TPortfolio, "archived_at">> {
    const url = `/api/workspaces/${workspaceSlug}/portfolios/${portfolioId}/archive/`;
    return data(archived ? this.post(url) : this.delete(url));
  }

  moveProject(
    workspaceSlug: string,
    projectId: string,
    portfolioId: string | null,
    dryRun: boolean
  ): Promise<TProjectMoveResult> {
    return data(
      this.post(`/api/workspaces/${workspaceSlug}/projects/${projectId}/move/`, {
        portfolio_id: portfolioId,
        dry_run: dryRun,
      })
    );
  }
}
