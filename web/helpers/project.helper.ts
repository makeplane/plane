import { IProject } from "@plane/types";

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
