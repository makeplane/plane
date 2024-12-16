import sortBy from "lodash/sortBy";
import {
  TTeam,
  TTeamDisplayFilters,
  TTeamFilters,
  TTeamOrderByOptions,
} from "@plane/types";

/**
 * @description filters team based on the filters and display filters
 * @param {TTeam} team
 * @param {TTeamFilters} filters
 * @returns {boolean}
 */
export const shouldFilterTeam = (
  team: TTeam,
  filters: TTeamFilters
): boolean => true;

export const orderTeams = (
  teams: TTeam[],
  orderByKey: TTeamOrderByOptions | undefined
): TTeam[] => {
  let orderedTeams: TTeam[] = [];
  if (teams.length === 0) return orderedTeams;

  switch (orderByKey) {
    case "name":
      orderedTeams = sortBy(teams, [(t) => t.name.toLowerCase()]);
      break;
    case "-name":
      orderedTeams = sortBy(teams, [(t) => t.name.toLowerCase()]).reverse();
      break;
    case "created_at":
      orderedTeams = sortBy(teams, [(t) => t.created_at]);
      break;
    case "-created_at":
      orderedTeams = sortBy(teams, [(t) => t.created_at]).reverse();
      break;
    default:
      orderedTeams = teams;
      break;
  }

  return orderedTeams;
};
