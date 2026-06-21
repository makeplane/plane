/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { sortBy } from "lodash-es";
import type {
  IWorkspaceSprint,
  IWorkspaceSprintAutomation,
  IWorkspaceSprintAutomationMember,
  TIssue,
  TWorkspaceSprintAutomationPayload,
  TWorkspaceSprintCreatePayload,
} from "@plane/types";
import { WorkspaceSprintService } from "@/services/sprint.service";
import type { CoreRootStore } from "./root.store";

export interface IWorkspaceSprintStore {
  loader: boolean;
  fetchedMap: Record<string, boolean>;
  automationFetchedMap: Record<string, boolean>;
  sprintMap: Record<string, IWorkspaceSprint>;
  archivedSprintMap: Record<string, IWorkspaceSprint>;
  automationMap: Record<string, IWorkspaceSprintAutomation>;
  automationMemberMap: Record<string, IWorkspaceSprintAutomationMember[]>;
  squadMap: Record<string, IWorkspaceSprintAutomation>;
  squadMemberMap: Record<string, IWorkspaceSprintAutomationMember[]>;
  currentWorkspaceSprintIds: string[] | null;
  currentWorkspaceArchivedSprintIds: string[] | null;
  currentWorkspaceSprintAutomationIds: string[] | null;
  currentWorkspaceSprintSquadIds: string[] | null;
  currentWorkspaceArchivedSprintSquadIds: string[] | null;
  getSprintsByAutomationId: (automationId: string | null | undefined) => string[];
  getSprintsBySquadId: (squadId: string | null | undefined) => string[];
  getArchivedSprintsByAutomationId: (automationId: string | null | undefined) => string[];
  getArchivedSprintsBySquadId: (squadId: string | null | undefined) => string[];
  fetchWorkspaceSprintAutomations: (workspaceSlug: string) => Promise<IWorkspaceSprintAutomation[]>;
  fetchWorkspaceSprintSquads: (workspaceSlug: string) => Promise<IWorkspaceSprintAutomation[]>;
  fetchArchivedWorkspaceSprintSquads: (workspaceSlug: string) => Promise<IWorkspaceSprintAutomation[]>;
  createWorkspaceSprintAutomation: (
    workspaceSlug: string,
    data: Partial<TWorkspaceSprintAutomationPayload>
  ) => Promise<IWorkspaceSprintAutomation>;
  createWorkspaceSprintSquad: (
    workspaceSlug: string,
    data: Partial<TWorkspaceSprintAutomationPayload>
  ) => Promise<IWorkspaceSprintAutomation>;
  updateWorkspaceSprintAutomation: (
    workspaceSlug: string,
    automationId: string,
    data: Partial<TWorkspaceSprintAutomationPayload>
  ) => Promise<IWorkspaceSprintAutomation>;
  updateWorkspaceSprintSquad: (
    workspaceSlug: string,
    squadId: string,
    data: Partial<TWorkspaceSprintAutomationPayload>
  ) => Promise<IWorkspaceSprintAutomation>;
  updateWorkspaceSprintAutomationSortOrder: (
    workspaceSlug: string,
    automationId: string,
    sortOrder: number
  ) => Promise<IWorkspaceSprintAutomation>;
  archiveWorkspaceSprintAutomation: (
    workspaceSlug: string,
    automationId: string
  ) => Promise<IWorkspaceSprintAutomation>;
  archiveWorkspaceSprintSquad: (workspaceSlug: string, squadId: string) => Promise<IWorkspaceSprintAutomation>;
  restoreWorkspaceSprintAutomation: (
    workspaceSlug: string,
    automationId: string
  ) => Promise<IWorkspaceSprintAutomation>;
  restoreWorkspaceSprintSquad: (workspaceSlug: string, squadId: string) => Promise<IWorkspaceSprintAutomation>;
  deleteWorkspaceSprintAutomation: (workspaceSlug: string, automationId: string) => Promise<void>;
  deleteWorkspaceSprintSquad: (workspaceSlug: string, squadId: string) => Promise<void>;
  fetchWorkspaceSprintAutomationMembers: (
    workspaceSlug: string,
    automationId: string
  ) => Promise<IWorkspaceSprintAutomationMember[]>;
  fetchWorkspaceSprintSquadMembers: (
    workspaceSlug: string,
    squadId: string
  ) => Promise<IWorkspaceSprintAutomationMember[]>;
  updateWorkspaceSprintAutomationMembers: (
    workspaceSlug: string,
    automationId: string,
    memberIds: string[]
  ) => Promise<IWorkspaceSprintAutomationMember[]>;
  updateWorkspaceSprintSquadMembers: (
    workspaceSlug: string,
    squadId: string,
    memberIds: string[]
  ) => Promise<IWorkspaceSprintAutomationMember[]>;
  fetchWorkspaceSprints: (workspaceSlug: string, automationId?: string) => Promise<IWorkspaceSprint[]>;
  fetchArchivedWorkspaceSprints: (workspaceSlug: string, automationId?: string) => Promise<IWorkspaceSprint[]>;
  createWorkspaceSprint: (
    workspaceSlug: string,
    data: Partial<TWorkspaceSprintCreatePayload>
  ) => Promise<IWorkspaceSprint>;
  updateWorkspaceSprint: (
    workspaceSlug: string,
    sprintId: string,
    data: Partial<TWorkspaceSprintCreatePayload>
  ) => Promise<IWorkspaceSprint>;
  completeWorkspaceSprint: (workspaceSlug: string, sprintId: string) => Promise<void>;
  getSprintById: (sprintId: string | null | undefined) => IWorkspaceSprint | null;
  getSprintAutomationById: (automationId: string | null | undefined) => IWorkspaceSprintAutomation | null;
  getSprintSquadById: (squadId: string | null | undefined) => IWorkspaceSprintAutomation | null;
  getSprintNameById: (sprintId: string | null | undefined) => string | undefined;
  addIssueToSprint: (workspaceSlug: string, sprintId: string, issueId: string) => Promise<void>;
  removeIssueFromSprint: (workspaceSlug: string, sprintId: string, issueId: string) => Promise<void>;
}

export class WorkspaceSprintStore implements IWorkspaceSprintStore {
  loader = false;
  fetchedMap: Record<string, boolean> = {};
  automationFetchedMap: Record<string, boolean> = {};
  sprintMap: Record<string, IWorkspaceSprint> = {};
  archivedSprintMap: Record<string, IWorkspaceSprint> = {};
  automationMap: Record<string, IWorkspaceSprintAutomation> = {};
  automationMemberMap: Record<string, IWorkspaceSprintAutomationMember[]> = {};

  rootStore;
  sprintService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      loader: observable.ref,
      fetchedMap: observable,
      automationFetchedMap: observable,
      sprintMap: observable,
      archivedSprintMap: observable,
      automationMap: observable,
      automationMemberMap: observable,
      squadMap: computed,
      squadMemberMap: computed,
      currentWorkspaceSprintIds: computed,
      currentWorkspaceArchivedSprintIds: computed,
      currentWorkspaceSprintAutomationIds: computed,
      currentWorkspaceSprintSquadIds: computed,
      currentWorkspaceArchivedSprintSquadIds: computed,
      fetchWorkspaceSprints: action,
      fetchArchivedWorkspaceSprints: action,
      fetchWorkspaceSprintAutomations: action,
      fetchWorkspaceSprintSquads: action,
      fetchArchivedWorkspaceSprintSquads: action,
      createWorkspaceSprintAutomation: action,
      createWorkspaceSprintSquad: action,
      updateWorkspaceSprintAutomation: action,
      updateWorkspaceSprintSquad: action,
      updateWorkspaceSprintAutomationSortOrder: action,
      archiveWorkspaceSprintAutomation: action,
      archiveWorkspaceSprintSquad: action,
      restoreWorkspaceSprintAutomation: action,
      restoreWorkspaceSprintSquad: action,
      deleteWorkspaceSprintAutomation: action,
      deleteWorkspaceSprintSquad: action,
      fetchWorkspaceSprintAutomationMembers: action,
      fetchWorkspaceSprintSquadMembers: action,
      updateWorkspaceSprintAutomationMembers: action,
      updateWorkspaceSprintSquadMembers: action,
      createWorkspaceSprint: action,
      updateWorkspaceSprint: action,
      completeWorkspaceSprint: action,
      addIssueToSprint: action,
      removeIssueFromSprint: action,
    });

    this.rootStore = _rootStore;
    this.sprintService = new WorkspaceSprintService();
  }

  get currentWorkspaceSprintIds() {
    const workspaceSlug = this.rootStore.router.workspaceSlug;
    if (!workspaceSlug || !this.fetchedMap[workspaceSlug]) return null;

    const sprints = Object.values(this.sprintMap).filter((sprint) => !sprint.archived_at);
    return sortBy(sprints, [(sprint) => sprint.start_date ?? "", (sprint) => sprint.sort_order]).map(
      (sprint) => sprint.id
    );
  }

  get currentWorkspaceArchivedSprintIds() {
    const currentWorkspace = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspace) return null;

    const sprints = Object.values(this.archivedSprintMap).filter(
      (sprint) => sprint.workspace_id === currentWorkspace.id && !!sprint.archived_at
    );
    return sortBy(sprints, [(sprint) => sprint.archived_at ?? ""]).map((sprint) => sprint.id);
  }

  get currentWorkspaceSprintAutomationIds() {
    const workspaceSlug = this.rootStore.router.workspaceSlug;
    if (!workspaceSlug || !this.automationFetchedMap[workspaceSlug]) return null;

    const automations = Object.values(this.automationMap).filter(
      (automation) => automation.workspace_id && !automation.archived_at
    );
    return sortBy(automations, [(automation) => automation.sort_order]).map((automation) => automation.id);
  }

  get squadMap() {
    return this.automationMap;
  }

  get squadMemberMap() {
    return this.automationMemberMap;
  }

  get currentWorkspaceSprintSquadIds() {
    return this.currentWorkspaceSprintAutomationIds;
  }

  get currentWorkspaceArchivedSprintSquadIds() {
    const currentWorkspace = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspace) return null;

    const squads = Object.values(this.automationMap).filter(
      (squad) => squad.workspace_id === currentWorkspace.id && !!squad.archived_at
    );
    return sortBy(squads, [(squad) => squad.archived_at ?? ""]).map((squad) => squad.id);
  }

  getSprintById = computedFn((sprintId: string | null | undefined) => {
    if (!sprintId) return null;
    return this.sprintMap[sprintId] ?? this.archivedSprintMap[sprintId] ?? null;
  });

  getSprintAutomationById = computedFn((automationId: string | null | undefined) => {
    if (!automationId) return null;
    return this.automationMap[automationId] ?? null;
  });

  getSprintSquadById = computedFn((squadId: string | null | undefined) => this.getSprintAutomationById(squadId));

  getSprintNameById = computedFn((sprintId: string | null | undefined) => this.getSprintById(sprintId)?.name);

  getSprintsByAutomationId = computedFn((automationId: string | null | undefined) => {
    if (!automationId) return [];
    return sortBy(
      Object.values(this.sprintMap).filter((sprint) => sprint.automation_id === automationId && !sprint.archived_at),
      [(sprint) => sprint.start_date ?? "", (sprint) => sprint.sort_order]
    ).map((sprint) => sprint.id);
  });

  getSprintsBySquadId = computedFn((squadId: string | null | undefined) => this.getSprintsByAutomationId(squadId));

  getArchivedSprintsByAutomationId = computedFn((automationId: string | null | undefined) => {
    if (!automationId) return [];
    return sortBy(
      Object.values(this.archivedSprintMap).filter((sprint) => sprint.automation_id === automationId),
      [(sprint) => sprint.archived_at ?? ""]
    ).map((sprint) => sprint.id);
  });

  getArchivedSprintsBySquadId = computedFn((squadId: string | null | undefined) =>
    this.getArchivedSprintsByAutomationId(squadId)
  );

  fetchWorkspaceSprintAutomations = async (workspaceSlug: string) => {
    return this.fetchWorkspaceSprintSquads(workspaceSlug);
  };

  fetchWorkspaceSprintSquads = async (workspaceSlug: string) => {
    const automations = await this.sprintService.listSquads(workspaceSlug);
    runInAction(() => {
      automations.forEach((automation) => {
        this.automationMap[automation.id] = automation;
      });
      this.automationFetchedMap[workspaceSlug] = true;
    });
    return automations;
  };

  fetchArchivedWorkspaceSprintSquads = async (workspaceSlug: string) => {
    const squads = await this.sprintService.listSquads(workspaceSlug, { archived: true });
    runInAction(() => {
      squads.forEach((squad) => {
        this.automationMap[squad.id] = squad;
      });
    });
    return squads;
  };

  createWorkspaceSprintAutomation = async (workspaceSlug: string, data: Partial<TWorkspaceSprintAutomationPayload>) => {
    return this.createWorkspaceSprintSquad(workspaceSlug, data);
  };

  createWorkspaceSprintSquad = async (workspaceSlug: string, data: Partial<TWorkspaceSprintAutomationPayload>) => {
    const automation = await this.sprintService.createSquad(workspaceSlug, data);
    runInAction(() => {
      this.automationMap[automation.id] = automation;
      this.automationFetchedMap[workspaceSlug] = true;
    });
    await this.fetchWorkspaceSprints(workspaceSlug, automation.id);
    return automation;
  };

  updateWorkspaceSprintAutomation = async (
    workspaceSlug: string,
    automationId: string,
    data: Partial<TWorkspaceSprintAutomationPayload>
  ) => {
    return this.updateWorkspaceSprintSquad(workspaceSlug, automationId, data);
  };

  updateWorkspaceSprintSquad = async (
    workspaceSlug: string,
    squadId: string,
    data: Partial<TWorkspaceSprintAutomationPayload>
  ) => {
    const automation = await this.sprintService.updateSquad(workspaceSlug, squadId, data);
    runInAction(() => {
      this.automationMap[automation.id] = automation;
    });
    await this.fetchWorkspaceSprints(workspaceSlug, automation.id);
    return automation;
  };

  updateWorkspaceSprintAutomationSortOrder = async (workspaceSlug: string, automationId: string, sortOrder: number) => {
    const previousSortOrder = this.automationMap[automationId]?.sort_order;
    try {
      runInAction(() => {
        if (this.automationMap[automationId]) this.automationMap[automationId].sort_order = sortOrder;
      });
      const automation = await this.sprintService.updateAutomation(workspaceSlug, automationId, {
        sort_order: sortOrder,
      } as Partial<TWorkspaceSprintAutomationPayload>);
      runInAction(() => {
        this.automationMap[automation.id] = automation;
      });
      return automation;
    } catch (error) {
      runInAction(() => {
        if (this.automationMap[automationId] && previousSortOrder !== undefined)
          this.automationMap[automationId].sort_order = previousSortOrder;
      });
      throw error;
    }
  };

  archiveWorkspaceSprintAutomation = async (workspaceSlug: string, automationId: string) => {
    return this.archiveWorkspaceSprintSquad(workspaceSlug, automationId);
  };

  archiveWorkspaceSprintSquad = async (workspaceSlug: string, squadId: string) => {
    const automation = await this.sprintService.archiveSquad(workspaceSlug, squadId);
    runInAction(() => {
      this.automationMap[automation.id] = automation;
    });
    return automation;
  };

  restoreWorkspaceSprintAutomation = async (workspaceSlug: string, automationId: string) => {
    return this.restoreWorkspaceSprintSquad(workspaceSlug, automationId);
  };

  restoreWorkspaceSprintSquad = async (workspaceSlug: string, squadId: string) => {
    const automation = await this.sprintService.restoreSquad(workspaceSlug, squadId);
    runInAction(() => {
      this.automationMap[automation.id] = automation;
    });
    return automation;
  };

  deleteWorkspaceSprintAutomation = async (workspaceSlug: string, automationId: string) => {
    return this.deleteWorkspaceSprintSquad(workspaceSlug, automationId);
  };

  deleteWorkspaceSprintSquad = async (workspaceSlug: string, squadId: string) => {
    await this.sprintService.deleteSquad(workspaceSlug, squadId);
    runInAction(() => {
      delete this.automationMap[squadId];
      delete this.automationMemberMap[squadId];
      Object.values(this.sprintMap).forEach((sprint) => {
        if (sprint.automation_id === squadId) delete this.sprintMap[sprint.id];
      });
      Object.values(this.archivedSprintMap).forEach((sprint) => {
        if (sprint.automation_id === squadId) delete this.archivedSprintMap[sprint.id];
      });
    });
  };

  fetchWorkspaceSprintAutomationMembers = async (workspaceSlug: string, automationId: string) => {
    return this.fetchWorkspaceSprintSquadMembers(workspaceSlug, automationId);
  };

  fetchWorkspaceSprintSquadMembers = async (workspaceSlug: string, squadId: string) => {
    const members = await this.sprintService.listSquadMembers(workspaceSlug, squadId);
    runInAction(() => {
      this.automationMemberMap[squadId] = members;
      if (this.automationMap[squadId]) {
        this.automationMap[squadId].member_ids = members.map((member) => member.member);
      }
    });
    return members;
  };

  updateWorkspaceSprintAutomationMembers = async (workspaceSlug: string, automationId: string, memberIds: string[]) => {
    return this.updateWorkspaceSprintSquadMembers(workspaceSlug, automationId, memberIds);
  };

  updateWorkspaceSprintSquadMembers = async (workspaceSlug: string, squadId: string, memberIds: string[]) => {
    const previousMembers = this.automationMemberMap[squadId];
    const previousMemberIds = this.automationMap[squadId]?.member_ids;

    try {
      runInAction(() => {
        if (this.automationMap[squadId]) this.automationMap[squadId].member_ids = memberIds;
      });
      const members = await this.sprintService.updateSquadMembers(workspaceSlug, squadId, memberIds);
      runInAction(() => {
        this.automationMemberMap[squadId] = members;
        if (this.automationMap[squadId]) {
          this.automationMap[squadId].member_ids = members.map((member) => member.member);
        }
      });
      return members;
    } catch (error) {
      runInAction(() => {
        if (previousMembers) this.automationMemberMap[squadId] = previousMembers;
        if (this.automationMap[squadId]) this.automationMap[squadId].member_ids = previousMemberIds;
      });
      throw error;
    }
  };

  fetchWorkspaceSprints = async (workspaceSlug: string, automationId?: string) => {
    try {
      this.loader = true;
      const sprints = await this.sprintService.list(
        workspaceSlug,
        automationId ? { automation_id: automationId } : undefined
      );

      runInAction(() => {
        sprints.forEach((sprint) => {
          this.sprintMap[sprint.id] = sprint;
          delete this.archivedSprintMap[sprint.id];
        });
        this.fetchedMap[workspaceSlug] = true;
        this.loader = false;
      });

      return sprints;
    } catch (error) {
      runInAction(() => {
        this.loader = false;
      });
      throw error;
    }
  };

  fetchArchivedWorkspaceSprints = async (workspaceSlug: string, automationId?: string) => {
    const sprints = await this.sprintService.listArchived(workspaceSlug, automationId);
    runInAction(() => {
      sprints.forEach((sprint) => {
        this.archivedSprintMap[sprint.id] = sprint;
        delete this.sprintMap[sprint.id];
      });
    });
    return sprints;
  };

  createWorkspaceSprint = async (workspaceSlug: string, data: Partial<TWorkspaceSprintCreatePayload>) => {
    const sprint = await this.sprintService.create(workspaceSlug, data);
    runInAction(() => {
      this.sprintMap[sprint.id] = sprint;
    });
    return sprint;
  };

  updateWorkspaceSprint = async (
    workspaceSlug: string,
    sprintId: string,
    data: Partial<TWorkspaceSprintCreatePayload>
  ) => {
    const sprint = await this.sprintService.update(workspaceSlug, sprintId, data);
    runInAction(() => {
      this.sprintMap[sprint.id] = sprint;
    });
    return sprint;
  };

  completeWorkspaceSprint = async (workspaceSlug: string, sprintId: string) => {
    const response = await this.sprintService.archive(workspaceSlug, sprintId);
    runInAction(() => {
      const sprint = this.sprintMap[sprintId];
      if (!sprint) return;
      const archivedSprint = { ...sprint, archived_at: response.archived_at, status: "archived" as const };
      this.archivedSprintMap[sprintId] = archivedSprint;
      delete this.sprintMap[sprintId];
    });
  };

  addIssueToSprint = async (workspaceSlug: string, sprintId: string, issueId: string) => {
    const issueBeforeUpdate = this.rootStore.issue.issues.getIssueById(issueId);
    const sprint = this.getSprintById(sprintId);
    const optimisticUpdate: Partial<TIssue> = {
      global_sprint_id: sprintId,
      global_sprint_name: sprint?.name ?? issueBeforeUpdate?.global_sprint_name ?? null,
    };

    this.rootStore.issue.issues.updateIssue(issueId, optimisticUpdate);

    try {
      const response = await this.sprintService.addIssue(workspaceSlug, sprintId, issueId);
      this.rootStore.issue.issues.updateIssue(issueId, {
        global_sprint_id: response.sprint,
        global_sprint_name: this.getSprintNameById(response.sprint) ?? optimisticUpdate.global_sprint_name ?? null,
      });
    } catch (error) {
      if (issueBeforeUpdate) {
        this.rootStore.issue.issues.updateIssue(issueId, {
          global_sprint_id: issueBeforeUpdate.global_sprint_id,
          global_sprint_name: issueBeforeUpdate.global_sprint_name,
        });
      }
      throw error;
    }
  };

  removeIssueFromSprint = async (workspaceSlug: string, sprintId: string, issueId: string) => {
    const issueBeforeUpdate = this.rootStore.issue.issues.getIssueById(issueId);

    this.rootStore.issue.issues.updateIssue(issueId, {
      global_sprint_id: null,
      global_sprint_name: null,
    });

    try {
      await this.sprintService.removeIssue(workspaceSlug, sprintId, issueId);
    } catch (error) {
      if (issueBeforeUpdate) {
        this.rootStore.issue.issues.updateIssue(issueId, {
          global_sprint_id: issueBeforeUpdate.global_sprint_id,
          global_sprint_name: issueBeforeUpdate.global_sprint_name,
        });
      }
      throw error;
    }
  };
}
