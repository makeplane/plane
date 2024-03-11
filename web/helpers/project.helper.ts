import sortBy from "lodash/sortBy";
// helpers
import { satisfiesDateFilter } from "helpers/filter.helper";
// types
import { IProject, TProjectFilters, TProjectOrderByOptions } from "@plane/types";

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
  } else if (destinationIndex === joinedProjects.length - 1) {
    // updating project at the bottom of the project
    const currentSortOrder = joinedProjects[destinationIndex - 1].sort_order || 0;
    updatedSortOrder = currentSortOrder + sortOrderDefaultValue;
  } else {
    // updating project in the middle of the project
    if (sourceIndex > destinationIndex) {
      const destinationTopProjectSortOrder = joinedProjects[destinationIndex - 1].sort_order || 0;
      const destinationBottomProjectSortOrder = joinedProjects[destinationIndex].sort_order || 0;
      const updatedValue = (destinationTopProjectSortOrder + destinationBottomProjectSortOrder) / 2;
      updatedSortOrder = updatedValue;
    } else {
      const destinationTopProjectSortOrder = joinedProjects[destinationIndex].sort_order || 0;
      const destinationBottomProjectSortOrder = joinedProjects[destinationIndex + 1].sort_order || 0;
      const updatedValue = (destinationTopProjectSortOrder + destinationBottomProjectSortOrder) / 2;
      updatedSortOrder = updatedValue;
    }
  }

  return updatedSortOrder;
};

export const projectIdentifierSanitizer = (identifier: string): string =>
  identifier.replace(/[^ÇŞĞIİÖÜA-Za-z0-9]/g, "");

/**
 * @description filters projects based on the filter
 * @param {IProject} project
 * @param {TProjectFilters} filter
 * @returns {boolean}
 */
export const shouldFilterProject = (project: IProject, filter: TProjectFilters): boolean => {
  let fallsInFilters = true;
  Object.keys(filter).forEach((key) => {
    const filterKey = key as keyof TProjectFilters;
    if (filterKey === "access" && filter.access && filter.access.length > 0)
      fallsInFilters = fallsInFilters && filter.access.includes(`${project.network}`);
    if (filterKey === "lead" && filter.lead && filter.lead.length > 0)
      fallsInFilters = fallsInFilters && filter.lead.includes(`${project.project_lead}`);
    if (filterKey === "members" && filter.members && filter.members.length > 0)
      fallsInFilters = fallsInFilters && filter.members.includes(`${project.project_lead}`);
    if (filterKey === "created_at" && filter.created_at && filter.created_at.length > 0) {
      filter.created_at.forEach((dateFilter) => {
        fallsInFilters =
          fallsInFilters && !!project.created_at && satisfiesDateFilter(new Date(project.created_at), dateFilter);
      });
    }
  });

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
