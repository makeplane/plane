/* eslint-disable no-useless-catch */

import { isEmpty, set } from "lodash-es";
import { action, computed, makeObservable, observable } from "mobx";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
// plane web store helpers
import { IProjectFilterHelper, ProjectFilterHelper } from "@/plane-web/store/workspace-project-states/filters";
// plane web types
import { TProject } from "@/plane-web/types/projects";
import {
  EProjectFilters,
  EProjectLayouts,
  EProjectScope,
  TProjectAttributes,
  TProjectDisplayFilters,
  TProjectFilters,
  TProjectLayouts,
  TProjectScope,
  TProjectsLayoutStructure,
} from "@/plane-web/types/workspace-project-filters";

export interface IProjectFilterStore extends IProjectFilterHelper {
  // constants
  // observables
  scopeMap: Record<string, TProjectScope>; // workspace_slug -> TProjectScope
  layoutMap: Record<string, TProjectLayouts>; // workspace_slug -> TProjectLayouts
  attributesMap: Record<string, TProjectAttributes>; // workspace_slug -> TProjectAttributes
  displayFiltersMap: Record<string, TProjectDisplayFilters>; // workspace_slug -> TProjectDisplayFilters
  searchQuery: string | undefined; // string
  loading: boolean;
  // computed
  filters: TProjectFilters | undefined;
  scopeProjectsCount: Record<TProjectScope, number>;
  appliedAttributesCount: number;
  filteredProjectIds: TProject[] | undefined;
  // computed methods
  getFilteredProjectsByLayout: <T extends keyof TProjectsLayoutStructure>(
    layout: T
  ) => TProjectsLayoutStructure[T] | undefined;
  // helpers actions
  // actions
  initWorkspaceFilters: (
    workspaceSlug: string,
    scope?: EProjectScope,
    filtersToInit?: EProjectFilters[],
    isArchived?: boolean
  ) => void;
  updateScope: (workspaceSlug: string, scope: TProjectScope, setLocalStorage?: boolean) => void;
  updateLayout: (
    workspaceSlug: string,
    layout: TProjectLayouts,
    isArchived?: boolean,
    setLocalStorage?: boolean
  ) => void;
  updateAttributes: <T extends keyof TProjectAttributes>(
    workspaceSlug: string,
    key: T,
    values: TProjectAttributes[T],
    isArchived?: boolean,
    setLocalStorage?: boolean
  ) => void;
  updateDisplayFilters: <T extends keyof TProjectDisplayFilters>(
    workspaceSlug: string,
    key: T,
    values: TProjectDisplayFilters[T],
    isArchived?: boolean,
    setLocalStorage?: boolean
  ) => void;
  bulkUpdateDisplayFilters: (workspaceSlug: string, values: Partial<TProjectDisplayFilters>) => void;
  updateSearchQuery: (query: string | undefined) => void;
  clearAllFilters: (workspaceSlug: string, isArchived?: boolean) => void;
}

export class ProjectFilterStore extends ProjectFilterHelper implements IProjectFilterStore {
  // constants
  // observables
  scopeMap: Record<string, TProjectScope> = {};
  layoutMap: Record<string, TProjectLayouts> = {};
  attributesMap: Record<string, TProjectAttributes> = {};
  displayFiltersMap: Record<string, TProjectDisplayFilters> = {};
  searchQuery: string | undefined = "";
  loading = true;

  constructor(public store: RootStore) {
    super(store);
    makeObservable(this, {
      // observables
      loading: observable,
      scopeMap: observable,
      layoutMap: observable,
      attributesMap: observable,
      displayFiltersMap: observable,
      searchQuery: observable.ref,
      // computed
      filters: computed,
      scopeProjectsCount: computed,
      appliedAttributesCount: computed,
      filteredProjectIds: computed,
      // actions
      initWorkspaceFilters: action,
      updateScope: action,
      updateLayout: action,
      updateAttributes: action,
      updateDisplayFilters: action,
      bulkUpdateDisplayFilters: action,
      updateSearchQuery: action,
      clearAllFilters: action,
    });
  }

  // computed
  /**
   * @description get filters by workspace slug
   * @returns { TProjectFilters | undefined }
   */
  get filters(): TProjectFilters | undefined {
    const { workspaceSlug } = this.store.router;
    if (!workspaceSlug) return undefined;
    return {
      scope: this.scopeMap[workspaceSlug],
      layout: this.layoutMap[workspaceSlug],
      attributes: this.attributesMap[workspaceSlug],
      display_filters: this.displayFiltersMap[workspaceSlug],
    };
  }

  /**
   * @description get scope projects count
   * @returns { Record<TProjectScope, number> }
   */
  get scopeProjectsCount(): Record<TProjectScope, number> {
    const defaultCounts = {
      [EProjectScope.ALL_PROJECTS]: 0,
      [EProjectScope.MY_PROJECTS]: 0,
      [EProjectScope.TEAMSPACE_PROJECTS]: 0,
    };
    const workspaceDetails = this.store.workspaceRoot.currentWorkspace;
    const projectStore = this.store.projectRoot.project;
    const projectMap = projectStore.projectMap;
    if (!workspaceDetails || isEmpty(projectMap)) return defaultCounts;

    const projects = Object.values(projectMap).filter((p) => p.workspace === workspaceDetails.id && !p.archived_at);
    if (projects.length === 0) return defaultCounts;

    // get teamspace details
    const teamStore = this.store.teamspaceRoot.teamspaces;
    const currentTeamSpaceId = this.store.router.teamspaceId;
    const teamDetails = currentTeamSpaceId ? teamStore.getTeamspaceById(currentTeamSpaceId) : undefined;

    return {
      [EProjectScope.ALL_PROJECTS]: this.filterProjectsByScope(projects, EProjectScope.ALL_PROJECTS).length,
      [EProjectScope.MY_PROJECTS]: this.filterProjectsByScope(projects, EProjectScope.MY_PROJECTS).length,
      [EProjectScope.TEAMSPACE_PROJECTS]: this.filterProjectsByScope(
        projects,
        EProjectScope.TEAMSPACE_PROJECTS,
        teamDetails?.project_ids ?? []
      ).length,
    };
  }

  /**
   * @description get applied filters count
   * @returns { number }
   */
  get appliedAttributesCount(): number {
    if (!this.filters) return 0;
    const attributes = this.filters.attributes;
    if (isEmpty(attributes)) return 0;
    const filters = Object.keys(attributes).filter(
      (key: string) => key !== "archived" && (attributes as Record<string, any>)[key].length > 0
    );
    return filters.length;
  }

  /**
   * @description returns filtered projects based on filters and search query
   * @returns { TProject[] | undefined }
   */
  get filteredProjectIds(): TProject[] | undefined {
    const workspaceDetails = this.store.workspaceRoot.currentWorkspace;
    const projectStore = this.store.projectRoot.project;
    const projectMap = projectStore.projectMap;
    this.loading = projectStore.loader === "init-loader";
    if (isEmpty(projectMap) || !this.filters || !workspaceDetails) return undefined;

    // get teamspace details
    const teamStore = this.store.teamspaceRoot.teamspaces;
    const currentTeamSpaceId = this.store.router.teamspaceId;
    const teamDetails = currentTeamSpaceId ? teamStore.getTeamspaceById(currentTeamSpaceId) : undefined;

    let projects = Object.values(projectMap).filter((p) => p.workspace === workspaceDetails.id);
    // filter projects based on scope
    projects = this.filters.scope
      ? this.filterProjectsByScope(projects, this.filters.scope, teamDetails?.project_ids ?? [])
      : projects;
    // filter projects based on attributes
    projects = this.filters.attributes ? this.filterProjectsByAttributes(projects, this.filters.attributes) : projects;
    // filter projects based on the display filters order_by and sort_order
    projects = this.filters.display_filters
      ? this.sortProjectsByDisplayFilters(
          projects,
          this.filters.display_filters?.sort_by,
          this.filters.display_filters?.sort_order
        )
      : projects;
    // filter projects based on search query
    projects = this.filterProjectsBySearchQuery(projects, this.searchQuery);

    this.loading = false;
    return projects;
  }
  // computed methods
  /**
   * @description get filtered projects based on layout
   * @param { T } layout
   * @returns { TProjectsLayoutStructure[T] | undefined }
   */
  getFilteredProjectsByLayout = <T extends keyof TProjectsLayoutStructure>(
    layout: T
  ): TProjectsLayoutStructure[T] | undefined => {
    const projects = this.filteredProjectIds;
    const groupBy = this.filters?.display_filters?.group_by;
    if (!projects || !groupBy) return undefined;

    if (layout === EProjectLayouts.BOARD) {
      return this.filterProjectsByGroup(projects, groupBy) as TProjectsLayoutStructure[T];
    } else {
      return projects.map((project) => project.id) as TProjectsLayoutStructure[T];
    }
  };

  // helpers actions
  // actions
  /**
   * @description initialize workspace filters
   * @param { string } workspaceSlug
   * @returns { void }
   */
  initWorkspaceFilters = (
    workspaceSlug: string,
    scope?: EProjectScope,
    filtersToInit?: EProjectFilters[],
    isArchived = false
  ): void => {
    const savedFilters = this.handleProjectLocalFilters.get(workspaceSlug, isArchived);

    if (filtersToInit?.includes(EProjectFilters.SCOPE))
      this.updateScope(
        workspaceSlug,
        scope ||
          (this.scopeProjectsCount[EProjectScope.MY_PROJECTS] > 0
            ? EProjectScope.MY_PROJECTS
            : EProjectScope.ALL_PROJECTS)
      );
    // setLocalStorage is being sent as false becasue these values are fetched from the local storage only and only the store needs to be updates
    if (!this.layoutMap[workspaceSlug] && filtersToInit?.includes(EProjectFilters.LAYOUT)) {
      this.updateLayout(workspaceSlug, savedFilters?.layout || EProjectLayouts.GALLERY, isArchived, false);
    }
    if (!this.attributesMap[workspaceSlug] && filtersToInit?.includes(EProjectFilters.ATTRIBUTES)) {
      this.updateAttributes(workspaceSlug, "priority", savedFilters?.attributes?.priority || [], isArchived, false);
      this.updateAttributes(workspaceSlug, "state", savedFilters?.attributes?.state || [], isArchived, false);
      this.updateAttributes(workspaceSlug, "lead", savedFilters?.attributes?.lead || [], isArchived, false);
      this.updateAttributes(workspaceSlug, "members", savedFilters?.attributes?.members || [], isArchived, false);
      this.updateAttributes(workspaceSlug, "access", savedFilters?.attributes?.access || [], isArchived, false);
    }
    if (!this.displayFiltersMap[workspaceSlug] && filtersToInit?.includes(EProjectFilters.DISPLAY_FILTERS)) {
      this.updateDisplayFilters(
        workspaceSlug,
        "group_by",
        savedFilters?.display_filters?.group_by || "states",
        isArchived,
        false
      );
      this.updateDisplayFilters(
        workspaceSlug,
        "sort_by",
        savedFilters?.display_filters?.sort_by || "manual",
        isArchived,
        false
      );
      this.updateDisplayFilters(
        workspaceSlug,
        "sort_order",
        savedFilters?.display_filters?.sort_order || "asc",
        isArchived,
        false
      );
    }
  };

  /**
   * @description update scope
   * @param { string } workspaceSlug
   * @param { TProjectScope } scope
   * @returns { void }
   */
  updateScope = (workspaceSlug: string, scope: TProjectScope, setLocalStorage = true): void => {
    set(this.scopeMap, workspaceSlug, scope);
    if (setLocalStorage) this.handleProjectLocalFilters.set("scope", workspaceSlug, { scope }, false);
  };

  /**
   * @description update layout
   * @param { string } workspaceSlug
   * @param { TProjectLayouts } layout
   * @returns { void }
   */
  updateLayout = (workspaceSlug: string, layout: TProjectLayouts, isArchived = false, setLocalStorage = true): void => {
    set(this.layoutMap, workspaceSlug, layout);
    if (setLocalStorage) this.handleProjectLocalFilters.set("layout", workspaceSlug, { layout }, isArchived);
  };

  /**
   * @description update attributes
   * @param { string } workspaceSlug
   * @param { T } key
   * @param { TProjectAttributes[T] } values
   * @returns { void }
   */
  updateAttributes = <T extends keyof TProjectAttributes>(
    workspaceSlug: string,
    key: T,
    values: TProjectAttributes[T],
    isArchived = false,
    setLocalStorage = true
  ): void => {
    set(this.attributesMap, [workspaceSlug, key], values);
    if (setLocalStorage)
      this.handleProjectLocalFilters.set(
        "attributes",
        workspaceSlug,
        {
          attributes: { ...this.attributesMap[workspaceSlug], [key]: values },
        },
        isArchived
      );
  };

  /**
   * @description update display filters
   * @param { string } workspaceSlug
   * @param { T } key
   * @param { TProjectDisplayFilters[T] } values
   * @returns { void }
   */
  updateDisplayFilters = <T extends keyof TProjectDisplayFilters>(
    workspaceSlug: string,
    key: T,
    values: TProjectDisplayFilters[T],
    isArchived = false,
    setLocalStorage = true
  ): void => {
    set(this.displayFiltersMap, [workspaceSlug, key], values);
    if (setLocalStorage)
      this.handleProjectLocalFilters.set(
        "display_filters",
        workspaceSlug,
        {
          display_filters: { ...this.displayFiltersMap[workspaceSlug], [key]: values },
        },
        isArchived
      );
  };

  /**
   * @description update display filters
   * @param { string } workspaceSlug
   * @param { Partial<TProjectDisplayFilters> } values
   * @returns { void }
   */
  bulkUpdateDisplayFilters = (workspaceSlug: string, values: Partial<TProjectDisplayFilters>): void => {
    this.displayFiltersMap[workspaceSlug] = {
      ...this.displayFiltersMap[workspaceSlug],
      ...values,
    };
  };

  /**
   * @description update search query
   * @param { string | undefined } query
   * @returns { void }
   */
  updateSearchQuery = (query: string | undefined): void => {
    this.searchQuery = query;
  };

  /**
   * @description clear all the attributes
   * @param { string } workspaceSlug
   * @param { boolean } isArchived
   * @returns { void }
   */
  clearAllFilters = (workspaceSlug: string, isArchived: boolean = false): void => {
    this.attributesMap[workspaceSlug] = { archived: isArchived } as TProjectAttributes;
    this.handleProjectLocalFilters.set(
      "attributes",
      workspaceSlug,
      {
        attributes: { archived: isArchived } as TProjectAttributes,
      },
      isArchived
    );
  };
}
