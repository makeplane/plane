/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * one board template for every project's work items board.
 *
 * While global_board.enabled is on, the project work items board reads its layout, display filters,
 * display properties and portable filters from the template, and the project-specific filters from
 * global_board.project_filters[projectId] (falling back to the project's own stored filters). Every change
 * from a board's menus is written to the user's board preferences, never to the project's ProjectUserProperty
 * row, so turning the setting off brings each project's own stored settings back unchanged.
 *
 * Only the project work items board (ProjectIssuesFilter) is wired; saved views, cycle and module boards
 * and the workspace views are out of scope.
 */

import { isEqual } from "lodash-es";
import { runInAction } from "mobx";
// plane imports
import type {
  IIssueDisplayFilterOptions,
  IIssueDisplayProperties,
  IIssueFilters,
  TWorkItemFilterExpression,
} from "@plane/types";
import { EIssuesStoreType } from "@plane/types";
// local imports
import type { TProjectEntityIds } from "./portable-filters";
import { combineExpressions, flattenExpression, splitExpression } from "./portable-filters";
import type { TBoardPreferences, TGlobalBoardTemplate } from "./service";
import type { TBoardPreferencesChangeSource } from "./store";
import { getBoardPreferencesStore } from "./store";

/** The parts of a board's filters that come from the project row. */
export type TOwnBoardFilters = {
  richFilters: TWorkItemFilterExpression;
  displayFilters: IIssueDisplayFilterOptions;
  displayProperties: IIssueDisplayProperties;
};

/** What the controller needs from the project filter store (kept structural to avoid an import cycle). */
export interface IGlobalBoardFilterHost {
  filters: { [projectId: string]: IIssueFilters };
  computedDisplayFilters(
    displayFilters: IIssueDisplayFilterOptions,
    defaultValues?: IIssueDisplayFilterOptions
  ): IIssueDisplayFilterOptions;
  computedDisplayProperties(filters: IIssueDisplayProperties): IIssueDisplayProperties;
  rootIssueStore: {
    currentUserId: string | undefined;
    projectId: string | undefined;
    workspaceSlug: string | undefined;
    projectIssues: {
      clear(shouldClearPaginationOptions?: boolean): void;
      fetchIssuesWithExistingPagination(workspaceSlug: string, projectId: string, loadType: "mutation"): unknown;
    };
    rootStore: {
      state: { getProjectStateIds: (projectId: string) => string[] | undefined };
      label: { getProjectLabelIds: (projectId: string) => string[] | undefined };
      cycle: { getProjectCycleIds: (projectId: string) => string[] | null };
      module: { getProjectModuleIds: (projectId: string) => string[] | null };
      memberRoot: {
        project: { getProjectMemberIds: (projectId: string, includeGuestUsers: boolean) => string[] | null };
      };
      workItemFilters: {
        resetExpression: (
          entityType: EIssuesStoreType,
          entityId: string,
          expression: TWorkItemFilterExpression
        ) => void;
      };
    };
  };
}

/** Same conditions, in any order. */
const sameConditions = (a: unknown, b: unknown) => {
  const key = (expression: unknown) =>
    flattenExpression(expression)
      .map((condition) => JSON.stringify(condition))
      .sort();
  return isEqual(key(a), key(b));
};

const SERVER_DISPLAY_KEYS: (keyof IIssueDisplayFilterOptions)[] = ["order_by", "sub_issue"];

export class GlobalBoardSettings {
  private host: IGlobalBoardFilterHost;
  /** each loaded project's own stored filters, kept while the template is on */
  private own = new Map<string, TOwnBoardFilters>();
  /** true while a remote change is pushed into a filter instance: its change callback must not write */
  isApplyingRemote = false;
  private settingsStore = getBoardPreferencesStore();

  constructor(host: IGlobalBoardFilterHost) {
    this.host = host;
    this.settingsStore.subscribe((next, previous, source) => this.onSettingsChange(next, previous, source));
  }

  private get userId() {
    return this.host.rootIssueStore.currentUserId;
  }

  private get board() {
    return this.settingsStore.settings.global_board;
  }

  /** True while this user's global template drives the project boards. */
  isActive(): boolean {
    return this.settingsStore.isLoadedFor(this.userId) && this.board.enabled;
  }

  // ---- reading ----

  private knownIds(projectId: string): TProjectEntityIds {
    const root = this.host.rootIssueStore.rootStore;
    return {
      state_id: root.state.getProjectStateIds(projectId),
      label_id: root.label.getProjectLabelIds(projectId),
      cycle_id: root.cycle.getProjectCycleIds(projectId),
      module_id: root.module.getProjectModuleIds(projectId),
      members: root.memberRoot.project.getProjectMemberIds(projectId, true),
    };
  }

  /** The board filters of a project while the template is on. */
  private compute(projectId: string, own: TOwnBoardFilters, template: TGlobalBoardTemplate): TOwnBoardFilters {
    const displayFilters = this.host.computedDisplayFilters({
      ...(template.display_filters ?? own.displayFilters),
      ...(template.layout ? { layout: template.layout } : {}),
    });
    const displayProperties = this.host.computedDisplayProperties(template.display_properties ?? own.displayProperties);
    const projectFilters = this.board.project_filters[projectId] ?? own.richFilters;
    const richFilters = combineExpressions(template.filters, projectFilters, this.knownIds(projectId), this.userId);
    return { richFilters, displayFilters, displayProperties };
  }

  /** Builds a template from a board (only its portable filters are kept). */
  private templateFrom(filters: TOwnBoardFilters): TGlobalBoardTemplate {
    return {
      layout: filters.displayFilters.layout ?? null,
      display_filters: { ...filters.displayFilters },
      display_properties: { ...filters.displayProperties },
      filters: splitExpression(filters.richFilters, this.userId).portable,
    };
  }

  /**
   * Called by fetchFilters with the project's own stored filters. Returns what the board shows: the
   * own filters when the template is off, the template's otherwise. Seeds an empty template.
   */
  async resolveFetched(projectId: string, own: TOwnBoardFilters): Promise<TOwnBoardFilters> {
    await this.settingsStore.ensure(this.userId);
    this.own.set(projectId, own);
    if (!this.isActive()) return own;
    let template = this.board.template;
    if (!template) {
      // turned on with no board to seed from (from the profile page): this board seeds it
      template = this.templateFrom(own);
      this.settingsStore.update({ global_board: { template } }).catch((error: unknown) => {
        console.error("global board seed failed", error);
      });
    }
    return this.compute(projectId, own, template);
  }

  // ---- writing ----

  private currentTemplate(projectId: string): TGlobalBoardTemplate {
    const filters = this.host.filters[projectId];
    const fallback = filters
      ? this.templateFrom({
          richFilters: filters.richFilters,
          displayFilters: filters.displayFilters ?? {},
          displayProperties: filters.displayProperties ?? {},
        })
      : {};
    return { ...fallback, ...this.board.template };
  }

  /** A display filter change on a board while the template is on. */
  async saveDisplayFilters(projectId: string, displayFilters: IIssueDisplayFilterOptions) {
    const template = {
      ...this.currentTemplate(projectId),
      layout: displayFilters.layout ?? null,
      display_filters: { ...displayFilters },
    };
    await this.settingsStore.update({ global_board: { template } });
  }

  /** A display property change on a board while the template is on. */
  async saveDisplayProperties(projectId: string, displayProperties: IIssueDisplayProperties) {
    const template = { ...this.currentTemplate(projectId), display_properties: { ...displayProperties } };
    await this.settingsStore.update({ global_board: { template } });
  }

  /** A filter change on a board while the template is on: portable part to the template, the rest per project. */
  async saveRichFilters(projectId: string, expression: TWorkItemFilterExpression) {
    const { portable, project } = splitExpression(expression, this.userId);
    const template = { ...this.currentTemplate(projectId), filters: portable };
    await this.settingsStore.update({ global_board: { template, project_filters: { [projectId]: project } } });
  }

  /**
   * Turns the template on or off. Turning it on seeds the template from `seedProjectId`'s board (the
   * board the user is on, or the last one loaded); without one, the next board that loads seeds it.
   */
  async setEnabled(enabled: boolean, seedProjectId?: string) {
    await this.settingsStore.ensure(this.userId);
    if (!enabled) {
      await this.settingsStore.update({ global_board: { enabled: false } });
      return;
    }
    const projectId = seedProjectId && this.host.filters[seedProjectId] ? seedProjectId : this.lastLoadedProjectId();
    const filters = projectId ? this.host.filters[projectId] : undefined;
    const template = filters
      ? this.templateFrom({
          richFilters: filters.richFilters,
          displayFilters: filters.displayFilters ?? {},
          displayProperties: filters.displayProperties ?? {},
        })
      : null;
    await this.settingsStore.update({ global_board: { enabled: true, template, project_filters: null } });
  }

  private lastLoadedProjectId(): string | undefined {
    const current = this.host.rootIssueStore.projectId;
    if (current && this.host.filters[current]) return current;
    const ids = [...this.own.keys()].filter((id) => this.host.filters[id]);
    return ids[ids.length - 1];
  }

  // ---- applying ----

  private onSettingsChange(
    next: TBoardPreferences,
    previous: TBoardPreferences,
    source: TBoardPreferencesChangeSource
  ) {
    const wasOn = previous.global_board.enabled;
    const isOn = next.global_board.enabled;
    if (!wasOn && isOn) {
      // the boards in memory show their own settings now: remember them for when the template goes off
      for (const [projectId, filters] of Object.entries(this.host.filters)) {
        if (!filters?.displayFilters) continue;
        this.own.set(projectId, {
          richFilters: filters.richFilters,
          displayFilters: filters.displayFilters,
          displayProperties: filters.displayProperties ?? {},
        });
      }
    }
    if (!wasOn && !isOn) return;
    if (wasOn && isOn && isEqual(previous.global_board, next.global_board)) return;
    // a local write was already applied to the board it came from
    this.applyAll(source === "local" && wasOn && isOn ? this.host.rootIssueStore.projectId : undefined);
  }

  /** Recomputes every loaded project board. `skipProjectId` is left as it is. */
  private applyAll(skipProjectId?: string) {
    const active = this.board.enabled;
    const template = this.board.template;
    for (const [projectId, own] of this.own) {
      if (projectId === skipProjectId || !this.host.filters[projectId]) continue;
      let target = own;
      if (active) {
        if (!template) continue; // seeded by the next board that loads
        target = this.compute(projectId, own, template);
      }
      this.applyToProject(projectId, target);
    }
  }

  private applyToProject(projectId: string, target: TOwnBoardFilters) {
    const host = this.host;
    const current = host.filters[projectId];
    if (!current) return;
    const before = current.displayFilters ?? {};
    const richChanged = !sameConditions(current.richFilters, target.richFilters);
    const layoutChanged = before.layout !== target.displayFilters.layout;
    const refetchNeeded = richChanged || SERVER_DISPLAY_KEYS.some((key) => before[key] !== target.displayFilters[key]);
    if (
      !richChanged &&
      isEqual(before, target.displayFilters) &&
      isEqual(current.displayProperties ?? {}, target.displayProperties)
    )
      return;

    runInAction(() => {
      host.filters[projectId] = {
        ...current,
        richFilters: richChanged ? target.richFilters : current.richFilters,
        displayFilters: target.displayFilters,
        displayProperties: target.displayProperties,
      };
    });

    if (richChanged) {
      this.isApplyingRemote = true;
      try {
        host.rootIssueStore.rootStore.workItemFilters.resetExpression(
          EIssuesStoreType.PROJECT,
          projectId,
          target.richFilters
        );
      } catch (error) {
        console.error("global board filter reset failed", error);
      } finally {
        this.isApplyingRemote = false;
      }
    }

    // only the board on screen holds work items to refresh
    const workspaceSlug = host.rootIssueStore.workspaceSlug;
    if (projectId !== host.rootIssueStore.projectId || !workspaceSlug) return;
    if (layoutChanged) host.rootIssueStore.projectIssues.clear(true);
    else if (refetchNeeded)
      void host.rootIssueStore.projectIssues.fetchIssuesWithExistingPagination(workspaceSlug, projectId, "mutation");
  }
}
