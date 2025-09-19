import sortBy from "lodash/sortBy";
import { TTeamspace, TTeamspaceFilters, TTeamspaceOrderByOptions } from "@plane/types";

/**
 * @description filters team based on the filters and display filters
 * @param {TTeamspace} team
 * @param {TTeamFilters} filters
 * @returns {boolean}
 */
export const shouldFilterTeam = (_team: TTeamspace, _filters: TTeamspaceFilters): boolean => true;

export const orderTeams = (teams: TTeamspace[], orderByKey: TTeamspaceOrderByOptions | undefined): TTeamspace[] => {
  let orderedTeams: TTeamspace[] = [];
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
