/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { set, sortBy, unset } from "lodash-es";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { ETeamRole } from "@plane/types";
import type { TPortfolio, TProject, TProjectMoveResult, TTeam, TTeamCreatePayload, TTeamMember } from "@plane/types";
// services
import { TeamService } from "@/services/team.service";
// store
import type { CoreRootStore } from "./root.store";

export interface ITeamStore {
  // observables
  teamMap: Record<string, TTeam>;
  portfolioMap: Record<string, TPortfolio>;
  teamMemberMap: Record<string, Record<string, TTeamMember>>; // teamId: { membershipId: membership }
  // computed
  isEnabled: boolean;
  isWorkspaceAdmin: boolean;
  canSeeProductBoard: boolean;
  teams: TTeam[];
  activeTeams: TTeam[];
  manageablePortfolios: TPortfolio[];
  canCreateProject: boolean;
  unassignedProjects: TProject[];
  // computed functions
  canManageTeam: (teamId: string) => boolean;
  getTeamPortfolios: (teamId: string, includeArchived: boolean) => TPortfolio[];
  getPortfolioProjects: (portfolioId: string) => TProject[];
  getTeamMembers: (teamId: string) => TTeamMember[] | undefined;
  // actions
  fetchStructure: (workspaceSlug: string) => Promise<void>;
  createTeam: (workspaceSlug: string, payload: TTeamCreatePayload) => Promise<TTeam>;
  updateTeam: (workspaceSlug: string, teamId: string, payload: Partial<TTeam>) => Promise<void>;
  deleteTeam: (workspaceSlug: string, teamId: string) => Promise<void>;
  setTeamArchived: (workspaceSlug: string, teamId: string, archived: boolean) => Promise<void>;
  fetchTeamMembers: (workspaceSlug: string, teamId: string) => Promise<void>;
  addTeamMembers: (workspaceSlug: string, teamId: string, memberIds: string[], role: ETeamRole) => Promise<void>;
  updateTeamMember: (workspaceSlug: string, teamId: string, id: string, role: ETeamRole) => Promise<void>;
  removeTeamMember: (workspaceSlug: string, teamId: string, id: string) => Promise<void>;
  createPortfolio: (workspaceSlug: string, teamId: string, payload: Partial<TPortfolio>) => Promise<void>;
  updatePortfolio: (workspaceSlug: string, portfolioId: string, payload: Partial<TPortfolio>) => Promise<void>;
  deletePortfolio: (workspaceSlug: string, portfolioId: string) => Promise<void>;
  setPortfolioArchived: (workspaceSlug: string, portfolioId: string, archived: boolean) => Promise<void>;
  previewMove: (workspaceSlug: string, projectId: string, portfolioId: string | null) => Promise<TProjectMoveResult>;
  moveProjects: (workspaceSlug: string, projectIds: string[], portfolioId: string | null) => Promise<void>;
}

export class TeamStore implements ITeamStore {
  teamMap: Record<string, TTeam> = {};
  portfolioMap: Record<string, TPortfolio> = {};
  teamMemberMap: Record<string, Record<string, TTeamMember>> = {};
  // services
  private service = new TeamService();

  constructor(private rootStore: CoreRootStore) {
    makeObservable(this, {
      teamMap: observable,
      portfolioMap: observable,
      teamMemberMap: observable,
      isEnabled: computed,
      isWorkspaceAdmin: computed,
      canSeeProductBoard: computed,
      teams: computed,
      activeTeams: computed,
      manageablePortfolios: computed,
      canCreateProject: computed,
      unassignedProjects: computed,
      fetchStructure: action,
    });
  }

  private get workspaceId() {
    return this.rootStore.workspaceRoot.currentWorkspace?.id;
  }

  private hasWorkspaceRole(roles: EUserPermissions[]) {
    return this.rootStore.user.permission.allowPermissions(roles, EUserPermissionsLevel.WORKSPACE);
  }

  get isWorkspaceAdmin() {
    return this.hasWorkspaceRole([EUserPermissions.ADMIN]);
  }

  /** The workspace uses the team structure and the current user may see it. Guests never do. */
  get isEnabled() {
    return (
      !!this.rootStore.workspaceRoot.currentWorkspace?.is_team_structure_enabled &&
      this.hasWorkspaceRole([EUserPermissions.ADMIN, EUserPermissions.MEMBER])
    );
  }

  /** Teams of the current workspace, the user's own first. */
  get teams() {
    const teams = Object.values(this.teamMap).filter((team) => team.workspace === this.workspaceId);
    return sortBy(teams, [(team) => !team.member_role, (team) => team.name.toLowerCase()]);
  }

  get activeTeams() {
    return this.teams.filter((team) => !team.archived_at);
  }

  /** The management team and workspace admins; the server checks the same. */
  get canSeeProductBoard() {
    return (
      this.isEnabled &&
      (this.isWorkspaceAdmin || this.activeTeams.some((team) => team.kind === "management" && !!team.member_role))
    );
  }

  canManageTeam = computedFn(
    (teamId: string) => this.isWorkspaceAdmin || this.teamMap[teamId]?.member_role === ETeamRole.ADMIN
  );

  // computedFn needs every call to pass the same number of arguments, so none is optional
  getTeamPortfolios = computedFn((teamId: string, includeArchived: boolean) =>
    sortBy(
      Object.values(this.portfolioMap).filter(
        (portfolio) => portfolio.team === teamId && (includeArchived || !portfolio.archived_at)
      ),
      [(portfolio) => !!portfolio.archived_at, "sort_order", (portfolio) => portfolio.name.toLowerCase()]
    )
  );

  /** Portfolios the user may put projects in. */
  get manageablePortfolios() {
    return this.activeTeams
      .filter((team) => this.canManageTeam(team.id))
      .flatMap((team) => this.getTeamPortfolios(team.id, false));
  }

  get canCreateProject() {
    return this.isWorkspaceAdmin || this.activeTeams.some((team) => team.member_role === ETeamRole.ADMIN);
  }

  private get projects() {
    const projects = Object.values(this.rootStore.projectRoot.project.projectMap).filter(
      (project) => project.workspace === this.workspaceId && !project.archived_at
    );
    return sortBy(projects, ["sort_order", (project) => project.name.toLowerCase()]);
  }

  getPortfolioProjects = computedFn((portfolioId: string) =>
    this.projects.filter((project) => project.portfolio === portfolioId)
  );

  get unassignedProjects() {
    return this.projects.filter((project) => !project.portfolio);
  }

  getTeamMembers = computedFn((teamId: string) => {
    const members = this.teamMemberMap[teamId];
    return members ? sortBy(Object.values(members), [(member) => -member.role, "created_at"]) : undefined;
  });

  fetchStructure = async (workspaceSlug: string) => {
    const [teams, portfolios] = await Promise.all([
      this.service.list(workspaceSlug),
      this.service.listPortfolios(workspaceSlug),
    ]);
    runInAction(() => {
      this.teamMap = Object.fromEntries(teams.map((team) => [team.id, team]));
      this.portfolioMap = Object.fromEntries(portfolios.map((portfolio) => [portfolio.id, portfolio]));
    });
  };

  /** Team changes alter project access, so the project list and roles are loaded again. */
  private refreshProjectAccess = async (workspaceSlug: string) => {
    await Promise.all([
      this.rootStore.projectRoot.project.fetchPartialProjects(workspaceSlug),
      this.rootStore.user.permission.fetchUserProjectPermissions(workspaceSlug),
    ]);
  };

  createTeam = async (workspaceSlug: string, payload: TTeamCreatePayload) => {
    const team = await this.service.create(workspaceSlug, payload);
    runInAction(() => set(this.teamMap, [team.id], team));
    return team;
  };

  updateTeam = async (workspaceSlug: string, teamId: string, payload: Partial<TTeam>) => {
    const team = await this.service.update(workspaceSlug, teamId, payload);
    runInAction(() => set(this.teamMap, [teamId], team));
  };

  deleteTeam = async (workspaceSlug: string, teamId: string) => {
    await this.service.remove(workspaceSlug, teamId);
    runInAction(() => unset(this.teamMap, [teamId]));
  };

  setTeamArchived = async (workspaceSlug: string, teamId: string, archived: boolean) => {
    const { archived_at } = await this.service.setArchived(workspaceSlug, teamId, archived);
    runInAction(() => set(this.teamMap, [teamId, "archived_at"], archived_at));
  };

  fetchTeamMembers = async (workspaceSlug: string, teamId: string) => {
    const members = await this.service.listMembers(workspaceSlug, teamId);
    runInAction(() => {
      set(this.teamMemberMap, [teamId], Object.fromEntries(members.map((member) => [member.id, member])));
    });
  };

  /** Keep the user's own role in the team current after a membership change. */
  private syncAfterMemberChange = async (workspaceSlug: string, teamId: string) => {
    await Promise.all([
      this.fetchTeamMembers(workspaceSlug, teamId),
      this.fetchStructure(workspaceSlug),
      this.refreshProjectAccess(workspaceSlug),
    ]);
  };

  addTeamMembers = async (workspaceSlug: string, teamId: string, memberIds: string[], role: ETeamRole) => {
    await this.service.addMembers(workspaceSlug, teamId, { member_ids: memberIds, role });
    await this.syncAfterMemberChange(workspaceSlug, teamId);
  };

  updateTeamMember = async (workspaceSlug: string, teamId: string, id: string, role: ETeamRole) => {
    await this.service.updateMember(workspaceSlug, teamId, id, role);
    await this.syncAfterMemberChange(workspaceSlug, teamId);
  };

  removeTeamMember = async (workspaceSlug: string, teamId: string, id: string) => {
    await this.service.removeMember(workspaceSlug, teamId, id);
    await this.syncAfterMemberChange(workspaceSlug, teamId);
  };

  createPortfolio = async (workspaceSlug: string, teamId: string, payload: Partial<TPortfolio>) => {
    const portfolio = await this.service.createPortfolio(workspaceSlug, teamId, payload);
    runInAction(() => set(this.portfolioMap, [portfolio.id], portfolio));
  };

  updatePortfolio = async (workspaceSlug: string, portfolioId: string, payload: Partial<TPortfolio>) => {
    const portfolio = await this.service.updatePortfolio(workspaceSlug, portfolioId, payload);
    runInAction(() => set(this.portfolioMap, [portfolioId], portfolio));
  };

  deletePortfolio = async (workspaceSlug: string, portfolioId: string) => {
    await this.service.removePortfolio(workspaceSlug, portfolioId);
    runInAction(() => unset(this.portfolioMap, [portfolioId]));
  };

  setPortfolioArchived = async (workspaceSlug: string, portfolioId: string, archived: boolean) => {
    const { archived_at } = await this.service.setPortfolioArchived(workspaceSlug, portfolioId, archived);
    runInAction(() => set(this.portfolioMap, [portfolioId, "archived_at"], archived_at));
  };

  previewMove = (workspaceSlug: string, projectId: string, portfolioId: string | null) =>
    this.service.moveProject(workspaceSlug, projectId, portfolioId, true);

  moveProjects = async (workspaceSlug: string, projectIds: string[], portfolioId: string | null) => {
    try {
      for (const projectId of projectIds) {
        // One at a time: each move locks the portfolio, and a failure leaves the rest untouched.
        // oxlint-disable-next-line no-await-in-loop
        await this.service.moveProject(workspaceSlug, projectId, portfolioId, false);
      }
    } finally {
      await this.refreshProjectAccess(workspaceSlug);
    }
  };
}
