import sortBy from "lodash/sortBy";
// types
import { IProject, TProjectDisplayFilters, TProjectFilters, TProjectOrderByOptions } from "@plane/types";
// constants
import { EUserProjectRoles } from "@/constants/project";
// helpers
import { getDate } from "@/helpers/date-time.helper";
import { satisfiesDateFilter } from "@/helpers/filter.helper";

/**
 * Updates the sort order of the project.
 * @param sortIndex
 * @param destinationIndex
 * @param projectId
 * @returns number | undefined
 */
export const orderJoinedProjects = (
  sourceIndex: number,
  destinationIndex: number,
  currentProjectId: string,
  joinedProjects: IProject[]
): number | undefined => {
  if (!currentProjectId || sourceIndex < 0 || destinationIndex < 0 || joinedProjects.length <= 0) return undefined;

  let updatedSortOrder: number | undefined = undefined;
  const sortOrderDefaultValue = 10000;

  if (destinationIndex === 0) {
    // updating project at the top of the project
    const currentSortOrder = joinedProjects[destinationIndex].sort_order || 0;
    updatedSortOrder = currentSortOrder - sortOrderDefaultValue;
  } else if (destinationIndex === joinedProjects.length) {
    // updating project at the bottom of the project
    const currentSortOrder = joinedProjects[destinationIndex - 1].sort_order || 0;
    updatedSortOrder = currentSortOrder + sortOrderDefaultValue;
  } else {
    // updating project in the middle of the project
    const destinationTopProjectSortOrder = joinedProjects[destinationIndex - 1].sort_order || 0;
    const destinationBottomProjectSortOrder = joinedProjects[destinationIndex].sort_order || 0;
    const updatedValue = (destinationTopProjectSortOrder + destinationBottomProjectSortOrder) / 2;
    updatedSortOrder = updatedValue;
  }

  return updatedSortOrder;
};

export const projectIdentifierSanitizer = (identifier: string): string =>
  identifier.replace(/[^ÇŞĞIİÖÜA-Za-z0-9]/g, "");

/**
 * @description Checks if the project should be rendered or not based on the user role
 * @param {IProject} project
 * @returns {boolean}
 */
export const shouldRenderProject = (project: IProject): boolean =>
  !!project.member_role && project.member_role >= EUserProjectRoles.MEMBER;

/**
 * @description filters projects based on the filter
 * @param {IProject} project
 * @param {TProjectFilters} filters
 * @param {TProjectDisplayFilters} displayFilters
 * @returns {boolean}
 */
export const shouldFilterProject = (
  project: IProject,
  displayFilters: TProjectDisplayFilters,
  filters: TProjectFilters
): boolean => {
  let fallsInFilters = true;
  Object.keys(filters).forEach((key) => {
    const filterKey = key as keyof TProjectFilters;
    if (filterKey === "access" && filters.access && filters.access.length > 0)
      fallsInFilters = fallsInFilters && filters.access.includes(`${project.network}`);
    if (filterKey === "lead" && filters.lead && filters.lead.length > 0)
      fallsInFilters = fallsInFilters && filters.lead.includes(`${project.project_lead}`);
    if (filterKey === "members" && filters.members && filters.members.length > 0) {
      const memberIds = project.members.map((member) => member.member_id);
      fallsInFilters = fallsInFilters && filters.members.some((memberId) => memberIds.includes(memberId));
    }
    if (filterKey === "created_at" && filters.created_at && filters.created_at.length > 0) {
      const createdDate = getDate(project.created_at);
      filters.created_at.forEach((dateFilter) => {
        fallsInFilters = fallsInFilters && !!createdDate && satisfiesDateFilter(createdDate, dateFilter);
      });
    }
  });
  if (displayFilters.my_projects && !project.is_member) fallsInFilters = false;
  if (displayFilters.archived_projects && !project.archived_at) fallsInFilters = false;
  if (project.archived_at) fallsInFilters = displayFilters.archived_projects ? fallsInFilters : false;

  return fallsInFilters;
};

/**
 * @description orders projects based on the orderByKey
 * @param {IProject[]} projects
 * @param {TProjectOrderByOptions | undefined} orderByKey
 * @returns {IProject[]}
 */
export const orderProjects = (projects: IProject[], orderByKey: TProjectOrderByOptions | undefined): IProject[] => {
  let orderedProjects: IProject[] = [];
  if (projects.length === 0) return orderedProjects;

  if (orderByKey === "sort_order") orderedProjects = sortBy(projects, [(p) => p.sort_order]);
  if (orderByKey === "name") orderedProjects = sortBy(projects, [(p) => p.name.toLowerCase()]);
  if (orderByKey === "-name") orderedProjects = sortBy(projects, [(p) => p.name.toLowerCase()]).reverse();
  if (orderByKey === "created_at") orderedProjects = sortBy(projects, [(p) => p.created_at]);
  if (orderByKey === "-created_at") orderedProjects = sortBy(projects, [(p) => !p.created_at]);
  if (orderByKey === "members_length") orderedProjects = sortBy(projects, [(p) => p.members.length]);
  if (orderByKey === "-members_length") orderedProjects = sortBy(projects, [(p) => p.members.length]).reverse();

  return orderedProjects;
};
