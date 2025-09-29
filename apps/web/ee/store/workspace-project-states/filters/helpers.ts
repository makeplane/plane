import { includes, isEmpty, orderBy, reverse, sortBy } from "lodash-es";
// plane web constants
import { storage } from "@/lib/local-storage";
import { PROJECT_PRIORITIES } from "@/plane-web/constants/project";
// plane web store
import { RootStore } from "@/plane-web/store/root.store";
// plane web types
import { TProject } from "@/plane-web/types/projects";
import {
  EProjectScope,
  TProjectAttributes,
  TProjectsBoardLayoutStructure,
  TProjectGroupBy,
  TProjectSortBy,
  TProjectSortOrder,
  TProjectPriority,
  TProjectFilters,
} from "@/plane-web/types/workspace-project-filters";

export interface IProjectFilterHelper {
  filterProjectsByScope: (projects: TProject[], scope: EProjectScope) => TProject[];
  filterProjectsByAttributes: (projects: TProject[], attributes: Partial<TProjectAttributes>) => TProject[];
  sortProjectsByDisplayFilters: (
    projects: TProject[],
    filterSortBy: TProjectSortBy,
    sortOrder: TProjectSortOrder
  ) => TProject[];
  filterProjectsBySearchQuery: (projects: TProject[], searchQuery: string | undefined) => TProject[];
  filterProjectsByGroup: (projects: TProject[], groupBy: TProjectGroupBy) => TProjectsBoardLayoutStructure | undefined;
}

export abstract class ProjectFilterHelper implements IProjectFilterHelper {
  constructor(public store: RootStore) {}

  /**
   * @description filter the projects based on the scope
   * @param { TProject[] } projects
   * @param { EProjectScope } scope
   * @returns { TProject[] }
   */
  filterProjectsByScope = (projects: TProject[], scope: EProjectScope, scopeProjectIds?: string[]): TProject[] =>
    projects.filter((project) => {
      switch (scope) {
        case EProjectScope.ALL_PROJECTS:
          return true;
        case EProjectScope.MY_PROJECTS:
          return !!project.member_role;
        case EProjectScope.TEAMSPACE_PROJECTS:
          return scopeProjectIds?.includes(project.id);
        default:
          return true;
      }
    });

  /**
   * @description filter the projects based on attributes
   * @param { TProject[] } projects
   * @param { Partial<TProjectAttributes> } attributes
   * @returns { TProject[] }
   */
  filterProjectsByAttributes = (projects: TProject[], attributes: Partial<TProjectAttributes>): TProject[] =>
    projects.filter((project) => {
      let isMatched = true;
      // filter based on priority attribute
      if (attributes.priority && attributes.priority.length > 0 && project.priority) {
        const projectPriority = project?.priority || "none";
        isMatched = isMatched && includes(attributes.priority, projectPriority);
      }
      // filter based on state attribute
      if (attributes.state && attributes.state.length > 0) {
        isMatched = isMatched && includes(attributes.state, project?.state_id);
      }
      // filter based on lead attribute
      if (attributes.lead && attributes.lead.length > 0) {
        let projectLead = project?.project_lead || undefined;
        projectLead = projectLead && (typeof projectLead === "string" ? projectLead : projectLead?.id);
        isMatched = isMatched && includes(attributes.lead, projectLead);
      }
      // filter based on members attribute
      if (attributes.members && attributes.members.length > 0) {
        const projectMemberIds = project.members || [];
        isMatched = isMatched && attributes.members.some((member) => projectMemberIds.includes(member));
      }
      // filter based on access attribute
      if (attributes.access && attributes.access.length > 0) {
        const projectNetwork = project.network === 2 ? "public" : "private";
        isMatched = isMatched && includes(attributes.access, projectNetwork);
      }
      // filter based on archived attribute
      if (attributes.archived) {
        isMatched = isMatched && project.archived_at !== null;
      } else {
        isMatched = isMatched && project.archived_at === null;
      }
      return isMatched;
    });

  /**
   * @description sort the project based on the display filters order_by and sort_order
   */
  sortProjectsByDisplayFilters = (
    projects: TProject[],
    filterSortBy: TProjectSortBy,
    sortOrder: TProjectSortOrder
  ): TProject[] => {
    const sortedProjects = sortBy(projects, "created_at", "desc");

    switch (filterSortBy) {
      case "manual":
        return orderBy(sortedProjects, "sort_order", sortOrder);
      case "name":
        return orderBy(sortedProjects, "name", sortOrder);
      case "created_date":
        return orderBy(sortedProjects, "created_at", sortOrder);
      case "start_date":
        return orderBy(sortedProjects, "start_date", sortOrder);
      case "end_date":
        return orderBy(sortedProjects, "target_date", sortOrder);
      case "members_count": {
        let sortedData = sortBy(sortedProjects, (project) => project.members?.length);
        if (sortOrder === "desc") sortedData = reverse(sortedData);
        return sortedData;
      }
      case "state": {
        const workspaceId = this.store.workspaceRoot.currentWorkspace?.id;
        if (!workspaceId) return sortedProjects;
        const projectStateGroupedIds = this.store.workspaceProjectStates.getProjectStateIdsByWorkspaceId(workspaceId);
        if (!projectStateGroupedIds) return sortedProjects;
        return sortBy(sortedProjects, (p) => projectStateGroupedIds.indexOf(p.state_id || ""));
      }
      case "priority": {
        let sortPriority = PROJECT_PRIORITIES.map((priority) => priority.key);
        if (sortOrder === "desc") sortPriority = reverse(sortPriority);
        return sortBy(sortedProjects, (p) => sortPriority.indexOf(p.priority as TProjectPriority));
      }
      default:
        return sortedProjects;
    }
  };

  /**
   * @description filter the projects based on search query
   * @param { TProject[] } projects
   * @param { string } searchQuery
   * @returns { TProject[] }
   */
  filterProjectsBySearchQuery = (projects: TProject[], searchQuery: string | undefined): TProject[] => {
    if (!searchQuery) return projects;
    return projects.filter((project) => project.name.toLowerCase().includes(searchQuery.toLowerCase()));
  };

  /**
   * @description filter the projects based on the display filters group_by
   */
  filterProjectsByGroup = (
    projects: TProject[],
    groupBy: TProjectGroupBy
  ): TProjectsBoardLayoutStructure | undefined => {
    const workspaceId = this.store.workspaceRoot.currentWorkspace?.id;
    if (!workspaceId) return undefined;

    switch (groupBy) {
      // project grouping by state_id
      case "states": {
        const projectStateIds =
          this.store.workspaceProjectStates.getProjectStateIdsWithGroupingByWorkspaceId(workspaceId);
        const projectStateIdsArray = projectStateIds ? Object.values(projectStateIds).flat() : [];
        const projectsByStates = {} as TProjectsBoardLayoutStructure;
        (projectStateIdsArray || []).forEach((stateId) => {
          const stateFilteredProjects = projects.filter((project) => project.state_id === stateId);
          projectsByStates[stateId] = stateFilteredProjects.map((project) => project.id);
        });
        return projectsByStates;
      }
      // project grouping by state_group
      case "state_groups": {
        const projectStateIdsWithGroup =
          this.store.workspaceProjectStates.getProjectStateIdsWithGroupingByWorkspaceId(workspaceId);
        const projectsByStateGroups = {} as TProjectsBoardLayoutStructure;
        !isEmpty(projectStateIdsWithGroup) &&
          Object.entries(projectStateIdsWithGroup).forEach(([stateGroup, stateIds]) => {
            const stateFilteredProjects = projects.filter((project) => stateIds.includes(project.state_id || ""));
            projectsByStateGroups[stateGroup] = stateFilteredProjects.map((project) => project.id);
          });
        return projectsByStateGroups;
      }
      // project grouping by priority
      case "priority": {
        const projectPriorities = PROJECT_PRIORITIES.map((priority) => priority.key);
        const projectsByPriority = {} as TProjectsBoardLayoutStructure;
        (projectPriorities || []).forEach((priority) => {
          const priorityFilteredProjects = projects.filter((project) => project.priority === priority);
          projectsByPriority[priority] = priorityFilteredProjects.map((project) => project.id);
        });
        return projectsByPriority;
      }
      // project grouping by created_by
      case "created_by": {
        const workspaceMemberIds = this.store.memberRoot.workspace.workspaceMemberIds;
        const projectsByCreatedBy = {} as TProjectsBoardLayoutStructure;
        (workspaceMemberIds || []).forEach((member_id) => {
          const createdByFilteredProjects = projects.filter((project) => project.created_by === member_id);
          projectsByCreatedBy[member_id] = createdByFilteredProjects.map((project) => project.id);
        });
        return projectsByCreatedBy;
      }
      default:
        return undefined;
    }
  };

  handleProjectLocalFilters = {
    fetchFiltersFromStorage: () => {
      const _filters = storage.get("project_local_filters");
      return _filters ? JSON.parse(_filters) : {};
    },

    get: (workspaceSlug: string, isArchived: boolean) => {
      const storageFilters = this.handleProjectLocalFilters.fetchFiltersFromStorage();
      const workspaceFilters = storageFilters[workspaceSlug];

      if (!workspaceFilters) return undefined;

      return workspaceFilters[isArchived ? "archived-project-filters" : "global-project-filters"] || {};
    },

    set: (
      filterType: keyof TProjectFilters,
      workspaceSlug: string,
      filters: Partial<TProjectFilters>,
      isArchived: boolean
    ) => {
      const storageFilters = this.handleProjectLocalFilters.fetchFiltersFromStorage();

      const workspaceFilters = storageFilters[workspaceSlug] || {
        "archived-project-filters": {},
        "global-project-filters": {},
      };

      const projectFilterKey = isArchived ? "archived-project-filters" : "global-project-filters";

      workspaceFilters[projectFilterKey] = {
        ...workspaceFilters[projectFilterKey],
        [filterType]: filters[filterType],
      };

      storageFilters[workspaceSlug] = workspaceFilters;
      storage.set("project_local_filters", JSON.stringify(storageFilters));
    },
  };
}
